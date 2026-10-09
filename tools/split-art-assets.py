from pathlib import Path
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "public" / "assets" / "art"


def trim_and_save(image, box, name, padding=12):
    crop = image.crop(box)
    alpha = crop.getchannel("A")
    bbox = alpha.getbbox()
    if bbox:
        crop = crop.crop(bbox)
    output = Image.new("RGBA", (crop.width + padding * 2, crop.height + padding * 2))
    output.alpha_composite(crop, (padding, padding))
    output.save(ART / name)


def main():
    ART.mkdir(parents=True, exist_ok=True)

    characters = Image.open(ART / "characters-sheet.png").convert("RGBA")
    width, height = characters.size
    character_boxes = {
        "characters-connected.png": (0, 0, width // 3, height // 2),
        "characters-seated.png": (width // 3, 0, width * 2 // 3, height // 2),
        "characters-conflict.png": (width * 2 // 3, 0, width, height // 2),
        "characters-separated.png": (0, height // 2, width * 2 // 5, height),
        "character-leaving.png": (width * 2 // 5, height // 2, width * 2 // 3, height),
        "character-writing.png": (width * 2 // 3, height // 2, width, height),
    }
    for name, box in character_boxes.items():
        trim_and_save(characters, box, name)

    tools = Image.open(ART / "tools-sheet.png").convert("RGBA")
    width, height = tools.size
    for index, name in enumerate(("pen-fountain.png", "pen-pencil.png", "pen-ballpoint.png")):
        trim_and_save(tools, (width * index // 3, 0, width * (index + 1) // 3, height), name)

    postal = Image.open(ART / "postal-sheet.png").convert("RGBA")
    width, height = postal.size
    trim_and_save(postal, (0, 0, int(width * 0.43), int(height * 0.34)), "envelope-ash.png")
    trim_and_save(postal, (0, int(height * 0.31), int(width * 0.43), int(height * 0.67)), "envelope-blue.png")
    trim_and_save(postal, (0, int(height * 0.64), int(width * 0.43), height), "envelope-wine.png")
    trim_and_save(postal, (int(width * 0.40), int(height * 0.24), int(width * 0.62), int(height * 0.70)), "postmark-tool.png")
    trim_and_save(postal, (int(width * 0.59), 0, width, height), "mailbox-blue.png")

    stamps = Image.open(ART / "stamps-sheet.png").convert("RGBA")
    width, height = stamps.size
    stamp_names = ("stamp-distance.png", "stamp-window.png", "stamp-night.png", "stamp-flowers.png")
    for index, name in enumerate(stamp_names):
        trim_and_save(stamps, (width * index // 4, 0, width * (index + 1) // 4, height), name, padding=8)

    print(f"Prepared art assets in {ART}")


if __name__ == "__main__":
    main()
