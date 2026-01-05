import os
import re

FILE = os.path.dirname(__file__)
CSV_PATH = os.path.join(FILE,'relations.csv')

body = os.environ["ISSUE_BODY"]

print(body)

def extract(field):
    pattern = rf"### {field}\n\n([^\n]+)"
    match = re.search(pattern, body)
    if not match:
        raise ValueError(f"Champ manquant : {field}")
    return match.group(1).strip()
nom = extract("Nom")
nom2 = extract("Nom2")
relation = extract("Relation")
direction = extract("Direction")

print([nom,nom2,relation,axe])

with open(CSV_PATH,"a", encoding="utf-8") as f:
    f.write(f'\n{nom},{nom2},{relation},{direction}')

print(f"Ligne ajoutée : {nom}, {nom2}, {relation}, {direction}")
