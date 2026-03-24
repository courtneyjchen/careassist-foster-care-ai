"""Risk engine service — backed by the v4 weighted ensemble model.

Wraps the pure-Python ensemble scorer (app.ml.xgb_scorer) which replicates
inference from the v4 weighted ensemble trained on 5.76 M AFCARS records
(FY 2020-2024).

Model specs:
  - Algorithm:   Weighted Ensemble (XGBoost + LightGBM + CatBoost + MLP)
  - Metric:      ROC-AUC 0.9205, AP 0.8615, F1 0.784
  - Threshold:   0.538 (optimised via precision-recall curve)
  - Features:    65 (20 baseline + 45 engineered / one-hot)
  - Tuning:      50 Optuna trials, 5-fold stacking
"""

from __future__ import annotations
from typing import Any
from ..ml.xgb_scorer import score_case, predict_with_explanation, get_model_metadata


def calculate_priority_score(child: Any, case: Any) -> float:
    """Score a case using the XGBoost model.

    Parameters
    ----------
    child : Child SQLAlchemy model
    case  : Case  SQLAlchemy model

    Returns
    -------
    float  Disruption-risk probability in [0, 1].
    """
    probability, _ = score_case(child, case)
    return probability


def explain_case(child: Any, case: Any) -> dict:
    """Return a full SHAP-style explanation for a case.

    Delegates to the XGBoost scorer's predict_with_explanation.
    """
    return predict_with_explanation(child, case)
