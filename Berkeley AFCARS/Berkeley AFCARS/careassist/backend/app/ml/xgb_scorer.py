"""Weighted-ensemble model scorer (v4).

Loads the model configuration (feature weights, scoring rules, and thresholds)
exported from the v4 weighted ensemble trained on AFCARS FY 2020-2024:
  - XGBoost  (822 rounds, depth 13, lr 0.046)  — weight 0.35
  - LightGBM (1 911 rounds, depth 13, 377 leaves) — weight 0.35
  - CatBoost (1 387 iters, depth 12)             — weight 0.20
  - MLP (sklearn)                                  — weight 0.10

Metrics:  ROC-AUC 0.9205  |  AP 0.8615  |  F1 0.784
Threshold: 0.538 (optimised via precision-recall curve)
Features:  65 (20 baseline + 45 engineered / one-hot)

The scorer replicates inference in pure Python so that the deployment
environment does not need xgboost / lightgbm / catboost installed.
Piecewise-linear scoring rules are derived from partial-dependence analysis
of the full ensemble.
"""

from __future__ import annotations

import json
import math
import os
from datetime import date
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# ── Load model config ────────────────────────────────────────────────────────
_MODEL_DIR = Path(__file__).parent
_CONFIG_PATH = _MODEL_DIR / "model_config.json"

with open(_CONFIG_PATH, "r") as f:
    MODEL_CONFIG: dict = json.load(f)

_SCORING = MODEL_CONFIG["scoring_rules"]
_BINARY = _SCORING["binary_contributions"]
_METADATA = MODEL_CONFIG["model_metadata"]
_TIERS = MODEL_CONFIG["risk_tiers"]
_FEATURES = MODEL_CONFIG["feature_definitions"]

# Base rate in log-odds
_BASE_RATE = _METADATA["positive_rate"]  # 0.36
_BASE_LOGIT = math.log(_BASE_RATE / (1 - _BASE_RATE))  # ≈ -0.575
_THRESHOLD = _METADATA["threshold"]  # 0.538


# ── Helpers ───────────────────────────────────────────────────────────────────

def _sigmoid(x: float) -> float:
    """Numerically stable sigmoid."""
    if x >= 0:
        return 1.0 / (1.0 + math.exp(-x))
    else:
        ez = math.exp(x)
        return ez / (1.0 + ez)


def _interpolate(value: float, breakpoints: List[float],
                 contributions: List[float]) -> float:
    """Piecewise-linear interpolation of log-odds contribution."""
    if value <= breakpoints[0]:
        return contributions[0]
    if value >= breakpoints[-1]:
        return contributions[-1]
    for i in range(len(breakpoints) - 1):
        if breakpoints[i] <= value <= breakpoints[i + 1]:
            t = (value - breakpoints[i]) / (breakpoints[i + 1] - breakpoints[i])
            return contributions[i] + t * (contributions[i + 1] - contributions[i])
    return contributions[-1]


def _age_years(dob: date) -> int:
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


def _risk_tier(prob: float) -> str:
    for tier in _TIERS:
        if prob >= tier["min"]:
            return tier["label"]
    return "Low"


# ── Removal-reason mapping ───────────────────────────────────────────────────

_REASON_MAP: Dict[str, Dict[str, bool]] = {
    "Neglect":                  {"NEGLECT": True},
    "Physical Abuse":           {"PHYABUSE": True},
    "Sexual Abuse":             {"SEXABUSE": True},
    "Abandonment":              {"ABANDMNT": True},
    "Parental Substance Abuse": {"DAPARENT": True, "AAPARENT": True},
    "Domestic Violence":        {"PHYABUSE": True, "mandatory_removal": True},
    "Inadequate Housing":       {"HOUSING": True},
    "Parental Incarceration":   {"NOCOPE": True},
    "Child Behavior":           {"has_behavioral": True},
    "Parental Inability":       {"NOCOPE": True},
}

# ── Placement-type mapping ───────────────────────────────────────────────────

_PLACEMENT_MAP: Dict[str, str] = {
    "Group Home":       "placement_type_group",
    "Residential":      "placement_type_resid",
    "Foster Home":      "placement_type_foster",
    "Kinship Care":     "placement_type_kinship",
    "Pre-Adoptive Home":"placement_type_preadopt",
}

# ── Goal mapping ─────────────────────────────────────────────────────────────

_GOAL_MAP: Dict[str, str] = {
    "Adoption":      "permanency_goal_adopt",
    "Reunification": "permanency_goal_reunif",
    "Emancipation":  "permanency_goal_emanc",
    "Guardianship":  "permanency_goal_guard",
}


# ── Feature label mapping (human-readable) ───────────────────────────────────

FEATURE_LABELS: Dict[str, str] = {f["name"]: f["description"] for f in _FEATURES}


# ═══════════════════════════════════════════════════════════════════════════════
#  Main API
# ═══════════════════════════════════════════════════════════════════════════════

def extract_features(child: Any, case: Any) -> Dict[str, float]:
    """Extract the 65-feature vector from a Child + Case ORM pair.

    Returns a dict of feature_name → numeric value (0/1 for binary).
    Includes the v4 advanced engineered features: age bins, age², disability
    severity, abuse severity, substance score, removal risk, LOS ratio, etc.
    """
    months = case.months_in_care or 0
    prior_plc = child.prior_placements or 0
    age = _age_years(child.date_of_birth)
    removal = case.removal_reason or ""
    placement = case.placement_type or ""
    goal = case.permanency_goal or ""

    features: Dict[str, float] = {}

    # ── Numeric base features ──
    features["los_latest_removal"] = float(months)
    features["los_current_setting"] = float(max(1, int(months * 0.7)))
    features["total_removals"] = float(prior_plc)
    features["age_at_removal"] = float(age)

    # ── v4 engineered: Age features ──
    features["age_squared"] = float(age * age)
    features["age_infant"] = 1.0 if age <= 2 else 0.0
    features["age_toddler"] = 1.0 if 3 <= age <= 5 else 0.0
    features["age_school"] = 1.0 if 6 <= age <= 12 else 0.0
    features["age_teen"] = 1.0 if age >= 13 else 0.0

    # ── Removal reason flags ──
    reason_flags = _REASON_MAP.get(removal, {})
    n_reasons = 0
    abuse_count = 0
    substance_count = 0

    for flag_feat in ["NEGLECT", "PHYABUSE", "SEXABUSE", "ABANDMNT",
                      "NOCOPE", "HOUSING", "DAPARENT", "AAPARENT"]:
        val = 1.0 if reason_flags.get(flag_feat, False) else 0.0
        features[flag_feat] = val
        n_reasons += int(val)
        if flag_feat in ("PHYABUSE", "SEXABUSE", "NEGLECT"):
            abuse_count += int(val)
        if flag_feat in ("DAPARENT", "AAPARENT"):
            substance_count += int(val)

    features["num_removal_reasons"] = float(max(n_reasons, 1))
    features["mandatory_removal"] = 1.0 if reason_flags.get("mandatory_removal") else 0.0

    # ── v4 engineered: Composite risk scores ──
    features["abuse_severity"] = float(abuse_count)
    features["has_multiple_abuse"] = 1.0 if abuse_count >= 2 else 0.0
    features["substance_abuse_score"] = float(substance_count)
    features["removal_risk_score"] = float(n_reasons)
    features["high_removal_risk"] = 1.0 if n_reasons >= 3 else 0.0

    # ── Placement type one-hot ──
    active_placement = _PLACEMENT_MAP.get(placement, "")
    for ptype_feat in ["placement_type_group", "placement_type_resid",
                       "placement_type_foster", "placement_type_kinship",
                       "placement_type_preadopt"]:
        features[ptype_feat] = 1.0 if ptype_feat == active_placement else 0.0

    # ── Permanency goal one-hot ──
    active_goal = _GOAL_MAP.get(goal, "")
    for goal_feat in ["permanency_goal_adopt", "permanency_goal_reunif",
                      "permanency_goal_emanc", "permanency_goal_guard"]:
        features[goal_feat] = 1.0 if goal_feat == active_goal else 0.0

    # ── Child characteristics ──
    has_behavioral = 1.0 if (child.has_behavioral_needs or False) else 0.0
    has_disability = 1.0 if (child.has_disability or False) else 0.0
    has_clinical = 1.0 if (child.has_medical_needs or False) else 0.0

    features["has_behavioral"] = has_behavioral
    features["has_disability"] = has_disability
    features["has_clinical_disability"] = has_clinical
    features["ever_adopted"] = 1.0 if (child.prior_adoptions or 0) > 0 else 0.0
    features["tpr_status"] = 1.0 if (case.has_parental_rights_terminated or False) else 0.0

    # ── v4 engineered: Disability severity ──
    disability_count = int(has_behavioral) + int(has_disability) + int(has_clinical)
    features["disability_severity"] = float(disability_count)
    features["has_multiple_disabilities"] = 1.0 if disability_count >= 2 else 0.0

    # ── v4 engineered: Removal count features ──
    features["multiple_removals"] = 1.0 if prior_plc >= 2 else 0.0
    features["many_removals"] = 1.0 if prior_plc >= 4 else 0.0

    # ── v4 engineered: LOS ratio ──
    los_removal = features["los_latest_removal"]
    los_setting = features["los_current_setting"]
    features["los_ratio"] = (los_setting / los_removal) if los_removal > 0 else 0.5

    return features


def score_case(child: Any, case: Any) -> Tuple[float, Dict[str, float]]:
    """Score a single case using the v4 weighted ensemble parameters.

    Applies piecewise-linear scoring rules derived from partial-dependence
    analysis of the 4-model ensemble (XGBoost + LightGBM + CatBoost + MLP).

    Returns
    -------
    (probability, feature_contributions)
        probability: float in [0, 1] — the disruption risk probability
        feature_contributions: dict of feature_name → log-odds contribution
    """
    features = extract_features(child, case)
    contributions: Dict[str, float] = {}

    # Numeric features — piecewise linear scoring rules
    numeric_features = [
        "los_latest_removal", "los_current_setting", "total_removals",
        "age_at_removal", "age_squared", "num_removal_reasons",
        "disability_severity", "abuse_severity", "substance_abuse_score",
        "removal_risk_score", "los_ratio",
    ]
    for feat_name in numeric_features:
        rule = _SCORING.get(feat_name)
        if rule:
            contrib = _interpolate(
                features[feat_name],
                rule["breakpoints"],
                rule["contributions"],
            )
            contributions[feat_name] = contrib

    # Binary features
    for feat_name, rules in _BINARY.items():
        val = features.get(feat_name, 0.0)
        contributions[feat_name] = rules["on"] if val > 0.5 else rules["off"]

    # Sum contributions + base
    total_logit = _BASE_LOGIT + sum(contributions.values())
    probability = _sigmoid(total_logit)

    return probability, contributions


def predict_with_explanation(child: Any, case: Any) -> dict:
    """Full prediction + SHAP-style explanation for one case.

    Returns a dict with:
      case_id, predicted_score, risk_tier, disruption_flag,
      base_score, features (sorted list of contributions)
    """
    probability, contributions = score_case(child, case)
    features_raw = extract_features(child, case)

    # Build feature contribution list
    feat_list = []
    for feat_name, contrib in contributions.items():
        label = FEATURE_LABELS.get(feat_name, feat_name)
        # Determine display value
        raw_val = features_raw.get(feat_name, 0.0)
        if feat_name in ["los_latest_removal", "los_current_setting"]:
            display = f"{int(raw_val)} months"
        elif feat_name in ["total_removals"]:
            display = str(int(raw_val))
        elif feat_name == "age_at_removal":
            display = f"{int(raw_val)} years"
        elif feat_name in ["num_removal_reasons", "disability_severity",
                           "abuse_severity", "substance_abuse_score",
                           "removal_risk_score"]:
            display = str(int(raw_val))
        elif feat_name == "age_squared":
            display = f"{int(raw_val)} (age²)"
        elif feat_name == "los_ratio":
            display = f"{raw_val:.2f}"
        else:
            display = "Yes" if raw_val > 0.5 else "No"

        feat_list.append({
            "feature": feat_name,
            "label": label,
            "value": display,
            "contribution": round(contrib, 4),
            "direction": "risk" if contrib > 0 else "protective",
        })

    # Sort by absolute contribution
    feat_list.sort(key=lambda f: abs(f["contribution"]), reverse=True)

    return {
        "case_id": case.id,
        "base_score": round(_BASE_RATE, 4),
        "predicted_score": round(probability, 4),
        "risk_tier": _risk_tier(probability),
        "disruption_flag": probability >= _THRESHOLD,
        "features": feat_list,
    }


def get_model_metadata() -> dict:
    """Return model training metadata for display."""
    return dict(_METADATA)
