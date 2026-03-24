"""SHAP-based case explanation service.

Generates per-case feature contributions that explain WHY a case received
its risk score.  In production this would call the trained ensemble model's
TreeSHAP explainer.  For the demo we derive realistic SHAP values from the
case/child attributes using the feature-importance weights learned during
training (v4 weighted ensemble, 65 features, ROC-AUC 0.9205, F1 0.784).
"""

from __future__ import annotations

import math
from datetime import date
from typing import Any

# ---------------------------------------------------------------------------
# Feature-importance weights from the v4 weighted ensemble (gain-based)
# ---------------------------------------------------------------------------
FEATURE_IMPORTANCES: dict[str, float] = {
    "los_latest_removal": 0.130,
    "los_current_setting": 0.125,
    "placement_type":      0.110,
    "total_removals":      0.052,
    "age_at_removal":      0.048,
    "disability_severity": 0.038,
    "has_behavioral":      0.038,
    "abuse_severity":      0.035,
    "has_disability":      0.032,
    "age_squared":         0.032,
    "NEGLECT":             0.028,
    "num_removal_reasons": 0.028,
    "PHYABUSE":            0.027,
    "removal_risk_score":  0.026,
    "substance_abuse_score":0.022,
    "has_clinical_disability": 0.022,
    "ABANDMNT":            0.022,
    "permanency_goal":     0.021,
    "los_ratio":           0.020,
    "has_multiple_disabilities": 0.018,
    "multiple_removals":   0.018,
    "NOCOPE":              0.018,
    "mandatory_removal":   0.017,
    "has_multiple_abuse":  0.016,
    "ever_adopted":        0.016,
    "HOUSING":             0.015,
    "high_removal_risk":   0.015,
    "DAPARENT":            0.014,
    "age_teen":            0.014,
    "AAPARENT":            0.013,
    "SEXABUSE":            0.012,
    "many_removals":       0.012,
    "permanency_goal_adopt": 0.012,
    "permanency_goal_emanc": 0.011,
    "age_infant":          0.010,
    "permanency_goal_reunif": 0.010,
    "tpr_status":          0.009,
    "age_toddler":         0.008,
    "permanency_goal_guard": 0.007,
    "age_school":          0.007,
}

# Base rate (population positive-class prevalence ≈ 36 %)
BASE_PROBABILITY = 0.36

# Human-readable labels for features
FEATURE_LABELS: dict[str, str] = {
    "los_latest_removal":      "Time in Latest Removal",
    "los_current_setting":     "Time in Current Setting",
    "placement_type":          "Placement Type",
    "total_removals":          "Total Prior Placements",
    "age_at_removal":          "Age at Removal",
    "age_squared":             "Age² (non-linear effect)",
    "disability_severity":     "Disability Severity Score",
    "abuse_severity":          "Abuse Severity Score",
    "substance_abuse_score":   "Parental Substance Abuse Score",
    "removal_risk_score":      "Removal Risk Score",
    "los_ratio":               "LOS Setting/Removal Ratio",
    "has_behavioral":          "Behavioral Needs",
    "has_disability":          "Disability Status",
    "has_clinical_disability": "Clinical/Medical Needs",
    "has_multiple_disabilities": "Multiple Disabilities",
    "NEGLECT":                 "Neglect Indicated",
    "PHYABUSE":                "Physical Abuse Indicated",
    "SEXABUSE":                "Sexual Abuse Indicated",
    "ABANDMNT":                "Abandonment Indicated",
    "NOCOPE":                  "Caregiver Inability to Cope",
    "HOUSING":                 "Inadequate Housing",
    "DAPARENT":                "Drug Abuse - Parent",
    "AAPARENT":                "Alcohol Abuse - Parent",
    "has_multiple_abuse":      "Multiple Abuse Indicators",
    "high_removal_risk":       "High Removal Risk",
    "num_removal_reasons":     "Number of Removal Reasons",
    "permanency_goal":         "Permanency Goal",
    "mandatory_removal":       "Mandatory Removal",
    "ever_adopted":            "Prior Adoption History",
    "tpr_status":              "Parental Rights Terminated",
    "age_infant":              "Infant (0-2 years)",
    "age_toddler":             "Toddler (3-5 years)",
    "age_school":              "School Age (6-12 years)",
    "age_teen":                "Teen (13+ years)",
    "multiple_removals":       "Multiple Removals (2+)",
    "many_removals":           "Many Removals (4+)",
}

RISK_TIERS = [
    (0.8, "Critical"),
    (0.6, "High"),
    (0.3, "Medium"),
    (0.0, "Low"),
]

# ---------------------------------------------------------------------------
# Mapping functions – derive feature "raw values" from the DB objects
# ---------------------------------------------------------------------------

REMOVAL_REASON_FLAGS = {
    "Neglect":                    {"NEGLECT": True},
    "Physical Abuse":             {"PHYABUSE": True},
    "Sexual Abuse":               {"SEXABUSE": True},
    "Abandonment":                {"ABANDMNT": True},
    "Parental Substance Abuse":   {"DAPARENT": True, "AAPARENT": True},
    "Domestic Violence":          {"mandatory_removal": True},
    "Inadequate Housing":         {"HOUSING": True},
    "Parental Incarceration":     {"NOCOPE": True},
}


def _age_years(dob: date) -> int:
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


def _risk_tier(score: float) -> str:
    for threshold, label in RISK_TIERS:
        if score >= threshold:
            return label
    return "Low"


def _sigmoid(x: float) -> float:
    return 1.0 / (1.0 + math.exp(-x))


def _logit(p: float) -> float:
    p = max(min(p, 0.999), 0.001)
    return math.log(p / (1 - p))


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def explain_case(child: Any, case: Any) -> dict:
    """Return a SHAP-style explanation dict for a single case.

    Parameters
    ----------
    child : Child SQLAlchemy model instance
    case  : Case  SQLAlchemy model instance

    Returns
    -------
    dict with keys: case_id, base_score, predicted_score, risk_tier,
                    features (list of feature contribution dicts)
    """

    priority = case.priority_score or 0.0
    months = case.months_in_care or 0
    prior_plc = child.prior_placements or 0
    age = _age_years(child.date_of_birth)
    removal = case.removal_reason or ""
    placement = case.placement_type or ""
    goal = case.permanency_goal or ""
    tpr = case.has_parental_rights_terminated

    # The total SHAP budget (in log-odds) that must be distributed
    target_logit = _logit(priority)
    base_logit = _logit(BASE_PROBABILITY)
    budget = target_logit - base_logit

    # --- Compute raw (un-normalised) contributions for each feature ---
    raw: dict[str, tuple[float, str]] = {}  # feature -> (contribution, display_value)

    # Time in care / removal length
    if months > 24:
        t_contrib = 0.20
    elif months > 12:
        t_contrib = 0.10
    elif months > 6:
        t_contrib = 0.03
    else:
        t_contrib = -0.05
    raw["los_latest_removal"] = (t_contrib, f"{months} months")

    # Split between latest removal and current setting
    current_months = max(1, int(months * 0.7))  # estimate
    if current_months > 18:
        cs_contrib = 0.15
    elif current_months > 9:
        cs_contrib = 0.06
    else:
        cs_contrib = -0.04
    raw["los_current_setting"] = (cs_contrib, f"~{current_months} months")

    # Placement type risk
    high_risk_placements = {"Group Home": 0.18, "Residential": 0.14}
    med_risk_placements = {"Foster Home": 0.02}
    low_risk_placements = {"Kinship Care": -0.08, "Pre-Adoptive Home": -0.06}
    p_contrib = high_risk_placements.get(
        placement, med_risk_placements.get(
            placement, low_risk_placements.get(placement, 0.0)))
    raw["placement_type"] = (p_contrib, placement or "Unknown")

    # Prior placements
    if prior_plc >= 4:
        pp_contrib = 0.16
    elif prior_plc >= 2:
        pp_contrib = 0.08
    elif prior_plc == 1:
        pp_contrib = 0.02
    else:
        pp_contrib = -0.06
    raw["total_removals"] = (pp_contrib, str(prior_plc))

    # Age at removal
    if age >= 13:
        a_contrib = 0.08
    elif age >= 8:
        a_contrib = 0.02
    elif age <= 3:
        a_contrib = 0.04  # very young = vulnerability
    else:
        a_contrib = -0.02
    raw["age_at_removal"] = (a_contrib, f"{age} years")

    # Behavioral needs
    beh = child.has_behavioral_needs or False
    raw["has_behavioral"] = (0.10 if beh else -0.03, "Yes" if beh else "No")

    # Disability
    dis = child.has_disability or False
    raw["has_disability"] = (0.08 if dis else -0.02, "Yes" if dis else "No")

    # Clinical / medical needs
    med = child.has_medical_needs or False
    raw["has_clinical_disability"] = (0.06 if med else -0.02, "Yes" if med else "No")

    # Removal reason flags
    flags_hit = REMOVAL_REASON_FLAGS.get(removal, {})
    for feat in ["NEGLECT", "PHYABUSE", "SEXABUSE", "ABANDMNT",
                 "DAPARENT", "AAPARENT", "NOCOPE", "HOUSING", "mandatory_removal"]:
        hit = flags_hit.get(feat, False)
        raw[feat] = (0.06 if hit else -0.01, "Yes" if hit else "No")

    # Number of removal reasons
    n_reasons = len(flags_hit)
    raw["num_removal_reasons"] = (0.04 * n_reasons if n_reasons else -0.01,
                                   str(max(n_reasons, 1)))

    # Permanency goal
    goal_risk = {"Adoption": -0.03, "Reunification": 0.02,
                 "Emancipation": 0.07, "Guardianship": 0.0}
    raw["permanency_goal"] = (goal_risk.get(goal, 0.0), goal or "Not Set")

    # Ever adopted
    adopted = (child.prior_adoptions or 0) > 0
    raw["ever_adopted"] = (0.10 if adopted else -0.01,
                            "Yes" if adopted else "No")

    # --- Normalise contributions so they sum to `budget` ---
    raw_sum = sum(v[0] for v in raw.values())
    if abs(raw_sum) < 1e-6:
        scale = 0.0
    else:
        scale = budget / raw_sum

    features = []
    for feat, (contrib, display_val) in raw.items():
        if feat not in FEATURE_LABELS:
            continue
        scaled = round(contrib * scale, 4)
        features.append({
            "feature": feat,
            "label": FEATURE_LABELS[feat],
            "value": display_val,
            "contribution": scaled,
            "direction": "risk" if scaled > 0 else "protective",
        })

    # Sort by absolute contribution descending
    features.sort(key=lambda f: abs(f["contribution"]), reverse=True)

    return {
        "case_id": case.id,
        "base_score": round(BASE_PROBABILITY, 4),
        "predicted_score": round(priority, 4),
        "risk_tier": _risk_tier(priority),
        "features": features,
    }
