from pathlib import Path
import os
import re

ROOT = Path(__file__).resolve().parent
print(ROOT)
CSV_PATH = ROOT / "personnages.csv"
print(CSV_PATH)

body = os.environ["ISSUE_BODY"]

def extract(field):
    pattern = rf"{field}\n(.+)"
    match = re.search(pattern, body)
    if not match:
        raise ValueError(f"Champ manquant: {field}")
    return match.group(1).strip()

nom = extract("Nom")
avatar = extract("Avatar")
groupe = extract("Groupe")
ptype = extract("Type")

with CSV_PATH.open("a", encoding="utf-8") as f:
    f.write(f'\n"{nom}","{avatar}","{groupe}","{ptype}"')
