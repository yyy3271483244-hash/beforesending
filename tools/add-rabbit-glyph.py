from pathlib import Path

from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont


font_path = Path(__file__).parents[1] / "public" / "fonts" / "PFanHuTuTi.ttf"
font = TTFont(font_path)
cmap = font.getBestCmap()

if ord("兔") not in cmap:
    dot_pen = TTGlyphPen(None)
    dot_pen.moveTo((0, 54))
    dot_pen.curveTo((22, 48), (69, 16), (91, -7))
    dot_pen.curveTo((104, -22), (96, -48), (72, -45))
    dot_pen.curveTo((44, -39), (13, -10), (0, 18))
    dot_pen.closePath()
    font["glyf"]["rabbitDot"] = dot_pen.glyph()

    rabbit_pen = TTGlyphPen({"uni514D": None, "rabbitDot": None})
    rabbit_pen.addComponent("uni514D", (1, 0, 0, 1, 0, 0))
    rabbit_pen.addComponent("rabbitDot", (1, 0, 0, 1, 724, -6))
    font["glyf"]["uni5154"] = rabbit_pen.glyph()

    font["hmtx"]["rabbitDot"] = (0, 0)
    font["hmtx"]["uni5154"] = font["hmtx"]["uni514D"]
    if "vmtx" in font:
        font["vmtx"]["rabbitDot"] = (1000, 0)
        font["vmtx"]["uni5154"] = font["vmtx"]["uni514D"]

    for table in font["cmap"].tables:
        if table.isUnicode():
            table.cmap[ord("兔")] = "uni5154"

    font.save(font_path)
