#!/usr/bin/env python3
"""Generate Android launcher icons for the SLP Billing APK from the PWA icons.

- Legacy (pre-Android 8) icons: square + circle-cropped, sized per density.
- Adaptive (Android 8+) foreground from the maskable PWA icon (safe-zone safe).
"""
from PIL import Image, ImageDraw, ImageOps
import os

ROOT = "/home/z/my-project"
SRC_SQUARE = f"{ROOT}/public/icon-512.png"
SRC_MASKABLE = f"{ROOT}/public/icon-maskable-512.png"
RES = f"{ROOT}/android-app/res"

DENSITIES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

square = Image.open(SRC_SQUARE).convert("RGBA")
maskable = Image.open(SRC_MASKABLE).convert("RGBA")

for folder, size in DENSITIES.items():
    outdir = os.path.join(RES, folder)
    os.makedirs(outdir, exist_ok=True)
    # square launcher
    square.resize((size, size), Image.LANCZOS).save(f"{outdir}/ic_launcher.png")
    # circle-cropped launcher (antialiased via 4x supersampled mask)
    big = size * 4
    mask = Image.new("L", (big, big), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, big, big), fill=255)
    mask = mask.resize((size, size), Image.LANCZOS)
    rounded = square.resize((size, size), Image.LANCZOS).convert("RGBA")
    rounded.putalpha(mask)
    rounded.save(f"{outdir}/ic_launcher_round.png")

# adaptive foreground: maskable icon already keeps content inside the safe
# zone; render at 432px (108dp @ xxxhdpi) in drawable-nodpi
outdir = os.path.join(RES, "drawable-nodpi")
os.makedirs(outdir, exist_ok=True)
fg = maskable.resize((432, 432), Image.LANCZOS)
fg.save(f"{outdir}/ic_launcher_fg.png")

print("icons written:")
for folder, size in DENSITIES.items():
    print(f"  {folder}: {size}px")
print(f"  drawable-nodpi/ic_launcher_fg.png: 432px")
