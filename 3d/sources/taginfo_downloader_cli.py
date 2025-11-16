#!/usr/bin/env python3
"""
Taginfo API CSV Downloader - Command Line Version
Downloads all pages from Taginfo API and combines them into one CSV file
"""

import requests
import csv
import time
import argparse
import sys
from datetime import datetime, timedelta

def download_taginfo_data(output_file, timeout=30, pause=1.0, verbose=False, max_pages=None):
    """
    Download all pages from Taginfo API and save to CSV file

    Args:
        output_file (str): Path to output CSV file
        timeout (int): Request timeout in seconds
        pause (float): Pause between requests in seconds
        verbose (bool): Enable verbose output
        max_pages (int): Maximum number of pages to download (optional)
    """

    base_url = "https://taginfo.openstreetmap.org/api/4/tags/popular"
    params = {
        'sortname': 'count_all',
        'sortorder': 'desc',
        'rp': 42,  # results per page
        'format': 'csv'
    }

    start_time = time.time()
    all_data = []
    page = 1
    total_pages = 0

    def log(message):
        if verbose:
            timestamp = datetime.now().strftime("%H:%M:%S")
            print(f"[{timestamp}] {message}")

    try:
        log(f"Starting download to: {output_file}")

        while True:
            # Check if we've hit the max pages limit
            if max_pages and page > max_pages:
                log(f"Reached maximum page limit ({max_pages})")
                break

            page_url = f"{base_url}?{'&'.join([f'{k}={v}' for k, v in params.items()])}&page={page}"

            log(f"Downloading page {page}")

            try:
                response = requests.get(page_url, timeout=timeout)

                if response.status_code == 200:
                    # Parse CSV response
                    csv_content = response.text.strip()
                    lines = csv_content.split('\n')

                    if len(lines) <= 1 or not lines[0].strip():
                        # Empty response or only header - we've reached the end
                        log(f"Page {page} is empty, stopping download")
                        break

                    # Parse CSV data
                    csv_reader = csv.reader(lines)
                    page_data = list(csv_reader)

                    if page == 1:
                        # Include header for first page
                        all_data.extend(page_data)
                        entries_count = len(page_data)
                    else:
                        # Skip header for subsequent pages
                        if len(page_data) > 1:
                            all_data.extend(page_data[1:])
                            entries_count = len(page_data) - 1
                        else:
                            entries_count = 0

                    total_pages = page
                    log(f"Page {page} downloaded successfully ({entries_count} entries)")

                    # If this page has no data entries, we've reached the end
                    if entries_count == 0:
                        log(f"Page {page} has no data, stopping download")
                        break

                else:
                    log(f"Failed to download page {page}: HTTP {response.status_code}")
                    if response.status_code == 404 or response.status_code == 400:
                        # These errors likely mean we've reached the end
                        log(f"API indicates end of data at page {page}")
                        break
                    else:
                        # For other errors, we might want to retry or stop
                        print(f"Error: Failed to download page {page}: HTTP {response.status_code}")
                        return False

            except requests.exceptions.RequestException as e:
                log(f"Error downloading page {page}: {e}")
                print(f"Error downloading page {page}: {e}")
                return False

            page += 1

            # Pause between requests (except after last page)
            if max_pages is None or page <= max_pages:
                log(f"Pausing for {pause} seconds...")
                time.sleep(pause)

        # Save combined data if we have any
        if all_data:
            log(f"Saving {len(all_data)} rows to {output_file}")

            with open(output_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerows(all_data)

            total_time = time.time() - start_time
            log(f"Download completed in {timedelta(seconds=int(total_time))}! "
                f"Downloaded {total_pages} pages with {len(all_data)} total rows")

            return True
        else:
            log("No data downloaded")
            return False

    except KeyboardInterrupt:
        print("\nDownload interrupted by user")
        return False
    except Exception as e:
        print(f"Unexpected error: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Download Taginfo API data to CSV")
    parser.add_argument("output", help="Output CSV file path")
    parser.add_argument("-t", "--timeout", type=int, default=30,
                       help="Request timeout in seconds (default: 30)")
    parser.add_argument("-p", "--pause", type=float, default=1.0,
                       help="Pause between requests in seconds (default: 1.0)")
    parser.add_argument("-v", "--verbose", action="store_true",
                       help="Enable verbose output")
    parser.add_argument("-m", "--max-pages", type=int,
                       help="Maximum number of pages to download (default: unlimited)")

    args = parser.parse_args()

    if args.verbose:
        print("Taginfo API CSV Downloader")
        print(f"Output file: {args.output}")
        print(f"Timeout: {args.timeout}s")
        print(f"Pause: {args.pause}s")
        if args.max_pages:
            print(f"Max pages: {args.max_pages}")
        print("-" * 50)

    success = download_taginfo_data(
        args.output,
        timeout=args.timeout,
        pause=args.pause,
        verbose=args.verbose,
        max_pages=args.max_pages
    )

    if success:
        print(f"\n✅ Successfully downloaded data to: {args.output}")
        sys.exit(0)
    else:
        print(f"\n❌ Download failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
