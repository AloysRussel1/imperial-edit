"""
Génère le logo et le favicon de l'admin Django (monogramme "gemme" doré sur
fond charcoal, cohérent avec l'identité visuelle de la vitrine Next.js).
Usage : python scripts/generate_admin_branding.py
"""

import math
from pathlib import Path

from PIL import Image, ImageDraw

GOLD = (201, 162, 75, 255)
GOLD_LIGHT = (228, 200, 122, 255)
CHARCOAL = (33, 31, 29, 255)
BLACK = (11, 11, 12, 255)

OUT_DIR = Path(__file__).resolve().parent.parent / "static" / "admin" / "img"


def _gem_points(cx: float, cy: float, r: float) -> list[tuple[float, float]]:
    """Sommets d'une étoile à 8 pointes évoquant une gemme taillée, lisible à petite taille."""
    points = []
    for i in range(8):
        angle = math.radians(-90 + i * 45)
        radius = r if i % 2 == 0 else r * 0.55
        points.append((cx + radius * math.cos(angle), cy + radius * math.sin(angle)))
    return points


def make_icon(size: int, background: bool) -> Image.Image:
    scale = 4  # supersampling pour un contour lisse
    canvas = Image.new("RGBA", (size * scale, size * scale), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    cx = cy = (size * scale) / 2

    if background:
        draw.ellipse(
            [size * scale * 0.04, size * scale * 0.04, size * scale * 0.96, size * scale * 0.96],
            fill=CHARCOAL,
        )

    gem_r = size * scale * 0.32
    draw.polygon(_gem_points(cx, cy - size * scale * 0.02, gem_r), fill=GOLD)

    inner_r = gem_r * 0.42
    draw.polygon(_gem_points(cx, cy - size * scale * 0.02, inner_r), fill=GOLD_LIGHT)

    return canvas.resize((size, size), Image.LANCZOS)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    logo = make_icon(256, background=True)
    logo.save(OUT_DIR / "logo.png")

    favicon = make_icon(64, background=True)
    favicon.save(OUT_DIR / "favicon.png")

    print(f"Assets écrits dans {OUT_DIR}")


if __name__ == "__main__":
    main()
