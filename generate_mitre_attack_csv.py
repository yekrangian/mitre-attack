import csv
from mitreattack.stix20 import MitreAttackData

ATTACK_FILE = "enterprise-attack.json"   # Path to your local STIX 2.0 file
OUTPUT_CSV  = "attack_tactics_techniques.csv"
DOMAIN      = "enterprise-attack"

# Map from source_name to human-friendly matrix name
MATRIX_MAP = {
    "mitre-attack": "Enterprise",
    "mitre-ics-attack": "ICS",
    "mitre-mobile-attack": "Mobile",
}

attack_data = MitreAttackData(ATTACK_FILE)

def get_attack_id_and_matrix(obj):
    """Return (external_id, matrix_name) derived from external_references."""
    for ref in obj.get("external_references", []):
        src = ref.get("source_name")
        if src in MATRIX_MAP and "external_id" in ref:
            return ref["external_id"], MATRIX_MAP[src]
    # fallback if no matching source_name
    for ref in obj.get("external_references", []):
        if "external_id" in ref:
            return ref["external_id"], ""
    return "", ""

def clean(text):
    return (text or "").replace("\n", " ").replace("\r", " ").strip()

def platforms_of(tech):
    plats = tech.get("x_mitre_platforms", [])
    if not isinstance(plats, list):
        return ""
    joined = ", ".join([p for p in plats if p])
    return joined.strip()

def is_active(obj):
    """True if NOT deprecated or revoked."""
    return not obj.get("x_mitre_deprecated", False) and not obj.get("revoked", False)

def has_required_fields_for_row(tech):
    """Keep only techniques with non-empty ID, Description, and Platform."""
    tech_id, _ = get_attack_id_and_matrix(tech)
    if not tech_id:
        return False
    desc_ok = bool(clean(tech.get("description", "")))
    plats_ok = bool(platforms_of(tech))
    return desc_ok and plats_ok

rows = []
skipped_no_required = 0

# Get tactics (active only)
tactics = [t for t in attack_data.get_tactics() if is_active(t)]

for tactic in tactics:
    tactic_name = tactic.get("name", "")
    tactic_id, matrix_name = get_attack_id_and_matrix(tactic)
    tactic_desc = clean(tactic.get("description", ""))
    tactic_shortname = tactic.get("x_mitre_shortname")
    if not tactic_shortname:
        continue

    # Techniques for this tactic (active only)
    techniques = [
        t for t in attack_data.get_techniques_by_tactic(tactic_shortname, DOMAIN)
        if is_active(t)
    ]

    for tech in techniques:
        if not has_required_fields_for_row(tech):
            skipped_no_required += 1
            continue

        tech_name = tech.get("name", "")
        tech_id, _ = get_attack_id_and_matrix(tech)
        tech_desc = clean(tech.get("description", ""))
        plats = platforms_of(tech)

        rows.append([
            tactic_name,
            tactic_id,
            tactic_desc,
            tech_name,
            tech_id,
            tech_desc,
            plats,
            matrix_name,
            "",  # CIA placeholder
            ""   # STRIDE placeholder
        ])

        # Sub-techniques (active only)
        subtechs = [
            s for s in attack_data.get_subtechniques_of_technique(tech["id"])
            if is_active(s)
        ]
        for sub in subtechs:
            if not has_required_fields_for_row(sub):
                skipped_no_required += 1
                continue

            sub_name = sub.get("name", "")
            sub_id, _ = get_attack_id_and_matrix(sub)
            sub_desc = clean(sub.get("description", ""))
            sub_plat = platforms_of(sub)

            rows.append([
                tactic_name,
                tactic_id,
                tactic_desc,
                f"{tech_name}: {sub_name}",
                sub_id,
                sub_desc,
                sub_plat,
                matrix_name,
                "",  # CIA placeholder
                ""   # STRIDE placeholder
            ])

# Write CSV
with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow([
        "Tactic_Name",
        "Tactic_ID",
        "Tactic_Description",
        "Technique_Name",
        "Technique_ID",
        "Technique_Description",
        "Platform",
        "Matrices",
        "CIA",
        "STRIDE"
    ])
    writer.writerows(rows)

print(f"[+] Saved {len(rows)} rows to {OUTPUT_CSV}")
print(f"[i] Skipped {skipped_no_required} technique/sub-technique objects lacking ID/description/platform.")
