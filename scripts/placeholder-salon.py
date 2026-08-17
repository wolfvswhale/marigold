"""Temporary stand-ins for the salon photographs.

These are soft abstract washes, not pretend photographs. They exist so the
rotating backdrop can be built and checked before the real pictures arrive.
Replace public/salon/1..4.jpg with real images and delete this script.

    python3 scripts/placeholder-salon.py
"""
from PIL import Image, ImageDraw, ImageFilter
import os, math

W, H = 1600, 1000
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "salon")
os.makedirs(OUT, exist_ok=True)

# Warm palettes, one per picture, in the same family as the page.
PALETTES = [
    [(232, 206, 170), (198, 160, 112), (120, 92, 62)],
    [(238, 222, 198), (176, 150, 118), (94, 82, 68)],
    [(228, 212, 190), (206, 168, 118), (140, 118, 94)],
    [(240, 228, 208), (188, 154, 106), (108, 96, 80)],
]

for n, pal in enumerate(PALETTES, start=1):
    img = Image.new("RGB", (W, H), pal[0])
    d = ImageDraw.Draw(img, "RGBA")

    # A few big soft shapes, angled differently each time.
    for i in range(7):
        ang = (i * 37 + n * 23) % 360
        cx = W * (0.15 + 0.12 * i) + math.cos(math.radians(ang)) * 180
        cy = H * (0.20 + 0.10 * i) + math.sin(math.radians(ang)) * 140
        r = 260 + 60 * ((i + n) % 4)
        col = pal[(i + n) % len(pal)]
        d.ellipse([cx - r, cy - r * 0.7, cx + r, cy + r * 0.7], fill=col + (150,))

    img = img.filter(ImageFilter.GaussianBlur(radius=95))
    img.save(os.path.join(OUT, f"{n}.jpg"), quality=82, optimize=True)
    print("wrote", f"{n}.jpg")
