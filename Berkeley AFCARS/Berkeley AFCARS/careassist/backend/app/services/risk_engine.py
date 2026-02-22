"""Risk engine service (placeholder for ML model)."""


def calculate_priority_score(child: dict, case: dict) -> float:
    """Calculate a priority score based on case factors.
    In production, this would call a trained ML model (XGBoost/Random Forest).
    """
    score = 0.0

    # Prior placements increase risk
    prior = child.get("prior_placements", 0)
    if prior >= 3:
        score += 0.3
    elif prior >= 1:
        score += 0.15

    # Medical/behavioral needs
    if child.get("has_medical_needs"):
        score += 0.1
    if child.get("has_behavioral_needs"):
        score += 0.15
    if child.get("has_disability"):
        score += 0.1

    # Time in care
    months = case.get("months_in_care", 0)
    if months > 24:
        score += 0.2
    elif months > 12:
        score += 0.1

    # TPR status
    if case.get("has_parental_rights_terminated"):
        score += 0.1

    return min(score, 1.0)
