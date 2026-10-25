# -*- coding: utf-8 -*-
"""Generate 5 varian warna webuild_mockup.html — struktur sama, palet berbeda."""
import os, re

BASE = r"D:\Aleph\WeBuild\webuild_mockup.html"
OUT_DIR = r"D:\Aleph\WeBuild\mockups"
os.makedirs(OUT_DIR, exist_ok=True)

with open(BASE, encoding="utf-8") as f:
    base = f.read()

# Hex sumber di mockup asli (dark navy Nauval)
SRC = ["04101B","081B28","0C2433","FFF1C8","91AAB2","F7CF76","64E6BE","E95F46",
       "061421","00070C","FFF8E7","FCEFCB","3a5560","c9b45a66","0a1c2c","12293c",
       "143041","1c3d52","28506488","2a5266","5f7f8f","b8d0da"]

# urutan nilai baru: [bg, surface, surface2, fg, muted, a1(utama), a2(sukses), a3(bahaya),
#   ink, shadow, lightBg, lightHeader, lightMuted, lightDash, termBar, termBorder,
#   blockBorder, inputBorder, dashedSep, aiDash, termDim, termText]
PALETTES = {
    "purple-haze": dict(label="Purple Haze", vals=["131024","1C1636","241B47","EDE4FF","9D8FB8",
        "C4A6FF","7CF2C8","FF6B8B","100A1E","05030E","F6F1FF","E4D7FF","4A3F66","C9B8E666",
        "150E2A","241B47","2A2350","392E66","4A3F8888","4A3F88","7E6FA0","D4C6F0"]),
    "forest-camo": dict(label="Forest Camo", vals=["0C1B12","12291B","193526","EAF7E4","8FAF97",
        "A3E635","FDE047","F87171","071510","020A05","F1F7E8","DCEFC2","3F5A44","AEC98A66",
        "10251A","193526","1E402C","27503A","2E5A3E88","2E5A3E","6B8F74","BDD9B4"]),
    "midnight-blue": dict(label="Midnight Blue", vals=["0B1220","12203A","1A2E4F","E3EEFF","8AA3C2",
        "7DD3FC","34D399","FB7185","08101E","030812","EFF6FF","D6E9FF","3B506E","A9C6F366",
        "0E1C33","1A2E4F","1E3A5F","274B77","33578A88","33578A","64809F","B4CFEF"]),
    "crimson-night": dict(label="Crimson Night", vals=["1D0D14","2A1220","3A1A2C","FFE9F0","C29AA8",
        "FF9EBB","FFD166","9D6BF0","170812","0A0308","FFF0F4","FFD9E5","6B4552","E5B8CC66",
        "2A0F1D","3A1A2C","4A1F38","5E2A48","6B355588","6B3555","9E7588","F0C4D6"]),
    "hellfire": dict(label="Hellfire", vals=["1A0505","2A0A0A","3A0E0E","FFE8E0","C08A80",
        "FF4D2E","FFB454","FFD166","140303","0A0202","FFF2EC","FFD9CC","6B3A30","E5A38F66",
        "200808","3A0E0E","4A1414","611C1C","7A282888","7A2828","A0685F","F0B8A8"]),
}

written = []
for key, p in PALETTES.items():
    html = base
    assert len(SRC) == len(p["vals"]), (key, len(SRC), len(p["vals"]))
    for old, new in zip(SRC, p["vals"]):
        html = html.replace("#"+old, "#"+new)
    html = html.replace("WeBuild Mockup — Neobrutalism",
                        f"WeBuild Mockup — {p['label']}")
    path = os.path.join(OUT_DIR, f"mockup_{key}.html")
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    written.append((path, p["label"]))
    # sanity: tidak ada hex lama tersisa
    assert "#04101B" not in html, key
    print(f"OK {path}")

print("\nGenerated:", len(written))
