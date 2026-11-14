"""Draws the app icons and splash image from the brand mark (same geometry as LogoMark.tsx).
Run: python3 scripts/generate-brand-assets.py"""
from PIL import Image, ImageDraw

COBALT = (36, 84, 230, 255)      # #2454E6
COBALT_HI = (52, 104, 248, 255)  # top of the tile gradient
YELLOW = (242, 180, 24, 255)     # #F2B418
WHITE = (255, 255, 255, 255)
SS = 4  # supersampling for smooth edges


def gradient_tile(size, radius):
    tile = Image.new('RGBA', (size, size))
    d = ImageDraw.Draw(tile)
    for y in range(size):
        t = y / max(1, size - 1)
        c = tuple(int(COBALT_HI[i] + (COBALT[i] - COBALT_HI[i]) * t) for i in range(3)) + (255,)
        d.line([(0, y), (size, y)], fill=c)
    mask = Image.new('L', (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    out = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    out.paste(tile, (0, 0), mask)
    return out


def glyph(draw, ox, oy, u, l_color=WHITE, block_color=YELLOW):
    """The white L and the yellow block on a 32-unit grid, origin (ox, oy), u px per unit."""
    p = lambda x, y: (ox + x * u, oy + y * u)
    draw.polygon([p(9, 8), p(13.2, 8), p(13.2, 20.2), p(23, 20.2), p(23, 24), p(9, 24)], fill=l_color)
    x0, y0 = p(17, 8)
    x1, y1 = p(23, 14)
    draw.rounded_rectangle([x0, y0, x1, y1], radius=1.2 * u, fill=block_color)


def render(size, fn):
    big = Image.new('RGBA', (size * SS, size * SS), (0, 0, 0, 0))
    fn(big, size * SS)
    return big.resize((size, size), Image.LANCZOS)


def full_icon(img, s):  # iOS / store icon: full bleed, the OS rounds the corners
    img.paste(gradient_tile(s, 0), (0, 0))
    glyph(ImageDraw.Draw(img), -s * 0.03, -s * 0.03, s / 32 * 1.06)


def mark(img, s):  # the rounded tile with the glyph (splash, favicon)
    img.paste(gradient_tile(s, int(s * 9 / 32)), (0, 0))
    glyph(ImageDraw.Draw(img), 0, 0, s / 32)


def fg(img, s, color=None):  # Android adaptive foreground: glyph inside the 66% safe zone
    u = s / 32 * 0.62
    glyph(ImageDraw.Draw(img), s / 2 - 16 * u, s / 2 - 16 * u, u, *( (color, color) if color else ()))


render(1024, full_icon).save('assets/icon.png')
render(1024, mark).save('assets/splash-icon.png')
render(48, mark).save('assets/favicon.png')
render(1024, fg).save('assets/android-icon-foreground.png')
render(1024, lambda i, s: fg(i, s, WHITE)).save('assets/android-icon-monochrome.png')
bg = Image.new('RGBA', (1024, 1024), COBALT)
bg.save('assets/android-icon-background.png')
print('done')
