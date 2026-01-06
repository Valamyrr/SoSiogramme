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
nom = extract("Perso 1")
nom2 = extract("Perso 2")
relation1 = extract("Perso 1 > Perso 2")
relation2 = extract("Perso 2 > Perso 1")

with open(CSV_PATH,"a", encoding="utf-8") as f:
    f.write(f'\n{nom};{nom2};{relation1};{relation2}')

print(f"Ligne ajoutée : {nom}, {nom2}, {relation1}, {relation2}")
