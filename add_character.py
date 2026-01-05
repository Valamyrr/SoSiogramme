import os
import re

FILE = os.path.dirname(__file__)
CSV_PATH = os.path.join(FILE,'personnages.csv')

body = os.environ["ISSUE_BODY"]

print(body)

def extract(field):
    pattern = rf"### {field}\n\n([^\n]+)"
    match = re.search(pattern, body)
    if not match:
        raise ValueError(f"Champ manquant : {field}")
    return match.group(1).strip()
nom = extract("Nom")
avatar = extract("Avatar")
groupe = extract("Groupe")
ptype = extract("Type")

print([nom,avatar,groupe,ptype])

with open(CSV_PATH,"a", encoding="utf-8") as f:
    f.write(f'\n{nom},{avatar},{groupe},{ptype}')

print(f"Ligne ajoutée : {nom}, {avatar}, {groupe}, {ptype}")

