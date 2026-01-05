import os
import re


FILE = os.path.dirname(__file__)
CSV_PATH = os.path.join(FILE,'/personnages.py')

body = os.environ["ISSUE_BODY"]

print(body)

def extract(field):
    """
    Extrait la valeur après ### Field
    """
    # Pattern : ### Nom\nligne avec la valeur (non vide)
    pattern = rf"### {re.escape(field)}\n([^\n]+)"
    match = re.search(pattern, body)
    if not match:
        raise ValueError(f"Champ manquant : {field}")
    return match.group(1).strip()

# Extraction
nom = extract("Nom")
avatar = extract("Avatar")
groupe = extract("Groupe")
ptype = extract("Type")

print([nom,avatar,groupe,ptype])

# Ajouter au CSV
header = ["nom","avatar","groupe","type"]
if not CSV_PATH.exists():
    with CSV_PATH.open("w", encoding="utf-8") as f:
        f.write(",".join(header) + "\n")

with CSV_PATH.open("a", encoding="utf-8") as f:
    f.write(f'{nom},{avatar},{groupe},{ptype}\n')

print(f"Ligne ajoutée : {nom}, {avatar}, {groupe}, {ptype}")

