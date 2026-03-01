"""Risk engine service — backed by the trained XGBoost model.

Wraps the pure-Python XGBoost scorer (app.ml.xgb_scorer) which replicates
inference from the model trained on 5.76 M AFCARS records (FY 2020-2024).

Model specs:
  - Algorithm:   XGBoost, 500 trees, max_depth 8, lr 0.05
  - Metric:      ROC-AUC 0.906, 91 % recall at threshold 0.40
  - Features:    33 (race/gender excluded)
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
