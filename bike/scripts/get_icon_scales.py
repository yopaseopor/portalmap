import sys
from PIL import Image
import os

def get_image_size(image_path):
    try:
        with Image.open(image_path) as img:
            return img.width, img.height
    except Exception as e:
        print(f"Error reading {image_path}: {e}")
        return None, None

def calculate_scale(width, height, max_size=100):
    if width is None or height is None:
        return 0.02  # fallback
    scale = min(max_size / width, max_size / height)
    return scale

def main():
    if len(sys.argv) < 2:
        print("Usage: python get_icon_scales.py <image_dir>")
        sys.exit(1)
    image_dir = sys.argv[1]
    for fname in os.listdir(image_dir):
        if fname.lower().endswith((".svg", ".png", ".jpg", ".jpeg")):
            path = os.path.join(image_dir, fname)
            w, h = get_image_size(path)
            scale = calculate_scale(w, h)
            print(f"{fname}: {w}x{h} -> scale={scale:.4f}")

if __name__ == "__main__":
    main()
