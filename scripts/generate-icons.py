#!/usr/bin/env python3
"""Generate PWA icons with a dark background and stacked-cards glyph.

Design: near-black #121212 rounded-square background, two overlapping
landscape-oriented rounded rectangles suggesting a stack of presenter cards.
The back card is amber (#F59E0B) and the front card is white (#F5F5F5),
both with subtle corner radii proportional to the icon size.
"""

import os
from PIL import Image, ImageDraw

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "icons")

BACKGROUND_COLOR = (18, 18, 18)     # #121212 — near-black matching dark shell
CARD_BACK_COLOR = (245, 158, 11)    # #F59E0B amber — back card
CARD_FRONT_COLOR = (245, 245, 245)  # #F5F5F5 near-white — front card


def draw_stacked_cards(draw: ImageDraw.ImageDraw, size: int, safe_scale: float) -> None:
    """Draw two overlapping landscape rounded rectangles centred on the icon.

    safe_scale  — fraction of size used for the drawable area (1.0 = full,
                  0.8 = maskable safe zone).  Cards are sized relative to this.
    """
    area = size * safe_scale
    padding = (size - area) / 2

    # Card dimensions: landscape ratio ~5:3
    card_w = area * 0.72
    card_h = area * 0.44
    radius = max(int(size * 0.06), 4)

    # Centre of the icon
    cx = size / 2
    cy = size / 2

    # Back card: shifted up-left slightly
    offset = area * 0.055
    back_x = cx - card_w / 2 - offset
    back_y = cy - card_h / 2 - offset
    _draw_rounded_rect(
        draw,
        (back_x, back_y, back_x + card_w, back_y + card_h),
        radius,
        CARD_BACK_COLOR,
    )

    # Front card: shifted down-right
    front_x = cx - card_w / 2 + offset
    front_y = cy - card_h / 2 + offset
    _draw_rounded_rect(
        draw,
        (front_x, front_y, front_x + card_w, front_y + card_h),
        radius,
        CARD_FRONT_COLOR,
    )

    # Thin amber lines on the front card to suggest text rows
    line_color = (18, 18, 18, 180)
    line_w = max(int(size * 0.012), 1)
    line_margin_x = card_w * 0.12
    line_spacing = card_h * 0.22
    line_x0 = front_x + line_margin_x
    line_x1 = front_x + card_w - line_margin_x
    for row in range(3):
        lx_start = line_x0
        lx_end = line_x1 if row < 2 else line_x0 + (line_x1 - line_x0) * 0.55
        ly = front_y + card_h * 0.28 + row * line_spacing
        draw.line(
            [(lx_start, ly), (lx_end, ly)],
            fill=line_color,
            width=line_w,
        )


def _draw_rounded_rect(
    draw: ImageDraw.ImageDraw,
    bbox: tuple[float, float, float, float],
    radius: int,
    color: tuple[int, ...],
) -> None:
    """Draw a filled rounded rectangle."""
    x0, y0, x1, y1 = (int(v) for v in bbox)
    draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=color)


def generate_icon(size: int, filename: str, maskable: bool = False) -> None:
    """Generate a square icon PNG of the given size.

    Maskable icons use a smaller safe-zone scale (0.80 vs 1.00) so the glyph
    stays well within any squircle or circle mask applied by the OS.
    """
    img = Image.new("RGBA", (size, size), BACKGROUND_COLOR + (255,))
    draw = ImageDraw.Draw(img, "RGBA")

    safe_scale = 0.80 if maskable else 0.88
    draw_stacked_cards(draw, size, safe_scale)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    path = os.path.join(OUTPUT_DIR, filename)
    img.save(path, "PNG")
    print(f"  Generated {path} ({size}x{size}{'  [maskable]' if maskable else ''})")


if __name__ == "__main__":
    print("Generating PWA icons (stacked-cards design)...")
    generate_icon(192, "icon-192.png")
    generate_icon(512, "icon-512.png")
    generate_icon(512, "icon-512-maskable.png", maskable=True)
    print("Done.")
