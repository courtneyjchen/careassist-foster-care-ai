"""
CareAssist – Placement Stability Prediction Model (Lean version)
Train on real AFCARS FY2022-2023 data. No matplotlib/SHAP to avoid slow imports.
"""
import os, sys, warnings, json, time
warnings.filterwarnings('ignore')

t0 = time.time()
print("Importing libraries …")
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    classification_report, roc_auc_score, average_precision_score,
    confusion_matrix
)
import joblib

try:
    import xgboost as xgb
    HAS_XGB = True
except ImportError:
    HAS_XGB = False
    print("  ⚠ xgboost not available – using Random Forest only")

print(f"  Imports done in {time.time()-t0:.1f}s")

# ── paths ────────────────────────────────────────────────────────────
DATA_DIR  = r'C:\Users\Samantha Townsend\Downloads\Berkeley AFCARS\Berkeley AFCARS\afcars_data'
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_DIR   = os.path.join(SCRIPT_DIR, '..', 'ml_output')
os.makedirs(OUT_DIR, exist_ok=True)

# ═══════════════════════════════════════════════════════════════════
# STEP 1: Load data
# ═══════════════════════════════════════════════════════════════════
print("\n[1/7] Loading AFCARS data …")
t1 = time.time()

# Read as strings first, convert numeric columns afterwards to avoid memory issues
# Only load the columns we actually need
USE_COLS = [
    'RecNumbr', 'FIPSCode', 'StFCID', 'FY',
    'NUMPLEP', 'TOTALREM', 'CURPLSET', 'CASEGOAL', 'SEX', 'CLINDIS',
    'MR', 'VISHEAR', 'PHYDIS', 'EmotDist', 'OTHERMED', 'CHBEHPRB',
    'PHYABUSE', 'SEXABUSE', 'NEGLECT', 'AAPARENT', 'DAPARENT',
    'AACHILD', 'DACHILD', 'CHILDIS', 'PRTSDIED', 'PRTSJAIL',
    'NOCOPE', 'ABANDMNT', 'RELINQSH', 'HOUSING', 'MANREM',
    'EVERADPT', 'DISREASN', 'PLACEOUT',
    'AgeAtLatRem', 'RaceEthn',
    'SettingLOS', 'LatRemLOS',
]

def load_afcars_sample(path, year, max_rows=100_000):
    """Load AFCARS tab file, sampling to fit in memory."""
    header = pd.read_csv(path, sep='\t', nrows=0)
    cols = [c for c in USE_COLS if c in header.columns]
    # Read in chunks and stop after max_rows
    chunks = []
    total = 0
    for chunk in pd.read_csv(path, sep='\t', usecols=cols, dtype=str,
                              chunksize=25_000, low_memory=False):
        chunks.append(chunk)
        total += len(chunk)
        if total >= max_rows:
            break
    d = pd.concat(chunks, ignore_index=True).head(max_rows)
    print(f"  FY{year}: {len(d):,} records, {len(cols)} columns loaded")
    return d

# Use 150K records to stay within memory limits
df = load_afcars_sample(f'{DATA_DIR}/FC2023ABv1.tab', 2023, max_rows=150_000)

# Convert numeric columns
num_cols = [c for c in df.columns if c not in ('RecNumbr', 'FIPSCode', 'StFCID', 'FY')]
for c in num_cols:
    df[c] = pd.to_numeric(df[c], errors='coerce')
print(f"  Combined: {df.shape[0]:,} records x {df.shape[1]} cols  ({time.time()-t1:.1f}s)")

# ═══════════════════════════════════════════════════════════════════
# STEP 2: Define target (placement disruption)
# ═══════════════════════════════════════════════════════════════════
print("\n[2/7] Defining target variable …")

# Disruption = discharge reason is Transfer(6) or Runaway(7)
# OR child had 4+ placements in this episode (severe instability)
# Note: we use DISREASN as primary signal, NUMPLEP >= 4 as secondary
# but NUMPLEP stays as a strong FEATURE since it's observable before outcome
def label_disruption(disreasn):
    """Define disruption purely from discharge reason to avoid leakage."""
    if pd.notna(disreasn) and int(disreasn) in (6, 7):  # Transfer / Runaway
        return 1
    return 0

df['disruption'] = df['DISREASN'].apply(label_disruption)
pos = df['disruption'].sum()
print(f"  Disrupted: {pos:,}  ({100*pos/len(df):.1f}%)")
print(f"  Stable:    {len(df)-pos:,}  ({100*(len(df)-pos)/len(df):.1f}%)")

# ═══════════════════════════════════════════════════════════════════
# STEP 3: Feature engineering
# ═══════════════════════════════════════════════════════════════════
print("\n[3/7] Engineering features …")

df['age_at_removal'] = df['AgeAtLatRem'].where(df['AgeAtLatRem'] < 99)

disability_cols = ['MR', 'VISHEAR', 'PHYDIS', 'EmotDist', 'OTHERMED']
for c in disability_cols:
    df[c] = df[c].fillna(0).clip(0, 1).astype(int)
df['has_disability'] = df[disability_cols].max(axis=1)
df['has_clinical_disability'] = (df['CLINDIS'] == 1).astype(int)
df['has_behavioral'] = df['CHBEHPRB'].fillna(0).clip(0, 1).astype(int)

removal_reason_cols = [
    'PHYABUSE', 'SEXABUSE', 'NEGLECT', 'AAPARENT', 'DAPARENT',
    'AACHILD', 'DACHILD', 'CHILDIS', 'PRTSDIED', 'PRTSJAIL',
    'NOCOPE', 'ABANDMNT', 'RELINQSH', 'HOUSING'
]
for c in removal_reason_cols:
    df[c] = df[c].fillna(0).clip(0, 1).astype(int)
df['num_removal_reasons'] = df[removal_reason_cols].sum(axis=1)

df['placement_type'] = df['CURPLSET'].where(df['CURPLSET'].isin([1,2,3,4,5,6,7,8]))
df['case_goal'] = df['CASEGOAL'].where(df['CASEGOAL'].isin([1,2,3,4,5,6,7]))
df['is_male'] = (df['SEX'] == 1).astype(int)
df['race'] = df['RaceEthn'].where(df['RaceEthn'].isin(range(1, 8)))
df['total_removals'] = df['TOTALREM'].where(df['TOTALREM'] < 98)
df['num_placements'] = df['NUMPLEP'].where(df['NUMPLEP'] < 98)
df['los_current_setting'] = pd.to_numeric(df.get('SettingLOS', pd.Series(dtype=float)), errors='coerce')
df['los_latest_removal']  = pd.to_numeric(df.get('LatRemLOS', pd.Series(dtype=float)), errors='coerce')
df['ever_adopted'] = df['EVERADPT'].fillna(0).clip(0, 1).astype(int)
df['mandatory_removal'] = df['MANREM'].fillna(0).clip(0, 1).astype(int)

FEATURE_COLS = [
    'age_at_removal', 'is_male', 'race',
    'total_removals', 'num_placements', 'placement_type', 'case_goal',
    'has_disability', 'has_clinical_disability', 'has_behavioral',
    'num_removal_reasons',
    'PHYABUSE', 'SEXABUSE', 'NEGLECT', 'AAPARENT', 'DAPARENT',
    'AACHILD', 'DACHILD', 'CHILDIS',
    'NOCOPE', 'ABANDMNT', 'HOUSING', 'PRTSJAIL',
    'los_current_setting', 'los_latest_removal',
    'ever_adopted', 'mandatory_removal',
]
print(f"  {len(FEATURE_COLS)} features selected")

# ═══════════════════════════════════════════════════════════════════
# STEP 4: Prepare modelling data
# ═══════════════════════════════════════════════════════════════════
print("\n[4/7] Preparing modelling data …")

model_df = df[FEATURE_COLS + ['disruption']].copy()

cat_cols = ['placement_type', 'case_goal', 'race']
model_df = pd.get_dummies(model_df, columns=cat_cols, prefix=cat_cols, dummy_na=False)

for c in model_df.columns:
    if model_df[c].isna().any():
        model_df[c] = model_df[c].fillna(model_df[c].median())

y = model_df['disruption']
X = model_df.drop(columns=['disruption'])
feature_names = list(X.columns)
print(f"  {len(feature_names)} final features, {len(X):,} records")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"  Train: {len(X_train):,}  Test: {len(X_test):,}")
print(f"  Disruption rate — train: {y_train.mean():.3f}, test: {y_test.mean():.3f}")

# ═══════════════════════════════════════════════════════════════════
# STEP 5: Train Random Forest
# ═══════════════════════════════════════════════════════════════════
print("\n[5/7] Training Random Forest …")
t5 = time.time()

rf = RandomForestClassifier(
    n_estimators=100,
    max_depth=8,
    min_samples_leaf=30,
    class_weight='balanced',
    random_state=42,
    n_jobs=1
)
rf.fit(X_train, y_train)
rf_proba = rf.predict_proba(X_test)[:, 1]
rf_auc = roc_auc_score(y_test, rf_proba)
rf_ap  = average_precision_score(y_test, rf_proba)
print(f"  ROC-AUC:  {rf_auc:.4f}")
print(f"  Avg Prec: {rf_ap:.4f}  ({time.time()-t5:.1f}s)")

# ═══════════════════════════════════════════════════════════════════
# STEP 6: Train XGBoost
# ═══════════════════════════════════════════════════════════════════
best_model, best_proba, best_name, best_auc = rf, rf_proba, 'RandomForest', rf_auc

if HAS_XGB:
    print("\n[6/7] Training XGBoost …")
    t6 = time.time()
    scale_pos = (y_train == 0).sum() / max((y_train == 1).sum(), 1)
    xgb_model = xgb.XGBClassifier(
        n_estimators=150,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=scale_pos,
        eval_metric='logloss',
        random_state=42,
        n_jobs=1,
        use_label_encoder=False,
    )
    xgb_model.fit(X_train, y_train, verbose=False)
    xgb_proba = xgb_model.predict_proba(X_test)[:, 1]
    xgb_auc = roc_auc_score(y_test, xgb_proba)
    xgb_ap  = average_precision_score(y_test, xgb_proba)
    print(f"  ROC-AUC:  {xgb_auc:.4f}")
    print(f"  Avg Prec: {xgb_ap:.4f}  ({time.time()-t6:.1f}s)")

    if xgb_auc > rf_auc:
        best_model, best_proba, best_name, best_auc = xgb_model, xgb_proba, 'XGBoost', xgb_auc
else:
    print("\n  (Skipping XGBoost)")

print(f"\n  >>> Best model: {best_name} (AUC={best_auc:.4f})")

# ═══════════════════════════════════════════════════════════════════
# STEP 7: Evaluate & Export
# ═══════════════════════════════════════════════════════════════════
print("\n[7/7] Evaluation & export …")

y_pred = (best_proba >= 0.5).astype(int)
print("\n  Classification Report:")
report = classification_report(y_test, y_pred, target_names=['Stable', 'Disrupted'])
print(report)

cm = confusion_matrix(y_test, y_pred)
print("  Confusion Matrix:")
print(f"    TN={cm[0,0]:,}  FP={cm[0,1]:,}")
print(f"    FN={cm[1,0]:,}  TP={cm[1,1]:,}")

# Feature importance
importances = best_model.feature_importances_
feat_imp = pd.DataFrame({
    'feature': feature_names,
    'importance': importances
}).sort_values('importance', ascending=False)
print("\n  Top 15 Features:")
for _, row in feat_imp.head(15).iterrows():
    print(f"    {row['feature']:30s}  {row['importance']:.4f}")

# Save model
model_path = os.path.join(OUT_DIR, 'placement_model.pkl')
joblib.dump(best_model, model_path)
print(f"\n  Model saved: {model_path}")

# Save feature names & metadata
meta = {
    'model_type': best_name,
    'roc_auc': round(best_auc, 4),
    'feature_names': feature_names,
    'feature_count': len(feature_names),
    'train_samples': int(len(X_train)),
    'test_samples': int(len(X_test)),
    'disruption_rate': round(float(y.mean()), 4),
}
meta_path = os.path.join(OUT_DIR, 'model_metadata.json')
with open(meta_path, 'w') as f:
    json.dump(meta, f, indent=2)
print(f"  Metadata saved: {meta_path}")

# Save feature importance
feat_imp.to_csv(os.path.join(OUT_DIR, 'feature_importance.csv'), index=False)
print(f"  Feature importance saved: {OUT_DIR}/feature_importance.csv")

# Score ALL records
print("\n  Scoring all records …")
X_all = model_df.drop(columns=['disruption'])
all_proba = best_model.predict_proba(X_all)[:, 1]
df['priority_score'] = all_proba

df['risk_tier'] = pd.cut(
    df['priority_score'],
    bins=[0, 0.3, 0.6, 0.8, 1.0],
    labels=['Low', 'Medium', 'High', 'Critical'],
    include_lowest=True
)

print("\n  Risk Tier Distribution:")
tier_dist = df['risk_tier'].value_counts()
for tier in ['Critical', 'High', 'Medium', 'Low']:
    if tier in tier_dist.index:
        cnt = tier_dist[tier]
        print(f"    {tier:>10}: {cnt:>8,}  ({100*cnt/len(df):.1f}%)")

# Export scored cases
export_cols = [
    'RecNumbr', 'StFCID', 'FIPSCode', 'FY',
    'age_at_removal', 'is_male', 'race',
    'total_removals', 'num_placements', 'placement_type', 'case_goal',
    'has_disability', 'has_clinical_disability', 'has_behavioral',
    'num_removal_reasons',
    'los_current_setting', 'los_latest_removal',
    'disruption', 'priority_score', 'risk_tier',
]
export_cols = [c for c in export_cols if c in df.columns]
scored_df = df[export_cols].copy()
scored_path = os.path.join(OUT_DIR, 'scored_cases.csv')
scored_df.to_csv(scored_path, index=False)
print(f"\n  Scored cases exported: {scored_path}")
print(f"  Total scored: {len(scored_df):,}")

# Top 10 highest-risk
print("\n  Top 10 Highest Risk Cases:")
top10 = scored_df.nlargest(10, 'priority_score')
for _, r in top10.iterrows():
    print(f"    {r.get('RecNumbr','?'):>12s}  age={r.get('age_at_removal','?'):>5}  "
          f"placements={r.get('num_placements','?'):>3}  "
          f"score={r['priority_score']:.3f}  tier={r['risk_tier']}")

elapsed = time.time() - t0
print(f"\n{'='*60}")
print(f"  DONE in {elapsed:.0f}s  |  Model: {best_name}  |  AUC: {best_auc:.4f}")
print(f"{'='*60}")
