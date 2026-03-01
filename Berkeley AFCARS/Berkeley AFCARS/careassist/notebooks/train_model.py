"""
CareAssist – Placement Stability Prediction Model
Train on real AFCARS FY2022-2023 data
"""
import os, sys, warnings, json
warnings.filterwarnings('ignore')

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    classification_report, roc_auc_score, average_precision_score,
    confusion_matrix, roc_curve, precision_recall_curve
)
import joblib

# Optional imports – gracefully degrade
try:
    import xgboost as xgb
    HAS_XGB = True
except ImportError:
    HAS_XGB = False
    print("⚠ xgboost not available – will use Random Forest only")

try:
    from imblearn.over_sampling import SMOTE
    HAS_SMOTE = True
except ImportError:
    HAS_SMOTE = False
    print("⚠ imblearn not available – skipping SMOTE")

try:
    import matplotlib
    matplotlib.use('Agg')          # non-interactive backend
    import matplotlib.pyplot as plt
    import seaborn as sns
    HAS_PLOT = True
except ImportError:
    HAS_PLOT = False

try:
    import shap
    HAS_SHAP = True
except ImportError:
    HAS_SHAP = False
    print("⚠ shap not available – skipping SHAP analysis")

# ── paths ────────────────────────────────────────────────────────────
DATA_DIR  = r'C:\Users\Samantha Townsend\Downloads\Berkeley AFCARS\Berkeley AFCARS\afcars_data'
OUT_DIR   = os.path.join(os.path.dirname(__file__), '..', 'ml_output')
os.makedirs(OUT_DIR, exist_ok=True)

# ── 1. Load data ────────────────────────────────────────────────────
print("=" * 60)
print("STEP 1 / 8 — Loading AFCARS data")
print("=" * 60)

dtype_spec = {
    'RecNumbr': str, 'FIPSCode': str, 'StFCID': str,
    'NUMPLEP': 'Int64', 'TOTALREM': 'Int64', 'CURPLSET': 'Int64',
    'CASEGOAL': 'Int64', 'SEX': 'Int64', 'CLINDIS': 'Int64',
    'MR': 'Int64', 'VISHEAR': 'Int64', 'PHYDIS': 'Int64',
    'EmotDist': 'Int64', 'OTHERMED': 'Int64', 'CHBEHPRB': 'Int64',
    'PHYABUSE': 'Int64', 'SEXABUSE': 'Int64', 'NEGLECT': 'Int64',
    'AAPARENT': 'Int64', 'DAPARENT': 'Int64', 'AACHILD': 'Int64',
    'DACHILD': 'Int64', 'CHILDIS': 'Int64', 'PRTSDIED': 'Int64',
    'PRTSJAIL': 'Int64', 'NOCOPE': 'Int64', 'ABANDMNT': 'Int64',
    'RELINQSH': 'Int64', 'HOUSING': 'Int64', 'MANREM': 'Int64',
    'EVERADPT': 'Int64', 'DISREASN': 'Int64', 'PLACEOUT': 'Int64',
    'IsTPR': 'Int64', 'IsWaiting': 'Int64', 'AgedOut': 'Int64',
    'RaceEthn': 'Int64',
}
date_cols = ['DOB', 'Rem1Dt', 'LatRemDt', 'CurSetDt', 'DLstFCDt', 'DoDFCDt',
             'TPRMomDt', 'TPRDadDt', 'TPRDate', 'PedRevDt', 'RemTrnDt', 'DoDTrnDt']

print("  Loading FY2023 …")
df23 = pd.read_csv(f'{DATA_DIR}/FC2023ABv1.tab', sep='\t',
                   dtype=dtype_spec, parse_dates=date_cols, low_memory=False)
print(f"    {df23.shape[0]:,} records")

print("  Loading FY2022 …")
df22 = pd.read_csv(f'{DATA_DIR}/FC2022ABv1.tab', sep='\t',
                   dtype=dtype_spec, parse_dates=date_cols, low_memory=False)
print(f"    {df22.shape[0]:,} records")

df = pd.concat([df22, df23], ignore_index=True)
print(f"  Combined: {df.shape[0]:,} records × {df.shape[1]} columns\n")

# ── 2. Define target variable ──────────────────────────────────────
print("=" * 60)
print("STEP 2 / 8 — Defining target variable (placement disruption)")
print("=" * 60)

DISRUPTION_CODES = {6, 7}   # Transfer to another agency / Runaway

def label_disruption(row):
    """1 = placement disrupted, 0 = stable / normal exit"""
    disreasn = row.get('DISREASN')
    numplep  = row.get('NUMPLEP')
    if pd.notna(disreasn) and int(disreasn) in DISRUPTION_CODES:
        return 1
    if pd.notna(numplep) and int(numplep) >= 3:
        return 1
    return 0

df['disruption'] = df.apply(label_disruption, axis=1)
pos = df['disruption'].sum()
neg = len(df) - pos
print(f"  Disrupted: {pos:,}  ({100*pos/len(df):.1f}%)")
print(f"  Stable:    {neg:,}  ({100*neg/len(df):.1f}%)\n")

# ── 3. Feature engineering ─────────────────────────────────────────
print("=" * 60)
print("STEP 3 / 8 — Feature engineering")
print("=" * 60)

# Age at latest removal (keep valid only)
df['age_at_removal'] = df['AgeAtLatRem'].where(df['AgeAtLatRem'] < 99)

# Binary disability flag (any disability present)
disability_cols = ['MR', 'VISHEAR', 'PHYDIS', 'EmotDist', 'OTHERMED']
for c in disability_cols:
    df[c] = df[c].fillna(0).clip(0, 1).astype(int)
df['has_disability'] = df[disability_cols].max(axis=1)

# Clinical disability flag (1 = yes)
df['has_clinical_disability'] = (df['CLINDIS'] == 1).astype(int)

# Behavioral problems flag
df['has_behavioral'] = df['CHBEHPRB'].fillna(0).clip(0, 1).astype(int)

# Removal reason flags (already binary 0/1)
removal_reason_cols = [
    'PHYABUSE', 'SEXABUSE', 'NEGLECT', 'AAPARENT', 'DAPARENT',
    'AACHILD', 'DACHILD', 'CHILDIS', 'PRTSDIED', 'PRTSJAIL',
    'NOCOPE', 'ABANDMNT', 'RELINQSH', 'HOUSING'
]
for c in removal_reason_cols:
    df[c] = df[c].fillna(0).clip(0, 1).astype(int)

# Count of removal reasons
df['num_removal_reasons'] = df[removal_reason_cols].sum(axis=1)

# Placement type (keep raw, will one-hot)
df['placement_type'] = df['CURPLSET'].where(df['CURPLSET'].isin([1,2,3,4,5,6,7,8]))

# Case goal
df['case_goal'] = df['CASEGOAL'].where(df['CASEGOAL'].isin([1,2,3,4,5,6,7]))

# Sex (1=Male, 2=Female → binary male)
df['is_male'] = (df['SEX'] == 1).astype(int)

# Race/Ethnicity (keep as categorical)
df['race'] = df['RaceEthn'].where(df['RaceEthn'].isin(range(1, 8)))

# Total removals
df['total_removals'] = df['TOTALREM'].where(df['TOTALREM'] < 98)

# Number placements this episode
df['num_placements'] = df['NUMPLEP'].where(df['NUMPLEP'] < 98)

# Length-of-stay features (days)
df['los_current_setting'] = pd.to_numeric(df.get('SettingLOS', pd.Series(dtype=float)), errors='coerce')
df['los_latest_removal']  = pd.to_numeric(df.get('LatRemLOS', pd.Series(dtype=float)), errors='coerce')

# Ever adopted before
df['ever_adopted'] = df['EVERADPT'].fillna(0).clip(0, 1).astype(int)

# Mandatory removal flag
df['mandatory_removal'] = df['MANREM'].fillna(0).clip(0, 1).astype(int)

# ── Feature list
FEATURE_COLS = [
    'age_at_removal', 'is_male', 'race',
    'total_removals', 'num_placements', 'placement_type', 'case_goal',
    'has_disability', 'has_clinical_disability', 'has_behavioral',
    'num_removal_reasons',
    'PHYABUSE', 'SEXABUSE', 'NEGLECT', 'AAPARENT', 'DAPARENT',
    'NOCOPE', 'ABANDMNT', 'HOUSING',
    'los_current_setting', 'los_latest_removal',
    'ever_adopted', 'mandatory_removal',
]

print(f"  {len(FEATURE_COLS)} features selected")
print(f"  Columns: {FEATURE_COLS}\n")

# ── 4. Prepare modelling data ──────────────────────────────────────
print("=" * 60)
print("STEP 4 / 8 — Preparing modelling data")
print("=" * 60)

model_df = df[FEATURE_COLS + ['disruption']].copy()
print(f"  Before dropna: {len(model_df):,}")

# One-hot encode categoricals
cat_cols = ['placement_type', 'case_goal', 'race']
model_df = pd.get_dummies(model_df, columns=cat_cols, prefix=cat_cols, dummy_na=False)

# Fill remaining NaN with median
for c in model_df.columns:
    if model_df[c].isna().any():
        model_df[c] = model_df[c].fillna(model_df[c].median())

print(f"  After encoding: {model_df.shape[1]} columns")
print(f"  Rows: {len(model_df):,}\n")

y = model_df['disruption']
X = model_df.drop(columns=['disruption'])
feature_names = list(X.columns)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"  Train: {len(X_train):,}   Test: {len(X_test):,}")
print(f"  Train disruption rate: {y_train.mean():.3f}")
print(f"  Test  disruption rate: {y_test.mean():.3f}")

# SMOTE if available
if HAS_SMOTE:
    sm = SMOTE(random_state=42)
    X_train_sm, y_train_sm = sm.fit_resample(X_train, y_train)
    print(f"  After SMOTE: {len(X_train_sm):,} training samples")
else:
    X_train_sm, y_train_sm = X_train, y_train
print()

# ── 5. Train Random Forest ─────────────────────────────────────────
print("=" * 60)
print("STEP 5 / 8 — Training Random Forest")
print("=" * 60)

rf = RandomForestClassifier(
    n_estimators=300,
    max_depth=12,
    min_samples_leaf=20,
    class_weight='balanced',
    random_state=42,
    n_jobs=-1
)
rf.fit(X_train_sm, y_train_sm)
rf_proba = rf.predict_proba(X_test)[:, 1]
rf_auc   = roc_auc_score(y_test, rf_proba)
rf_ap    = average_precision_score(y_test, rf_proba)
print(f"  ROC-AUC:  {rf_auc:.4f}")
print(f"  Avg Prec: {rf_ap:.4f}\n")

# ── 6. Train XGBoost ───────────────────────────────────────────────
best_model = rf
best_proba = rf_proba
best_name  = 'RandomForest'
best_auc   = rf_auc

if HAS_XGB:
    print("=" * 60)
    print("STEP 6 / 8 — Training XGBoost")
    print("=" * 60)

    scale_pos = (y_train_sm == 0).sum() / max((y_train_sm == 1).sum(), 1)
    xgb_model = xgb.XGBClassifier(
        n_estimators=300,
        max_depth=8,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=scale_pos,
        eval_metric='logloss',
        random_state=42,
        n_jobs=-1,
        use_label_encoder=False,
    )
    xgb_model.fit(X_train_sm, y_train_sm, verbose=False)
    xgb_proba = xgb_model.predict_proba(X_test)[:, 1]
    xgb_auc   = roc_auc_score(y_test, xgb_proba)
    xgb_ap    = average_precision_score(y_test, xgb_proba)
    print(f"  ROC-AUC:  {xgb_auc:.4f}")
    print(f"  Avg Prec: {xgb_ap:.4f}\n")

    if xgb_auc > rf_auc:
        best_model = xgb_model
        best_proba = xgb_proba
        best_name  = 'XGBoost'
        best_auc   = xgb_auc
else:
    print("  (Skipping XGBoost – not installed)\n")

print(f"  ✅ Best model: {best_name} (AUC={best_auc:.4f})\n")

# ── 7. Evaluation ──────────────────────────────────────────────────
print("=" * 60)
print("STEP 7 / 8 — Evaluation")
print("=" * 60)

y_pred = (best_proba >= 0.5).astype(int)
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=['Stable', 'Disrupted']))

cm = confusion_matrix(y_test, y_pred)
print("Confusion Matrix:")
print(cm)
print()

# Feature importance
if best_name == 'XGBoost' and HAS_XGB:
    importances = best_model.feature_importances_
else:
    importances = rf.feature_importances_

feat_imp = pd.DataFrame({
    'feature': feature_names,
    'importance': importances
}).sort_values('importance', ascending=False)
print("Top 15 Features:")
print(feat_imp.head(15).to_string(index=False))
print()

# Save plots
if HAS_PLOT:
    # ROC curve
    fpr, tpr, _ = roc_curve(y_test, best_proba)
    fig, axes = plt.subplots(1, 3, figsize=(18, 5))

    axes[0].plot(fpr, tpr, 'b-', lw=2, label=f'{best_name} AUC={best_auc:.3f}')
    if HAS_XGB and best_name != 'XGBoost':
        pass  # already best
    elif HAS_XGB:
        fpr_rf, tpr_rf, _ = roc_curve(y_test, rf_proba)
        axes[0].plot(fpr_rf, tpr_rf, 'r--', lw=1, label=f'RF AUC={rf_auc:.3f}')
    axes[0].plot([0,1],[0,1],'k--',lw=0.5)
    axes[0].set_xlabel('False Positive Rate')
    axes[0].set_ylabel('True Positive Rate')
    axes[0].set_title('ROC Curve')
    axes[0].legend()

    # Precision-Recall
    prec, rec, _ = precision_recall_curve(y_test, best_proba)
    axes[1].plot(rec, prec, 'b-', lw=2)
    axes[1].set_xlabel('Recall')
    axes[1].set_ylabel('Precision')
    axes[1].set_title('Precision-Recall Curve')

    # Feature importance
    top15 = feat_imp.head(15)
    axes[2].barh(range(15), top15['importance'].values, color='steelblue')
    axes[2].set_yticks(range(15))
    axes[2].set_yticklabels(top15['feature'].values)
    axes[2].invert_yaxis()
    axes[2].set_title('Top 15 Feature Importances')

    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, 'model_evaluation.png'), dpi=150)
    print(f"  Saved: {OUT_DIR}/model_evaluation.png")

    # Confusion matrix heatmap
    fig2, ax2 = plt.subplots(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                xticklabels=['Stable', 'Disrupted'],
                yticklabels=['Stable', 'Disrupted'], ax=ax2)
    ax2.set_xlabel('Predicted')
    ax2.set_ylabel('Actual')
    ax2.set_title('Confusion Matrix')
    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, 'confusion_matrix.png'), dpi=150)
    print(f"  Saved: {OUT_DIR}/confusion_matrix.png")

# SHAP
if HAS_SHAP:
    print("\n  Computing SHAP values (sample of 500) …")
    explainer = shap.TreeExplainer(best_model)
    X_sample  = X_test.sample(min(500, len(X_test)), random_state=42)
    shap_vals = explainer.shap_values(X_sample)
    if isinstance(shap_vals, list):
        shap_vals = shap_vals[1]

    if HAS_PLOT:
        fig3, ax3 = plt.subplots(figsize=(10, 8))
        shap.summary_plot(shap_vals, X_sample, feature_names=feature_names,
                          show=False, max_display=20)
        plt.tight_layout()
        plt.savefig(os.path.join(OUT_DIR, 'shap_summary.png'), dpi=150, bbox_inches='tight')
        print(f"  Saved: {OUT_DIR}/shap_summary.png")
        plt.close('all')

# ── 8. Export ──────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("STEP 8 / 8 — Exporting model & scored data")
print("=" * 60)

# Save model
model_path = os.path.join(OUT_DIR, 'placement_model.pkl')
joblib.dump(best_model, model_path)
print(f"  Model saved: {model_path}")

# Save feature names
meta = {
    'model_type': best_name,
    'roc_auc': round(best_auc, 4),
    'feature_names': feature_names,
    'feature_count': len(feature_names),
    'train_samples': len(X_train_sm),
    'test_samples': len(X_test),
}
with open(os.path.join(OUT_DIR, 'model_metadata.json'), 'w') as f:
    json.dump(meta, f, indent=2)
print(f"  Metadata saved: {OUT_DIR}/model_metadata.json")

# Score ALL records
print("  Scoring all records …")
X_all = model_df.drop(columns=['disruption'])
all_proba = best_model.predict_proba(X_all)[:, 1]
df['priority_score'] = all_proba

# Create urgency tiers
df['risk_tier'] = pd.cut(
    df['priority_score'],
    bins=[0, 0.3, 0.6, 0.8, 1.0],
    labels=['Low', 'Medium', 'High', 'Critical'],
    include_lowest=True
)

tier_dist = df['risk_tier'].value_counts()
print("\n  Risk Tier Distribution:")
for tier in ['Critical', 'High', 'Medium', 'Low']:
    if tier in tier_dist.index:
        cnt = tier_dist[tier]
        print(f"    {tier:>10}: {cnt:>8,}  ({100*cnt/len(df):.1f}%)")

# Export scored cases (subset of columns for dashboard)
export_cols = [
    'RecNumbr', 'StFCID', 'FIPSCode', 'STATE', 'FY',
    'age_at_removal', 'is_male', 'race',
    'total_removals', 'num_placements', 'placement_type', 'case_goal',
    'has_disability', 'has_clinical_disability', 'has_behavioral',
    'num_removal_reasons',
    'los_current_setting', 'los_latest_removal',
    'disruption', 'priority_score', 'risk_tier',
]
# Keep only existing columns
export_cols = [c for c in export_cols if c in df.columns]
scored_df = df[export_cols].copy()
scored_path = os.path.join(OUT_DIR, 'scored_cases.csv')
scored_df.to_csv(scored_path, index=False)
print(f"\n  Scored cases saved: {scored_path}")
print(f"  Total scored: {len(scored_df):,}")

# Summary sample
print("\n  Sample scored cases (top 10 highest risk):")
top10 = scored_df.nlargest(10, 'priority_score')[
    ['RecNumbr', 'age_at_removal', 'num_placements', 'priority_score', 'risk_tier']
]
print(top10.to_string(index=False))

print("\n" + "=" * 60)
print("✅ MODEL TRAINING COMPLETE")
print(f"   Model: {best_name}  |  AUC: {best_auc:.4f}")
print(f"   Output dir: {OUT_DIR}")
print("=" * 60)
