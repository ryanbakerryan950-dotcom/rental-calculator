import os
import shutil
from PIL import Image

ASSETS = "assets"
ORIGINALS = os.path.join("images", "originals")
os.makedirs(ORIGINALS, exist_ok=True)
os.makedirs("images", exist_ok=True)


def save_webp_under_100kb(img, out_path, max_bytes=100 * 1024):
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGBA")
    else:
        img = img.convert("RGB")
    quality = 85
    while quality >= 40:
        img.save(out_path, "WEBP", quality=quality, method=6)
        if os.path.getsize(out_path) <= max_bytes:
            return quality
        quality -= 5
    w, h = img.size
    scale = 0.9
    while scale >= 0.4:
        nw, nh = int(w * scale), int(h * scale)
        resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
        quality = 80
        while quality >= 40:
            resized.save(out_path, "WEBP", quality=quality, method=6)
            if os.path.getsize(out_path) <= max_bytes:
                return quality
            quality -= 5
        scale -= 0.1
    return quality


for name in os.listdir(ASSETS):
    if not name.lower().endswith(".png"):
        continue
    src = os.path.join(ASSETS, name)
    backup = os.path.join(ORIGINALS, name)
    if not os.path.exists(backup):
        shutil.copy2(src, backup)
    img = Image.open(src)
    webp_name = os.path.splitext(name)[0] + ".webp"
    out = os.path.join(ASSETS, webp_name)
    q = save_webp_under_100kb(img, out)
    print(f"{name} -> {webp_name} ({os.path.getsize(out)} bytes)")

hero_src = os.path.join(ORIGINALS, "hero-building.png")
if not os.path.exists(hero_src):
    hero_src = os.path.join(ASSETS, "hero-building.png")
img = Image.open(hero_src).convert("RGB")
target_w, target_h = 1200, 630
src_w, src_h = img.size
scale = max(target_w / src_w, target_h / src_h)
new_w, new_h = int(src_w * scale), int(src_h * scale)
img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
left = (new_w - target_w) // 2
top = (new_h - target_h) // 2
img = img.crop((left, top, left + target_w, top + target_h))
preview = os.path.join("images", "hero-preview.webp")
save_webp_under_100kb(img, preview)
print(f"hero-preview.webp ({os.path.getsize(preview)} bytes)")
