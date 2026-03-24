"""Quick test of the v4 ensemble scorer."""
import sys
from datetime import date
sys.path.insert(0, ".")
from app.ml.xgb_scorer import score_case, predict_with_explanation, get_model_metadata

# High-risk case: Aisha Williams (group home, 30 months, prior adoptions, disability)
class HighChild:
    date_of_birth = date(2012, 1, 15)
    prior_placements = 5
    prior_adoptions = 1
    has_behavioral_needs = True
    has_disability = True
    has_medical_needs = False

class HighCase:
    id = 3
    months_in_care = 30
    removal_reason = "Physical Abuse"
    placement_type = "Group Home"
    permanency_goal = "Adoption"
    has_parental_rights_terminated = True

prob, contribs = score_case(HighChild(), HighCase())
print(f"High-risk score: {prob:.4f} ({len(contribs)} features)")

# Low-risk case: Liam Thompson (kinship, 4 months, no issues)
class LowChild:
    date_of_birth = date(2018, 7, 3)
    prior_placements = 0
    prior_adoptions = 0
    has_behavioral_needs = False
    has_disability = False
    has_medical_needs = False

class LowCase:
    id = 4
    months_in_care = 4
    removal_reason = "Parental Incarceration"
    placement_type = "Kinship Care"
    permanency_goal = "Reunification"
    has_parental_rights_terminated = False

prob2, _ = score_case(LowChild(), LowCase())
print(f"Low-risk score:  {prob2:.4f}")

# Explanation test
expl = predict_with_explanation(HighChild(), HighCase())
print(f"\nExplanation for high-risk case:")
print(f"  Predicted: {expl['predicted_score']:.4f}")
print(f"  Tier:      {expl['risk_tier']}")
print(f"  Flag:      {expl['disruption_flag']}")
print(f"  Top 5 features:")
for f in expl["features"][:5]:
    print(f"    {f['label']:40s} {f['value']:>12s}  {f['contribution']:+.4f} ({f['direction']})")

# Metadata
m = get_model_metadata()
print(f"\nModel: {m['algorithm']}")
print(f"AUC: {m['roc_auc']}, Threshold: {m['threshold']}, Features: {m['n_features']}")
print("\nAll tests passed!")
