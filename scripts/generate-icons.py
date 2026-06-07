#!/usr/bin/env python3
"""Generate placeholder PWA icons with a dark background and simple glyph.

Final icon polish happens in Phase 7. These are build-time placeholders.
"""

import os
from PIL import Image, ImageDraw, ImageFont

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "icons")

BACKGROUND_COLOR = (18, 18, 18)   # near-black matching the shell dark theme
GLYPH_COLOR = (220, 220, 220)     # near-white glyph


def draw_glyph(draw: ImageDraw.ImageDraw, size: int) -> None:
    """Draw a simple 'PC' monogram centred on the icon."""
    font_size = max(int(size * 0.4), 12)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf", font_size)
    except OSError:
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
        except OSError:
            font = ImageFont.load_default()

    text = "PC"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = (size - text_w) / 2 - bbox[0]
    y = (size - text_h) / 2 - bbox[1]
    draw.text((x, y), text, fill=GLYPH_COLOR, font=font)


def generate_icon(size: int, filename: str, maskable: bool = False) -> None:
    """Generate a square icon PNG of the given size.

    For maskable icons, padding of ~10% is applied so the glyph stays
    within the safe zone of any squircle mask.
    """
    img = Image.new("RGBA", (size, size), BACKGROUND_COLOR + (255,))
    draw = ImageDraw.Draw(img)

    if maskable:
        # Draw a rounded-rect background to hint at shape, glyph stays inside safe zone
        padding = int(size * 0.1)
        draw_glyph_size_override = int(size * 0.35)
        font_size = max(draw_glyph_size_override, 12)
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf", font_size)
        except OSError:
            try:
                font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
            except OSError:
                font = ImageFont.load_default()

        text = "PC"
        bbox = draw.textbbox((0, 0), text, font=font)
        text_w = bbox[2] - bbox[0]
        text_h = bbox[3] - bbox[1]
        x = (size - text_w) / 2 - bbox[0]
        y = (size - text_h) / 2 - bbox[1]
        draw.text((x, y), text, fill=GLYPH_COLOR, font=font)
    else:
        draw_glyph(draw, size)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    path = os.path.join(OUTPUT_DIR, filename)
    img.save(path, "PNG")
    print(f"  Generated {path} ({size}x{size}{'  [maskable]' if maskable else ''})")


if __name__ == "__main__":
    print("Generating placeholder PWA icons...")
    generate_icon(192, "icon-192.png")
    generate_icon(512, "icon-512.png")
    generate_icon(512, "icon-512-maskable.png", maskable=True)
    print("Done.")
