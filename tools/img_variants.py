#!/usr/bin/env python3
"""Gera versões menores (480w, 768w e 1000w) das fotos de img/portfolio/ para o srcset.

Uso: python3 tools/img_variants.py        (precisa do Pillow: pip install pillow)
Rode sempre que trocar ou adicionar uma foto em img/portfolio/ e depois rode tools/build.py.
A foto original continua sendo usada na galeria ampliada; as versões menores só
são entregues a telas pequenas.
"""
import re
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("Falta o Pillow: pip install pillow")

ROOT = Path(__file__).resolve().parent.parent
WIDTHS = (480, 768, 1000)
QUALITY = 74
VARIANT = re.compile(r"-\d+w\.webp$")


def main():
    made = saved = 0
    for src in sorted((ROOT / "img" / "portfolio").glob("*.webp")):
        if VARIANT.search(src.name):
            continue
        # remove versões de larguras que não são mais usadas
        for old in src.parent.glob(f"{src.stem}-*w.webp"):
            if int(re.search(r"-(\d+)w\.webp$", old.name).group(1)) not in WIDTHS:
                old.unlink()
        with Image.open(src) as im:
            w, h = im.size
            for tw in WIDTHS:
                out = src.with_name(f"{src.stem}-{tw}w.webp")
                if w <= tw * 1.15:  # não vale reduzir quase nada
                    if out.exists():
                        out.unlink()
                    continue
                if out.exists() and out.stat().st_mtime >= src.stat().st_mtime:
                    continue
                th = round(h * tw / w)
                im.convert("RGB").resize((tw, th), Image.LANCZOS).save(out, "WEBP", quality=QUALITY, method=6)
                made += 1
                print(f"{out.name}: {tw}x{th}, {out.stat().st_size // 1024} KB (original {src.stat().st_size // 1024} KB)")
                saved += src.stat().st_size - out.stat().st_size
    print(f"{made} versões geradas.")


if __name__ == "__main__":
    main()
