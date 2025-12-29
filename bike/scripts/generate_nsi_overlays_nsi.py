import os
import json
import requests
import tkinter as tk
from tkinter import messagebox, filedialog, scrolledtext
from tkinter import ttk
import threading
import queue

# --- Instructions in English, Spanish, and Catalan ---
INSTRUCTIONS = {
    'en': (
        """
Step 1: Download and run this script using Python 3.
Step 2: Click the 'Select config.js' button and choose your config.js file.
Step 3: Click 'Generate Overlays'. The script will fetch all NSI brands and insert overlays at the placeholder in config.js.
Step 4: Review your config.js file. All overlays will be added after the line:
    // --- NSI Brand Overlays (auto-generated) ---
Step 5: Save and use your updated config.js!
        """.strip(),
        "Instructions (English)"
    ),
    'es': (
        """
Paso 1: Descarga y ejecuta este script usando Python 3.
Paso 2: Haz clic en el botón 'Seleccionar config.js' y elige tu archivo config.js.
Paso 3: Haz clic en 'Generar Overlays'. El script descargará todas las marcas NSI y añadirá los overlays en el marcador del config.js.
Paso 4: Revisa tu archivo config.js. Todos los overlays se añadirán tras la línea:
    // --- NSI Brand Overlays (auto-generated) ---
Paso 5: ¡Guarda y usa tu config.js actualizado!
        """.strip(),
        "Instrucciones (Español)"
    ),
    'ca': (
        """
Pas 1: Descarrega i executa aquest script amb Python 3.
Pas 2: Fes clic a 'Selecciona config.js' i tria el teu fitxer config.js.
Pas 3: Fes clic a 'Genera Overlays'. L'script descarregarà totes les marques NSI i afegirà els overlays al marcador del config.js.
Pas 4: Revisa el teu fitxer config.js. Tots els overlays s'afegiran després de la línia:
    // --- NSI Brand Overlays (auto-generated) ---
Pas 5: Desa i utilitza el teu config.js actualitzat!
        """.strip(),
        "Instruccions (Català)"
    )
}

# --- NSI categories for group names (English) ---
CATEGORY_MAP = {
    'shop': 'Shops',
    'amenity': 'Amenities',
    'office': 'Offices',
    'leisure': 'Leisure',
    'tourism': 'Tourism',
    'craft': 'Crafts',
    'emergency': 'Emergency',
    'healthcare': 'Healthcare',
    'man_made': 'Man Made',
    'club': 'Clubs',
    'historic': 'Historic',
    'military': 'Military',
    'natural': 'Natural',
    'religion': 'Religion',
    'route': 'Route',
    'sport': 'Sport',
    'waterway': 'Waterway',
}

# --- Helper to generate Overpass query from tags ---
import re

def escape_overpass(s):
    # Escape double quotes and backslashes for Overpass QL
    return str(s).replace('\\', '\\\\').replace('"', '\\"')

def build_query(tags):
    tag_str = ''.join(f'["{escape_overpass(k)}"="{escape_overpass(v)}"]' for k, v in tags.items())
    return f'(nwr{tag_str}({{bbox}});node(w););out meta;'


# --- Helper to get logo URL ---
def build_logo_url(category, subcategory, brand_id):
    # NSI logo URLs are typically: https://nsi.guide/logo/brands/{category}/{subcategory}/{brand_id}.svg
    # brand_id is usually the entry id in lowercase, without trailing hash
    return f'https://nsi.guide/logo/brands/{category}/{subcategory}/{brand_id}.svg'

# --- Main overlay generator with progress callback ---
def generate_overlays(progress_callback=None):
    overlays = []
    nsi_root = 'https://raw.githubusercontent.com/osmlab/name-suggestion-index/main/data/brands/'
    categories = [
        'shop', 'amenity', 'office', 'leisure', 'tourism', 'craft', 'emergency',
        'healthcare', 'man_made', 'club', 'historic', 'military', 'natural', 'religion', 'route', 'sport', 'waterway'
    ]
    # First, count total items for progress bar
    total_files = 0
    total_items = 0
    file_infos = []
    for category in categories:
        api_url = f'https://api.github.com/repos/osmlab/name-suggestion-index/contents/data/brands/{category}'
        try:
            resp = requests.get(api_url)
            resp.raise_for_status()
            for fileinfo in resp.json():
                if fileinfo['name'].endswith('.json'):
                    file_infos.append((category, fileinfo['name'].replace('.json', ''), fileinfo['download_url']))
                    total_files += 1
        except Exception:
            continue
    # Count total items
    for _, _, url in file_infos:
        try:
            data = requests.get(url).json()
            total_items += len(data.get('items', []))
        except Exception:
            continue
    # Now process with progress
    processed = 0
    for idx, (category, subcat, url) in enumerate(file_infos):
        try:
            data = requests.get(url).json()
            items = data.get('items', [])
        except Exception:
            items = []
        skipped = 0
        for item in items:
            if 'id' not in item:
                skipped += 1
                processed += 1
                if progress_callback:
                    progress_callback(processed, total_items, category, subcat, f"SKIPPED (no id)")
                continue
            tags = item.get('tags', {})
            display_name = item.get('displayName', tags.get('brand', ''))
            group = CATEGORY_MAP.get(category, category.capitalize())
            logo_url = build_logo_url(category, subcat, item['id'].split('-')[0].lower())
            overlay = {
                'group': group,
                'title': display_name,
                'query': build_query(tags),
                'iconSrc': logo_url,
                'iconStyle': 'background-color:rgba(255,255,255,0.4)',
            }
            overlays.append(overlay)
            processed += 1
            if progress_callback:
                progress_callback(processed, total_items, category, subcat, display_name)
    return overlays

# --- GUI Application ---
class NSIOverlayGUI:
    def __init__(self, root):
        self.root = root
        self.root.title('NSI Overlay Generator')
        self.file_path = ''
        self.lang = tk.StringVar(value='en')
        self.skip_current = threading.Event()
        self.stop_requested = threading.Event()
        self.status_queue = queue.Queue()
        self.github_token = tk.StringVar()
        self.create_widgets()

    def create_widgets(self):
        # Language selection
        lang_frame = tk.Frame(self.root)
        tk.Label(lang_frame, text='Language / Idioma / Llengua:').pack(side=tk.LEFT)
        for code, (_, label) in INSTRUCTIONS.items():
            tk.Radiobutton(lang_frame, text=label, variable=self.lang, value=code).pack(side=tk.LEFT)
        lang_frame.pack(pady=5)

        # Instructions
        self.instructions = scrolledtext.ScrolledText(self.root, height=8, width=80, wrap=tk.WORD)
        self.instructions.insert(tk.END, INSTRUCTIONS[self.lang.get()][0])
        self.instructions.config(state=tk.DISABLED)
        self.instructions.pack(pady=5)

        # Update instructions on language change
        def update_instructions(*args):
            self.instructions.config(state=tk.NORMAL)
            self.instructions.delete('1.0', tk.END)
            self.instructions.insert(tk.END, INSTRUCTIONS[self.lang.get()][0])
            self.instructions.config(state=tk.DISABLED)
        self.lang.trace('w', update_instructions)

        # GitHub token entry
        token_frame = tk.Frame(self.root)
        tk.Label(token_frame, text='GitHub Token (optional, for higher API limits):').pack(side=tk.LEFT)
        tk.Entry(token_frame, textvariable=self.github_token, width=40, show='*').pack(side=tk.LEFT)
        token_frame.pack(pady=2)

        # File selection
        file_frame = tk.Frame(self.root)
        tk.Button(file_frame, text='Select config.js / Seleccionar config.js / Selecciona config.js', command=self.select_file).pack(side=tk.LEFT)
        self.file_label = tk.Label(file_frame, text='')
        self.file_label.pack(side=tk.LEFT)
        file_frame.pack(pady=5)

        # Debug log window
        self.debug_log = scrolledtext.ScrolledText(self.root, height=8, width=80, wrap=tk.WORD, state=tk.DISABLED)
        self.debug_log.pack(pady=2)

        # Generate button
        # Progress bar
        self.progress_var = tk.DoubleVar()
        self.progress_bar = tk.ttk.Progressbar(self.root, variable=self.progress_var, maximum=100)
        self.progress_label = tk.Label(self.root, text='')
        self.progress_bar.pack(pady=5, fill=tk.X, padx=20)
        self.progress_label.pack(pady=2)

        # Skip button
        self.skip_btn = tk.Button(self.root, text='Skip Brand / Saltar marca / Salta marca', command=self.set_skip, state=tk.DISABLED)
        self.skip_btn.pack(pady=2)

        # Emergency Stop button
        self.stop_btn = tk.Button(self.root, text='EMERGENCY STOP', command=self.emergency_stop, state=tk.DISABLED, fg='white', bg='red')
        self.stop_btn.pack(pady=2)

        tk.Button(self.root, text='Generate Overlays / Generar Overlays / Genera Overlays', command=self.generate).pack(pady=10)

    def select_file(self):
        path = filedialog.askopenfilename(filetypes=[('JavaScript files', '*.js')])
        if path:
            self.file_path = path
            self.file_label.config(text=os.path.basename(path))

    def set_skip(self):
        self.skip_current.set()

    def emergency_stop(self):
        self.stop_requested.set()

    def generate(self):
        if not self.file_path:
            messagebox.showerror('Error', 'Please select your config.js file first!')
            return
        self.progress_var.set(0)
        self.progress_label.config(text='')
        self.skip_btn.config(state=tk.NORMAL)
        self.stop_btn.config(state=tk.NORMAL)
        self.skip_current.clear()
        self.stop_requested.clear()
        self.status_queue = queue.Queue()
        # Start background thread
        threading.Thread(target=self.generate_thread, daemon=True).start()
        self.root.after(100, self.check_status_queue)

    def check_status_queue(self):
        try:
            while True:
                msg = self.status_queue.get_nowait()
                if msg['type'] == 'progress':
                    self.progress_var.set(msg['percent'])
                    self.progress_label.config(text=msg['text'])
                elif msg['type'] == 'done':
                    self.progress_var.set(100)
                    self.progress_label.config(text=msg['text'])
                    self.skip_btn.config(state=tk.DISABLED)
                    self.stop_btn.config(state=tk.DISABLED)
                    messagebox.showinfo('Success', msg['info'])
                elif msg['type'] == 'error':
                    self.skip_btn.config(state=tk.DISABLED)
                    self.stop_btn.config(state=tk.DISABLED)
                    messagebox.showerror('Error', msg['error'])
                elif msg['type'] == 'debug':
                    self.debug_log.config(state=tk.NORMAL)
                    self.debug_log.insert(tk.END, msg['text'] + '\n')
                    self.debug_log.see(tk.END)
                    self.debug_log.config(state=tk.DISABLED)
                elif msg['type'] == 'warning':
                    messagebox.showwarning('Warning', msg['text'])
        except queue.Empty:
            pass
        if self.skip_btn['state'] == tk.NORMAL:
            self.root.after(100, self.check_status_queue)

    def generate_thread(self):
        try:
            marker = '// --- NSI Brand Overlays (auto-generated) ---'
            with open(self.file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            if marker not in content:
                self.status_queue.put({'type': 'error', 'error': 'Marker not found in config.js!'})
                return
            before, after = content.split(marker, 1)
            overlays_written = 0
            skipped = 0
            overlays_js = []
            token = self.github_token.get().strip()
            session = requests.Session()
            if token:
                session.headers['Authorization'] = f'token {token}'
            def debug(msg):
                self.status_queue.put({'type': 'debug', 'text': msg})
            def warn(msg):
                self.status_queue.put({'type': 'warning', 'text': msg})
            def check_rate_limit(resp):
                if 'X-RateLimit-Remaining' in resp.headers:
                    remaining = int(resp.headers['X-RateLimit-Remaining'])
                    limit = int(resp.headers.get('X-RateLimit-Limit', 60))
                    if remaining <= 10:
                        warn(f'GitHub API rate limit is low: {remaining}/{limit} requests left!')
                    if remaining == 0:
                        raise Exception('GitHub API rate limit exceeded! Please provide a GitHub token or wait.')
            def progress_callback(done, total, category, subcat, brand):
                percent = (done/total)*100 if total else 0
                msg = f"{done}/{total} overlays ({percent:.2f}%) - Category: {category}, Subcategory: {subcat}, Brand: {brand}"
                self.status_queue.put({'type': 'progress', 'percent': percent, 'text': msg})
                # If skip requested, return True to skip this brand
                if self.skip_current.is_set():
                    self.skip_current.clear()
                    return True
                return False
            def overlay_gen():
                nsi_root = 'https://raw.githubusercontent.com/osmlab/name-suggestion-index/main/data/brands/'
                categories = list(CATEGORY_MAP.keys())
                debug(f"Processing categories: {categories}")
                file_infos = []
                for category in categories:
                    api_url = f'https://api.github.com/repos/osmlab/name-suggestion-index/contents/data/brands/{category}'
                    try:
                        resp = session.get(api_url)
                        check_rate_limit(resp)
                        resp.raise_for_status()
                        debug(f"Fetched file list for category '{category}': {len(resp.json())} files")
                        for fileinfo in resp.json():
                            if fileinfo['name'].endswith('.json'):
                                file_infos.append((category, fileinfo['name'].replace('.json', ''), fileinfo['download_url']))
                    except Exception as e:
                        warn(f"Error fetching file list for category '{category}': {e}")
                        continue
                debug(f"Total brand files found: {len(file_infos)}")
                total_items = 0
                for _, _, url in file_infos:
                    try:
                        resp = session.get(url)
                        check_rate_limit(resp)
                        data = resp.json()
                        total_items += len(data.get('items', []))
                    except Exception as e:
                        warn(f"Error counting items in file '{url}': {e}")
                        continue
                debug(f"Total brand items to process: {total_items}")
                processed = 0
                for category, subcat, url in file_infos:
                    try:
                        resp = session.get(url)
                        check_rate_limit(resp)
                        data = resp.json()
                        items = data.get('items', [])
                        debug(f"Processing file '{url}' with {len(items)} items")
                    except Exception as e:
                        warn(f"Error fetching file '{url}': {e}")
                        items = []
                    for item in items:
                        if 'id' not in item:
                            processed += 1
                            yield processed, total_items, category, subcat, 'SKIPPED (no id)', None
                            continue
                        tags = item.get('tags', {})
                        display_name = item.get('displayName', tags.get('brand', ''))
                        group = CATEGORY_MAP.get(category, category.capitalize())
                        # Prefer logo from NSI item if available
                        logo_url = None
                        logos = item.get('logos', {})
                        # 1. Wikimedia Commons
                        if 'wikimedia_commons' in logos and logos['wikimedia_commons'] and 'nsi.guide' not in logos['wikimedia_commons']:
                            logo_url = logos['wikimedia_commons']
                        # 2. Facebook
                        elif 'facebook' in logos and logos['facebook'] and 'nsi.guide' not in logos['facebook']:
                            logo_url = logos['facebook']
                        # 3. Any other logo (prefer non-nsi.guide)
                        elif isinstance(logos, dict) and logos:
                            for k, v in logos.items():
                                if v and 'nsi.guide' not in v:
                                    logo_url = v
                                    break
                        # 4. imageURL if available (non-nsi.guide)
                        if not logo_url and 'imageURL' in item and item['imageURL'] and 'nsi.guide' not in item['imageURL']:
                            logo_url = item['imageURL']
                        # 5. logo or image field (non-nsi.guide)
                        if not logo_url and 'logo' in item and item['logo'] and 'nsi.guide' not in item['logo']:
                            logo_url = item['logo']
                        if not logo_url and 'image' in item and item['image'] and 'nsi.guide' not in item['image']:
                            logo_url = item['image']
                        # 6. Fallback to nsi.guide only if nothing else
                        if not logo_url:
                            # Use full brand id for nsi.guide fallback (not just first part)
                            logo_url = build_logo_url(category, subcat, item['id'].replace(':','_').replace('/','_').replace('#','').lower())

                        # Build Overpass query using only the most specific/reliable tag
                        # Priority: brand:wikidata > brand > name > main tag+brand
                        query = None
                        if 'brand:wikidata' in tags:
                            query = f'(nwr["brand:wikidata"="{tags["brand:wikidata"]}"]({{bbox}});node(w););out meta;'
                        elif 'brand' in tags:
                            query = f'(nwr["brand"="{tags["brand"]}"]({{bbox}});node(w););out meta;'
                        elif 'name' in tags:
                            query = f'(nwr["name"="{tags["name"]}"]({{bbox}});node(w););out meta;'
                        else:
                            # fallback: use main tag (shop/amenity/office/etc) + brand if present
                            main_tag = None
                            for k in ["shop", "amenity", "office", "leisure", "tourism", "craft", "emergency", "healthcare", "man_made", "club", "historic", "military", "natural", "religion", "route", "sport", "waterway"]:
                                if k in tags:
                                    main_tag = k
                                    break
                            if main_tag and 'brand' in tags:
                                query = f'(nwr["{main_tag}"="{tags[main_tag]}"]["brand"="{tags["brand"]}"]({{bbox}});node(w););out meta;'
                            else:
                                # fallback: just main tag
                                if main_tag:
                                    query = f'(nwr["{main_tag}"="{tags[main_tag]}"]({{bbox}});node(w););out meta;'
                                else:
                                    query = '(nwr({{bbox}});node(w););out meta;'
                        overlay = {
                            'group': group,
                            'title': display_name,
                            'query': query,
                            'iconSrc': logo_url,
                            'iconStyle': 'background-color:rgba(255,255,255,0.4)',
                        }
                        processed += 1
                        yield processed, total_items, category, subcat, display_name, overlay
            for done, total, category, subcat, brand, overlay in overlay_gen():
                if self.stop_requested.is_set():
                    # Emergency stop: save partial work and exit
                    js_entries = ',\n'.join(overlays_js)
                    new_content = before + marker + '\n' + js_entries + '\n' + after
                    with open(self.file_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    msg = f"EMERGENCY STOP! {overlays_written} overlays saved. Skipped: {skipped}"
                    self.status_queue.put({'type': 'done', 'text': msg, 'info': f'Process stopped. Partial overlays inserted into config.js!\nSkipped items: {skipped}'})
                    return
                skip = progress_callback(done, total, category, subcat, brand)
                if skip:
                    skipped += 1
                    continue
                if overlay:
                    # Overlay block with NO comments, matching user's exact format
                    entry = (
                        "{\n"
                        f"    group: {json.dumps(overlay['group'])},\n"
                        f"    title: {json.dumps(overlay['title'])},\n"
                        f"    query: {json.dumps(overlay['query'])},\n"
                        f"    iconSrc: {json.dumps(overlay['iconSrc'])},\n"
                        f"    iconStyle: {json.dumps(overlay['iconStyle'])},\n"
                        "    style: function (feature) {\n"
                        "        var key_regex = /^name$/\n"
                        "        var name_key = feature.getKeys().filter(function(t){return t.match(key_regex)}).pop() || \"name\"\n"
                        "        var name = feature.get(name_key) || '';\n"
                        "        var fill = new ol.style.Fill({\n"
                        "            color: 'rgba(255,0,0,0.4)'\n"
                        "        });\n"
                        "        var stroke = new ol.style.Stroke({\n"
                        "            color: 'rgba(255,0,0,1)',\n"
                        "            width: 1\n"
                        "        });\n"
                        "        var style = new ol.style.Style({\n"
                        "            image: new ol.style.Icon({\n"
                        f"                src: {json.dumps(overlay['iconSrc'])},\n"
                        "                scale:0.02\n"
                        "            }),\n"
                        "            text: new ol.style.Text({\n"
                        "                text: name,\n"
                        "                offsetX : 7,\n"
                        "                offsetY : -12,\n"
                        "                fill: new ol.style.Fill({\n"
                        "                    color: 'rgba(0,0,0,1)'\n"
                        "                }),\n"
                        "            }),\n"
                        "            fill: fill,\n"
                        "            stroke: stroke\n"
                        "        });\n"
                        "        return style;\n"
                        "    }\n"
                        "},"
                    )
                    overlays_js.append(entry)
                    overlays_written += 1
            # Fix comma formatting: no leading comma, no double commas
            js_entries = '\n'.join(
                [entry.rstrip(',') if i == len(overlays_js)-1 else entry for i, entry in enumerate(overlays_js)]
            )
            new_content = before + marker + '\n' + js_entries + '\n' + after
            with open(self.file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            msg = f"Done! {overlays_written} overlays generated. Skipped: {skipped}"
            self.status_queue.put({'type': 'done', 'text': msg, 'info': f'NSI overlays inserted into config.js!\nSkipped items: {skipped}'})
        except Exception as e:
            import traceback
            tb = traceback.format_exc()
            self.status_queue.put({'type': 'error', 'error': f"{str(e)}\n\n{tb}"})

if __name__ == '__main__':
    root = tk.Tk()
    app = NSIOverlayGUI(root)
    root.mainloop()
