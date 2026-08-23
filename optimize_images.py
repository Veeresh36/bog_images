"""
Batch-resize and recompress .webp images for veereshbashetti.com.
"""

import os
from PIL import Image

MAX_WIDTH = 1200
QUALITY = 78
SRC_DIR = "."
OUT_DIR = "optimized"
MIN_SAVINGS_KB = 5

os.makedirs(OUT_DIR, exist_ok=True)

total_before = 0
total_after = 0
processed = 0

for fname in os.listdir(SRC_DIR):
    if not fname.lower().endswith(".webp"):
        continue

    src_path = os.path.join(SRC_DIR, fname)
    if not os.path.isfile(src_path):
        continue

    before_size = os.path.getsize(src_path)

    try:
        im = Image.open(src_path).convert("RGB")
    except Exception as e:
        print(f"SKIP (couldn't open): {fname} - {e}")
        continue

    w, h = im.size
    if w > MAX_WIDTH:
        new_h = int(MAX_WIDTH * h / w)
        im = im.resize((MAX_WIDTH, new_h), Image.LANCZOS)

    out_path = os.path.join(OUT_DIR, fname)
    im.save(out_path, "WEBP", quality=QUALITY, method=6)

    after_size = os.path.getsize(out_path)
    savings_kb = (before_size - after_size) / 1024

    if savings_kb < MIN_SAVINGS_KB:
        os.remove(out_path)
        print(f"KEEP ORIGINAL (already efficient): {fname}")
        continue

    total_before += before_size
    total_after += after_size
    processed += 1
    print(f"{fname}: {before_size/1024:.0f} KB -> {after_size/1024:.0f} KB ({100*(1-after_size/before_size):.0f}% smaller)")

print("\n" + "=" * 50)
print(f"Processed: {processed} images")
if total_before:
    print(f"Total: {total_before/1024:.0f} KB -> {total_after/1024:.0f} KB ({100*(1-total_after/total_before):.0f}% smaller)")
print(f"\nCheck ./{OUT_DIR}/ - if it looks good, copy those files over the originals, commit, and push.")
print("jsDelivr cache: purge via https://www.jsdelivr.com/tools/purge since @main is cached ~7 days.")
