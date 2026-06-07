#!/usr/bin/env python3
"""Generate placeholder PWA icons with a dark background and simple glyph.

Final icon polish happens in Phase 7. These are build-time placeholders.
"""

import os
from PIL import Image, ImageDraw, ImageFont

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "icons")

BACKGROUND_COLOR = (18, 18, 18)   # near-black matching the shell dark theme
GLYPH_COLOR = (220, 220, 220)     # near-white glyph

FONT_PATHS = (
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
)


def load_font(font_size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    """Load the first available bold font, falling back to Pillow's default."""
    for path in FONT_PATHS:
        try:
            return ImageFont.truetype(path, font_size)
        except OSError:
            continue
    return ImageFont.load_default()


def draw_glyph(draw: ImageDraw.ImageDraw, size: int, scale: float) -> None:
    """Draw a 'PC' monogram centred on the icon at the given glyph scale."""
    font = load_font(max(int(size * scale), 12))
    text = "PC"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = (size - text_w) / 2 - bbox[0]
    y = (size - text_h) / 2 - bbox[1]
    draw.text((x, y), text, fill=GLYPH_COLOR, font=font)


def generate_icon(size: int, filename: str, maskable: bool = False) -> None:
    """Generate a square icon PNG of the given size.

    Maskable icons use a smaller glyph (35% vs 40% of the icon size) so it
    stays within the safe zone of any squircle mask.
    """
    img = Image.new("RGBA", (size, size), BACKGROUND_COLOR + (255,))
    draw = ImageDraw.Draw(img)
    draw_glyph(draw, size, scale=0.35 if maskable else 0.4)

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
