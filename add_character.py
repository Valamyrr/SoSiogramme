import os
import re


FILE = os.path.dirname(__file__)
CSV_PATH = os.path.join(FILE,'../personnages.py')

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
