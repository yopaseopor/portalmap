#!/usr/bin/env python3
"""
Taginfo API CSV Downloader with GUI
Downloads all pages from Taginfo API and combines them into a single CSV file
"""

import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import requests
import csv
import time
import threading
import queue
import os
from datetime import datetime, timedelta
import sys

class TaginfoDownloader:
    def __init__(self, root):
        self.root = root
        self.root.title("Taginfo API CSV Downloader")
        self.root.geometry("600x500")

        # API configuration
        self.base_url = "https://taginfo.openstreetmap.org/api/4/tags/popular"
        self.params = {
            'sortname': 'count_all',
            'sortorder': 'desc',
            'rp': 42,  # results per page
            'format': 'csv'
        }

        # State variables
        self.is_downloading = False
        self.current_page = 0
        self.start_time = None
        self.all_data = []
        self.total_pages = 0

        # GUI elements
        self.create_gui()

        # Queue for thread communication
        self.queue = queue.Queue()

    def create_gui(self):
        # Main frame
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))

        # Configure grid weights
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(1, weight=1)

        # Output file selection
        ttk.Label(main_frame, text="Output CSV File:").grid(row=0, column=0, sticky=tk.W, pady=5)
        self.output_path = tk.StringVar()
        self.output_entry = ttk.Entry(main_frame, textvariable=self.output_path, width=50)
        self.output_entry.grid(row=0, column=1, sticky=(tk.W, tk.E), pady=5, padx=(5, 0))

        browse_btn = ttk.Button(main_frame, text="Browse...", command=self.browse_file)
        browse_btn.grid(row=0, column=2, sticky=tk.W, pady=5, padx=(5, 0))

        # Settings frame
        settings_frame = ttk.LabelFrame(main_frame, text="Download Settings", padding="5")
        settings_frame.grid(row=1, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=10)

        # Timeout setting
        ttk.Label(settings_frame, text="Request Timeout (s):").grid(row=0, column=0, sticky=tk.W)
        self.timeout_var = tk.IntVar(value=30)
        timeout_spin = ttk.Spinbox(settings_frame, from_=10, to=120, width=10,
                                  textvariable=self.timeout_var)
        timeout_spin.grid(row=0, column=1, sticky=tk.W, pady=2)

        # Pause between requests
        ttk.Label(settings_frame, text="Pause between requests (s):").grid(row=1, column=0, sticky=tk.W)
        self.pause_var = tk.DoubleVar(value=1.0)
        pause_spin = ttk.Spinbox(settings_frame, from_=0.5, to=5.0, increment=0.5, width=10,
                                textvariable=self.pause_var)
        pause_spin.grid(row=1, column=1, sticky=tk.W, pady=2)

        # Progress section
        progress_frame = ttk.LabelFrame(main_frame, text="Progress", padding="5")
        progress_frame.grid(row=2, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=10)

        # Progress bar
        self.progress_var = tk.DoubleVar()
        self.progress_bar = ttk.Progressbar(progress_frame, variable=self.progress_var,
                                          maximum=100, mode='determinate')
        self.progress_bar.grid(row=0, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=5)

        # Status labels
        self.status_var = tk.StringVar(value="Ready")
        status_label = ttk.Label(progress_frame, textvariable=self.status_var)
        status_label.grid(row=1, column=0, sticky=tk.W)

        self.pages_var = tk.StringVar(value="Pages: 0")
        pages_label = ttk.Label(progress_frame, textvariable=self.pages_var)
        pages_label.grid(row=1, column=1, sticky=tk.W)

        self.time_var = tk.StringVar(value="Time remaining: --:--:--")
        time_label = ttk.Label(progress_frame, textvariable=self.time_var)
        time_label.grid(row=1, column=2, sticky=tk.W)

        # Control buttons
        button_frame = ttk.Frame(main_frame)
        button_frame.grid(row=3, column=0, columnspan=3, pady=10)

        self.start_btn = ttk.Button(button_frame, text="Start Download",
                                  command=self.start_download)
        self.start_btn.grid(row=0, column=0, padx=5)

        self.stop_btn = ttk.Button(button_frame, text="Stop Download",
                                 command=self.stop_download, state=tk.DISABLED)
        self.stop_btn.grid(row=0, column=1, padx=5)

        # Log area
        log_frame = ttk.LabelFrame(main_frame, text="Log", padding="5")
        log_frame.grid(row=4, column=0, columnspan=3, sticky=(tk.W, tk.E, tk.N, tk.S), pady=10)

        self.log_text = tk.Text(log_frame, height=10, width=70, wrap=tk.WORD)
        scrollbar = ttk.Scrollbar(log_frame, orient=tk.VERTICAL, command=self.log_text.yview)
        self.log_text.configure(yscrollcommand=scrollbar.set)

        self.log_text.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        scrollbar.grid(row=0, column=1, sticky=(tk.N, tk.S))

        log_frame.columnconfigure(0, weight=1)
        log_frame.rowconfigure(0, weight=1)

        # Menu bar
        menubar = tk.Menu(self.root)
        self.root.config(menu=menubar)

        file_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="File", menu=file_menu)
        file_menu.add_command(label="Exit", command=self.root.quit)

        help_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="Help", menu=help_menu)
        help_menu.add_command(label="About", command=self.show_about)

    def browse_file(self):
        filename = filedialog.asksaveasfilename(
            defaultextension=".csv",
            filetypes=[("CSV files", "*.csv"), ("All files", "*.*")]
        )
        if filename:
            self.output_path.set(filename)

    def log_message(self, message):
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.log_text.insert(tk.END, f"[{timestamp}] {message}\n")
        self.log_text.see(tk.END)

    def update_progress(self, current, total, status=""):
        if total > 0:
            percentage = (current / total) * 100
            self.progress_var.set(percentage)

        if status:
            self.status_var.set(status)

        self.pages_var.set(f"Pages: {current}")
        self.root.update()

    def update_time_estimate(self):
        if self.start_time and self.current_page > 0:
            elapsed = time.time() - self.start_time
            avg_time_per_page = elapsed / self.current_page
            # Estimate remaining pages (rough estimate based on current rate)
            remaining_pages = max(10, self.current_page * 2)  # Conservative estimate
            remaining_seconds = avg_time_per_page * remaining_pages

            remaining_time = timedelta(seconds=int(remaining_seconds))
            self.time_var.set(f"Time remaining: ~{remaining_time}")
        else:
            self.time_var.set("Time remaining: --:--:--")

    def start_download(self):
        if not self.output_path.get():
            messagebox.showerror("Error", "Please select an output file path")
            return

        self.is_downloading = True
        self.start_time = time.time()
        self.current_page = 0
        self.all_data = []
        self.total_pages = 0

        self.start_btn.config(state=tk.DISABLED)
        self.stop_btn.config(state=tk.NORMAL)

        self.log_message("Starting download...")

        # Start download in separate thread
        self.download_thread = threading.Thread(target=self.download_all_pages)
        self.download_thread.daemon = True
        self.download_thread.start()

        # Start GUI update loop
        self.update_gui()

    def stop_download(self):
        self.is_downloading = False
        self.log_message("Download stopped by user")

    def download_all_pages(self):
        try:
            page = 1

            while self.is_downloading:
                page_url = f"{self.base_url}?{'&'.join([f'{k}={v}' for k, v in self.params.items()])}&page={page}"

                self.log_message(f"Downloading page {page}")
                self.queue.put(('downloading', page))

                try:
                    response = requests.get(page_url, timeout=self.timeout_var.get())

                    if response.status_code == 200:
                        # Parse CSV response
                        csv_content = response.text.strip()
                        lines = csv_content.split('\n')

                        if len(lines) <= 1 or not lines[0].strip():
                            # Empty response or only header - we've reached the end
                            self.log_message(f"Page {page} is empty, stopping download")
                            break

                        # Parse CSV data
                        csv_reader = csv.reader(lines)
                        page_data = list(csv_reader)

                        if page == 1:
                            # Include header for first page
                            self.all_data.extend(page_data)
                            entries_count = len(page_data)
                        else:
                            # Skip header for subsequent pages
                            if len(page_data) > 1:
                                self.all_data.extend(page_data[1:])
                                entries_count = len(page_data) - 1
                            else:
                                entries_count = 0

                        self.current_page = page
                        self.total_pages = page

                        entries_text = f"({entries_count} entries)" if entries_count > 0 else "(no entries)"
                        self.log_message(f"Page {page} downloaded successfully {entries_text}")

                        # If this page has no data entries, we've reached the end
                        if entries_count == 0:
                            self.log_message(f"Page {page} has no data, stopping download")
                            break

                    elif response.status_code == 404 or response.status_code == 400:
                        # These errors likely mean we've reached the end
                        self.log_message(f"API indicates end of data at page {page}")
                        break
                    else:
                        self.log_message(f"Failed to download page {page}: HTTP {response.status_code}")
                        self.queue.put(('error', f"Failed to download page {page}: HTTP {response.status_code}"))
                        break

                except requests.exceptions.RequestException as e:
                    self.log_message(f"Error downloading page {page}: {e}")
                    self.queue.put(('error', f"Error downloading page {page}: {e}"))
                    break

                page += 1

                # Pause between requests
                if self.is_downloading:
                    pause_time = self.pause_var.get()
                    self.log_message(f"Pausing for {pause_time} seconds...")
                    time.sleep(pause_time)

            # Save combined data
            if self.is_downloading and self.all_data:
                try:
                    with open(self.output_path.get(), 'w', newline='', encoding='utf-8') as f:
                        writer = csv.writer(f)
                        writer.writerows(self.all_data)

                    self.log_message(f"Download completed! Saved {len(self.all_data)} rows to {self.output_path.get()}")

                    total_time = time.time() - self.start_time
                    self.log_message(f"Total time: {timedelta(seconds=int(total_time))}")

                except Exception as e:
                    self.log_message(f"Error saving file: {e}")
                    self.queue.put(('error', f"Error saving file: {e}"))

            self.queue.put(('complete', None))

        except Exception as e:
            self.log_message(f"Unexpected error: {e}")
            self.queue.put(('error', f"Unexpected error: {e}"))

    def update_gui(self):
        try:
            while True:
                msg_type, data = self.queue.get_nowait()

                if msg_type == 'downloading':
                    self.update_progress(data, max(data, 10), f"Downloading page {data}")
                    self.update_time_estimate()

                elif msg_type == 'complete':
                    self.is_downloading = False
                    self.start_btn.config(state=tk.NORMAL)
                    self.stop_btn.config(state=tk.DISABLED)
                    self.update_progress(self.total_pages, self.total_pages, "Download complete!")

                    if self.all_data:
                        messagebox.showinfo("Success",
                                          f"Download completed!\nSaved {len(self.all_data)} rows to:\n{self.output_path.get()}")

                elif msg_type == 'error':
                    self.is_downloading = False
                    self.start_btn.config(state=tk.NORMAL)
                    self.stop_btn.config(state=tk.DISABLED)
                    self.status_var.set("Error")
                    messagebox.showerror("Error", str(data))

        except queue.Empty:
            pass

        if self.is_downloading:
            self.root.after(100, self.update_gui)  # Check again in 100ms

    def show_about(self):
        messagebox.showinfo("About",
                          "Taginfo API CSV Downloader\n\n"
                          "Downloads all pages from the Taginfo API\n"
                          "and combines them into a single CSV file.\n\n"
                          "Features:\n"
                          "- Downloads pages until API returns no data\n"
                          "- Progress tracking\n"
                          "- Time estimates\n"
                          "- Configurable timeouts\n"
                          "- Pause between requests\n"
                          "- Error handling")

def main():
    root = tk.Tk()
    app = TaginfoDownloader(root)
    root.mainloop()

if __name__ == "__main__":
    main()
