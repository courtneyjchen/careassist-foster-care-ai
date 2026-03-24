import json, os

nb = {
    'nbformat': 4,
    'nbformat_minor': 0,
    'metadata': {
        'colab': {'provenance': [], 'name': 'CareAssist_Placement_Stability_Model.ipynb'},
        'kernelspec': {'name': 'python3', 'display_name': 'Python 3'},
        'language_info': {'name': 'python'}
    },
    'cells': []
}

def md(src):
    return {'cell_type': 'markdown', 'metadata': {}, 'source': src}

def code(src):
    return {'cell_type': 'code', 'metadata': {}, 'source': src, 'execution_count': None, 'outputs': []}

# Cell 0: Markdown header
nb['cells'].append(md([
    '# CareAssist - Placement Stability Prediction Model\n',
    '**Train on real AFCARS FY2020-2024 data (5 years)**\n',
    '\n',
    '## Instructions\n',
    '1. Run Cell 1 to install packages\n',
    '2. Run Cell 2 (imports)\n',
    '3. Run Cell 3 - upload **Berkeley_AFCARS_CSVs_UTF8.zip**\n',
    '4. Then **Runtime > Run all** remaining cells\n',
    '5. Cell 16 will auto-download a zip with all outputs'
]))

# Cell 1: Install
nb['cells'].append(code([
    '# Cell 1: Install packages\n',
    '!pip install -q xgboost shap imbalanced-learn'
]))

# Cell 2: Imports
nb['cells'].append(code([
    '# Cell 2: Imports\n',
    'import pandas as pd\n',
    'import numpy as np\n',
    'import matplotlib.pyplot as plt\n',
    'import seaborn as sns\n',
    'import warnings, json, os, glob, zipfile\n',
    'warnings.filterwarnings("ignore")\n',
    '\n',
    'from sklearn.model_selection import train_test_split\n',
    'from sklearn.ensemble import RandomForestClassifier\n',
    'from sklearn.metrics import (\n',
    '    classification_report, roc_auc_score, average_precision_score,\n',
    '    confusion_matrix, roc_curve, precision_recall_curve\n',
    ')\n',
    'import xgboost as xgb\n',
    'import shap\n',
    'import joblib\n',
    'from imblearn.over_sampling import SMOTE\n',
    '\n',
    'plt.rcParams["figure.figsize"] = (12, 6)\n',
    'plt.rcParams["font.size"] = 12\n',
    'sns.set_style("whitegrid")\n',
    'print("All imports OK")'
]))

# Cell 3: Upload zip
nb['cells'].append(code([
    '# Cell 3: Upload Berkeley_AFCARS_CSVs_UTF8.zip\n',
    'from google.colab import files\n',
    'print("Upload Berkeley_AFCARS_CSVs_UTF8.zip")\n',
    'uploaded = files.upload()\n',
    'print(f"Uploaded {len(uploaded)} file(s)")\n',
    '\n',
    '# Extract the zip\n',
    'import zipfile\n',
    'for zf in uploaded.keys():\n',
    '    if zf.endswith(".zip"):\n',
    '        print(f"Extracting {zf}...")\n',
    '        with zipfile.ZipFile(zf, "r") as z:\n',
    '            z.extractall("afcars_csv")\n',
    '            print(f"  Extracted {len(z.namelist())} files")\n',
    'print("Done")'
]))

# Cell 4: Load CSV files (exclude 2019)
nb['cells'].append(code([
    '# Cell 4: Load CSV files (excluding 2019)\n',
    'csv_files = sorted(glob.glob("afcars_csv/**/*.csv", recursive=True) + glob.glob("afcars_csv/*.csv"))\n',
    '# Also check if CSVs landed in a subfolder\n',
    'if not csv_files:\n',
    '    csv_files = sorted(glob.glob("**/*.csv", recursive=True))\n',
    'csv_files = [f for f in csv_files if "2019" not in f]  # Exclude 2019\n',
    'print(f"Found {len(csv_files)} CSV files (2019 excluded):")\n',
    'for f in csv_files:\n',
    '    print(f"  {f}")\n',
    '\n',
    'USE_COLS = [\n',
    '    "RecNumbr", "FIPSCode", "StFCID", "FY",\n',
    '    "NUMPLEP", "TOTALREM", "CURPLSET", "CASEGOAL", "SEX", "CLINDIS",\n',
    '    "MR", "VISHEAR", "PHYDIS", "EmotDist", "OTHERMED", "CHBEHPRB",\n',
    '    "PHYABUSE", "SEXABUSE", "NEGLECT", "AAPARENT", "DAPARENT",\n',
    '    "AACHILD", "DACHILD", "CHILDIS", "PRTSDIED", "PRTSJAIL",\n',
    '    "NOCOPE", "ABANDMNT", "RELINQSH", "HOUSING", "MANREM",\n',
    '    "EVERADPT", "DISREASN", "PLACEOUT",\n',
    '    "AgeAtLatRem", "RaceEthn", "SettingLOS", "LatRemLOS",\n',
    ']\n',
    '\n',
    'def load_csv(path):\n',
    '    header = pd.read_csv(path, nrows=0)\n',
    '    cols = [c for c in USE_COLS if c in header.columns]\n',
    '    d = pd.read_csv(path, usecols=cols, dtype=str, low_memory=False)\n',
    '    for c in d.columns:\n',
    '        if c not in ("RecNumbr", "FIPSCode", "StFCID", "FY"):\n',
    '            d[c] = pd.to_numeric(d[c], errors="coerce")\n',
    '    return d\n',
    '\n',
    'dfs = []\n',
    'for f in sorted(csv_files):\n',
    '    print(f"Loading {os.path.basename(f)}...")\n',
    '    d = load_csv(f)\n',
    '    print(f"  {len(d):,} records")\n',
    '    dfs.append(d)\n',
    '\n',
    'df = pd.concat(dfs, ignore_index=True)\n',
    'print(f"\\nCombined: {len(df):,} records x {df.shape[1]} columns")\n',
    'print(f\'Fiscal years: {sorted(df["FY"].dropna().unique())}\')\n',
    'df.head()'
]))

# Cell 5: Target
nb['cells'].append(code([
    '# Cell 5: Define target variable\n',
    '# Disrupted = discharge reason Transfer(6)/Runaway(7) OR 3+ placements\n',
    '# NUMPLEP excluded from features to avoid data leakage\n',
    '\n',
    'DISRUPTION_CODES = {6, 7}\n',
    '\n',
    'def label_disruption(row):\n',
    '    d = row["DISREASN"]\n',
    '    n = row["NUMPLEP"]\n',
    '    if pd.notna(d) and int(d) in DISRUPTION_CODES:\n',
    '        return 1\n',
    '    if pd.notna(n) and int(n) >= 3:\n',
    '        return 1\n',
    '    return 0\n',
    '\n',
    'df["disruption"] = df.apply(label_disruption, axis=1)\n',
    'pos = df["disruption"].sum()\n',
    'print(f"Disrupted: {pos:,} ({100*pos/len(df):.1f}%)")\n',
    'print(f"Stable:    {len(df)-pos:,} ({100*(len(df)-pos)/len(df):.1f}%)")\n',
    'print("\\nBy fiscal year:")\n',
    'print(df.groupby("FY")["disruption"].agg(["count","mean","sum"]).to_string())'
]))

# Cell 6: Feature engineering
nb['cells'].append(code([
    '# Cell 6: Feature engineering\n',
    'df["age_at_removal"] = df["AgeAtLatRem"].where(df["AgeAtLatRem"] < 99)\n',
    '\n',
    'disability_cols = ["MR", "VISHEAR", "PHYDIS", "EmotDist", "OTHERMED"]\n',
    'for c in disability_cols:\n',
    '    df[c] = df[c].fillna(0).clip(0, 1).astype(int)\n',
    'df["has_disability"] = df[disability_cols].max(axis=1)\n',
    'df["has_clinical_disability"] = (df["CLINDIS"] == 1).astype(int)\n',
    'df["has_behavioral"] = df["CHBEHPRB"].fillna(0).clip(0, 1).astype(int)\n',
    '\n',
    'removal_reason_cols = [\n',
    '    "PHYABUSE","SEXABUSE","NEGLECT","AAPARENT","DAPARENT",\n',
    '    "AACHILD","DACHILD","CHILDIS","PRTSDIED","PRTSJAIL",\n',
    '    "NOCOPE","ABANDMNT","RELINQSH","HOUSING"\n',
    ']\n',
    'for c in removal_reason_cols:\n',
    '    df[c] = df[c].fillna(0).clip(0, 1).astype(int)\n',
    'df["num_removal_reasons"] = df[removal_reason_cols].sum(axis=1)\n',
    '\n',
    'df["placement_type"] = df["CURPLSET"].where(df["CURPLSET"].isin([1,2,3,4,5,6,7,8]))\n',
    'df["case_goal"] = df["CASEGOAL"].where(df["CASEGOAL"].isin([1,2,3,4,5,6,7]))\n',
    'df["is_male"] = (df["SEX"] == 1).astype(int)\n',
    'df["race"] = df["RaceEthn"].where(df["RaceEthn"].isin(range(1, 8)))\n',
    'df["total_removals"] = df["TOTALREM"].where(df["TOTALREM"] < 98)\n',
    '\n',
    'if "SettingLOS" in df.columns:\n',
    '    df["los_current_setting"] = pd.to_numeric(df["SettingLOS"], errors="coerce")\n',
    'else:\n',
    '    df["los_current_setting"] = np.nan\n',
    'if "LatRemLOS" in df.columns:\n',
    '    df["los_latest_removal"] = pd.to_numeric(df["LatRemLOS"], errors="coerce")\n',
    'else:\n',
    '    df["los_latest_removal"] = np.nan\n',
    '\n',
    'df["ever_adopted"] = df["EVERADPT"].fillna(0).clip(0, 1).astype(int)\n',
    'df["mandatory_removal"] = df["MANREM"].fillna(0).clip(0, 1).astype(int)\n',
    '\n',
    'FEATURE_COLS = [\n',
    '    "age_at_removal","is_male","race",\n',
    '    "total_removals","placement_type","case_goal",\n',
    '    "has_disability","has_clinical_disability","has_behavioral",\n',
    '    "num_removal_reasons",\n',
    '    "PHYABUSE","SEXABUSE","NEGLECT","AAPARENT","DAPARENT",\n',
    '    "NOCOPE","ABANDMNT","HOUSING",\n',
    '    "los_current_setting","los_latest_removal",\n',
    '    "ever_adopted","mandatory_removal",\n',
    ']\n',
    'print(f"{len(FEATURE_COLS)} features (NUMPLEP excluded to prevent leakage)")'
]))

# Cell 7: EDA
nb['cells'].append(code([
    '# Cell 7: EDA\n',
    'fig, axes = plt.subplots(2, 3, figsize=(18, 10))\n',
    '\n',
    'df["disruption"].value_counts().plot(kind="bar", ax=axes[0,0], color=["steelblue","coral"])\n',
    'axes[0,0].set_title("Target Distribution")\n',
    'axes[0,0].set_xticklabels(["Stable","Disrupted"], rotation=0)\n',
    '\n',
    'df[df["disruption"]==0]["age_at_removal"].hist(bins=20, ax=axes[0,1], alpha=0.6, label="Stable", color="steelblue")\n',
    'df[df["disruption"]==1]["age_at_removal"].hist(bins=20, ax=axes[0,1], alpha=0.6, label="Disrupted", color="coral")\n',
    'axes[0,1].set_title("Age at Removal"); axes[0,1].legend()\n',
    '\n',
    'pt_labels = {1:"Pre-Adopt",2:"Foster-Rel",3:"Foster-NonRel",4:"Group Home",5:"Institution",6:"Sup IL",7:"Runaway",8:"Trial Home"}\n',
    'pt_rates = df.groupby("placement_type")["disruption"].mean().sort_values(ascending=False)\n',
    'pt_rates.index = [pt_labels.get(int(i),str(i)) for i in pt_rates.index]\n',
    'pt_rates.plot(kind="barh", ax=axes[0,2], color="steelblue")\n',
    'axes[0,2].set_title("Disruption by Placement Type")\n',
    '\n',
    'cg_labels = {1:"Reunify",2:"Relative",3:"Adoption",4:"Long-term FC",5:"Emancipation",6:"Guardianship",7:"Not established"}\n',
    'cg_rates = df.groupby("case_goal")["disruption"].mean().sort_values(ascending=False)\n',
    'cg_rates.index = [cg_labels.get(int(i),str(i)) for i in cg_rates.index]\n',
    'cg_rates.plot(kind="barh", ax=axes[1,0], color="coral")\n',
    'axes[1,0].set_title("Disruption by Case Goal")\n',
    '\n',
    'tr = df.groupby("total_removals")["disruption"].mean().head(10)\n',
    'tr.plot(kind="bar", ax=axes[1,1], color="steelblue")\n',
    'axes[1,1].set_title("Disruption by Total Removals")\n',
    'axes[1,1].tick_params(axis="x", rotation=0)\n',
    '\n',
    'yr = df.groupby("FY")["disruption"].mean()\n',
    'yr.plot(kind="bar", ax=axes[1,2], color="coral")\n',
    'axes[1,2].set_title("Disruption by Year")\n',
    'axes[1,2].tick_params(axis="x", rotation=45)\n',
    '\n',
    'plt.suptitle("CareAssist EDA (FY2019-2024)", fontsize=16, y=1.02)\n',
    'plt.tight_layout()\n',
    'plt.savefig("eda_plots.png", dpi=150, bbox_inches="tight")\n',
    'plt.show()'
]))

# Cell 8: Prepare data
nb['cells'].append(code([
    '# Cell 8: Prepare data\n',
    'model_df = df[FEATURE_COLS + ["disruption"]].copy()\n',
    'cat_cols = ["placement_type","case_goal","race"]\n',
    'model_df = pd.get_dummies(model_df, columns=cat_cols, prefix=cat_cols, dummy_na=False)\n',
    '\n',
    'for c in model_df.columns:\n',
    '    if model_df[c].isna().any():\n',
    '        model_df[c] = model_df[c].fillna(model_df[c].median())\n',
    '\n',
    'y = model_df["disruption"]\n',
    'X = model_df.drop(columns=["disruption"])\n',
    'feature_names = list(X.columns)\n',
    'print(f"Features: {len(feature_names)}, Records: {len(X):,}")\n',
    '\n',
    'X_train, X_test, y_train, y_test = train_test_split(\n',
    '    X, y, test_size=0.2, random_state=42, stratify=y)\n',
    'print(f"Train: {len(X_train):,}  Test: {len(X_test):,}")\n',
    'print(f"Disruption rate: train={y_train.mean():.3f} test={y_test.mean():.3f}")\n',
    '\n',
    'sm = SMOTE(random_state=42)\n',
    'X_train_sm, y_train_sm = sm.fit_resample(X_train, y_train)\n',
    'print(f"After SMOTE: {len(X_train_sm):,} balanced samples")'
]))

# Cell 9: Random Forest
nb['cells'].append(code([
    '# Cell 9: Random Forest\n',
    'print("Training Random Forest...")\n',
    'rf = RandomForestClassifier(\n',
    '    n_estimators=300, max_depth=12, min_samples_leaf=20,\n',
    '    class_weight="balanced", random_state=42, n_jobs=-1)\n',
    'rf.fit(X_train_sm, y_train_sm)\n',
    'rf_proba = rf.predict_proba(X_test)[:,1]\n',
    'rf_auc = roc_auc_score(y_test, rf_proba)\n',
    'rf_ap = average_precision_score(y_test, rf_proba)\n',
    'print(f"  ROC-AUC: {rf_auc:.4f}  Avg Precision: {rf_ap:.4f}")'
]))

# Cell 10: XGBoost
nb['cells'].append(code([
    '# Cell 10: XGBoost\n',
    'print("Training XGBoost...")\n',
    'scale_pos = (y_train_sm==0).sum() / max((y_train_sm==1).sum(), 1)\n',
    'xgb_model = xgb.XGBClassifier(\n',
    '    n_estimators=300, max_depth=8, learning_rate=0.05,\n',
    '    subsample=0.8, colsample_bytree=0.8, scale_pos_weight=scale_pos,\n',
    '    eval_metric="logloss", random_state=42, n_jobs=-1, use_label_encoder=False)\n',
    'xgb_model.fit(X_train_sm, y_train_sm, verbose=False)\n',
    'xgb_proba = xgb_model.predict_proba(X_test)[:,1]\n',
    'xgb_auc = roc_auc_score(y_test, xgb_proba)\n',
    'xgb_ap = average_precision_score(y_test, xgb_proba)\n',
    'print(f"  ROC-AUC: {xgb_auc:.4f}  Avg Precision: {xgb_ap:.4f}")\n',
    '\n',
    'if xgb_auc > rf_auc:\n',
    '    best_model, best_proba, best_name, best_auc = xgb_model, xgb_proba, "XGBoost", xgb_auc\n',
    'else:\n',
    '    best_model, best_proba, best_name, best_auc = rf, rf_proba, "RandomForest", rf_auc\n',
    'print(f"\\nBest: {best_name} (AUC={best_auc:.4f})")'
]))

# Cell 11: Evaluation
nb['cells'].append(code([
    '# Cell 11: Evaluation plots\n',
    'fig, axes = plt.subplots(1, 3, figsize=(20, 6))\n',
    '\n',
    'fpr_rf, tpr_rf, _ = roc_curve(y_test, rf_proba)\n',
    'fpr_xg, tpr_xg, _ = roc_curve(y_test, xgb_proba)\n',
    'axes[0].plot(fpr_rf, tpr_rf, "b-", lw=2, label=f"RF AUC={rf_auc:.3f}")\n',
    'axes[0].plot(fpr_xg, tpr_xg, "r-", lw=2, label=f"XGB AUC={xgb_auc:.3f}")\n',
    'axes[0].plot([0,1],[0,1],"k--",lw=0.5)\n',
    'axes[0].set_title("ROC Curve"); axes[0].legend()\n',
    '\n',
    'p_rf, r_rf, _ = precision_recall_curve(y_test, rf_proba)\n',
    'p_xg, r_xg, _ = precision_recall_curve(y_test, xgb_proba)\n',
    'axes[1].plot(r_rf, p_rf, "b-", lw=2, label=f"RF AP={rf_ap:.3f}")\n',
    'axes[1].plot(r_xg, p_xg, "r-", lw=2, label=f"XGB AP={xgb_ap:.3f}")\n',
    'axes[1].set_title("Precision-Recall"); axes[1].legend()\n',
    '\n',
    'y_pred = (best_proba >= 0.5).astype(int)\n',
    'cm = confusion_matrix(y_test, y_pred)\n',
    'sns.heatmap(cm, annot=True, fmt=",d", cmap="Blues",\n',
    '    xticklabels=["Stable","Disrupted"], yticklabels=["Stable","Disrupted"], ax=axes[2])\n',
    'axes[2].set_title(f"Confusion Matrix ({best_name})")\n',
    '\n',
    'plt.suptitle("Model Evaluation", fontsize=16, y=1.02)\n',
    'plt.tight_layout()\n',
    'plt.savefig("model_evaluation.png", dpi=150, bbox_inches="tight")\n',
    'plt.show()\n',
    'print(classification_report(y_test, y_pred, target_names=["Stable","Disrupted"]))'
]))

# Cell 12: Feature importance
nb['cells'].append(code([
    '# Cell 12: Feature importance\n',
    'feat_imp = pd.DataFrame({"feature":feature_names, "importance":best_model.feature_importances_}\n',
    '    ).sort_values("importance", ascending=False)\n',
    '\n',
    'fig, ax = plt.subplots(figsize=(10, 8))\n',
    'top20 = feat_imp.head(20)\n',
    'ax.barh(range(len(top20)), top20["importance"].values, color="steelblue")\n',
    'ax.set_yticks(range(len(top20))); ax.set_yticklabels(top20["feature"].values)\n',
    'ax.invert_yaxis(); ax.set_title(f"Feature Importance ({best_name})")\n',
    'plt.tight_layout()\n',
    'plt.savefig("feature_importance.png", dpi=150, bbox_inches="tight")\n',
    'plt.show()\n',
    'print(feat_imp.head(20).to_string(index=False))'
]))

# Cell 13: SHAP
nb['cells'].append(code([
    '# Cell 13: SHAP\n',
    'print("Computing SHAP (sample=1000)...")\n',
    'explainer = shap.TreeExplainer(best_model)\n',
    'X_sample = X_test.sample(min(1000, len(X_test)), random_state=42)\n',
    'shap_values = explainer.shap_values(X_sample)\n',
    'if isinstance(shap_values, list): shap_values = shap_values[1]\n',
    '\n',
    'plt.figure(figsize=(12, 8))\n',
    'shap.summary_plot(shap_values, X_sample, feature_names=feature_names, show=False, max_display=20)\n',
    'plt.tight_layout()\n',
    'plt.savefig("shap_summary.png", dpi=150, bbox_inches="tight")\n',
    'plt.show()\n',
    '\n',
    'idx = np.argmax(best_model.predict_proba(X_sample)[:,1])\n',
    'ev = explainer.expected_value\n',
    'if isinstance(ev, list): ev = ev[1]\n',
    'shap.plots.waterfall(shap.Explanation(\n',
    '    values=shap_values[idx], base_values=ev,\n',
    '    data=X_sample.iloc[idx], feature_names=feature_names), show=True)\n',
    'print("SHAP done")'
]))

# Cell 14: Score all
nb['cells'].append(code([
    '# Cell 14: Score all records\n',
    'print("Scoring all records...")\n',
    'X_all = model_df.drop(columns=["disruption"])\n',
    'df["priority_score"] = best_model.predict_proba(X_all)[:,1]\n',
    'df["risk_tier"] = pd.cut(df["priority_score"],\n',
    '    bins=[0,0.3,0.6,0.8,1.0], labels=["Low","Medium","High","Critical"], include_lowest=True)\n',
    '\n',
    'print("Risk Tier Distribution:")\n',
    'tier_dist = df["risk_tier"].value_counts()\n',
    'for t in ["Critical","High","Medium","Low"]:\n',
    '    if t in tier_dist.index:\n',
    '        print(f"  {t:>10}: {tier_dist[t]:>8,} ({100*tier_dist[t]/len(df):.1f}%)")\n',
    '\n',
    'fig, ax = plt.subplots(figsize=(10,5))\n',
    'ax.hist(df["priority_score"], bins=50, color="steelblue", edgecolor="white")\n',
    'for v,c,l in [(0.3,"green","Low/Med"),(0.6,"orange","Med/High"),(0.8,"red","High/Crit")]:\n',
    '    ax.axvline(v, color=c, ls="--", label=l)\n',
    'ax.set_title("Priority Score Distribution"); ax.legend()\n',
    'plt.tight_layout()\n',
    'plt.savefig("score_distribution.png", dpi=150, bbox_inches="tight")\n',
    'plt.show()'
]))

# Cell 15: Export
nb['cells'].append(code([
    '# Cell 15: Export everything\n',
    'os.makedirs("careassist_model_output", exist_ok=True)\n',
    '\n',
    'joblib.dump(best_model, "careassist_model_output/placement_model.pkl")\n',
    'print("placement_model.pkl")\n',
    '\n',
    'meta = {\n',
    '    "model_type": best_name, "roc_auc": round(best_auc,4),\n',
    '    "rf_auc": round(rf_auc,4), "xgb_auc": round(xgb_auc,4),\n',
    '    "feature_names": feature_names, "feature_count": len(feature_names),\n',
    '    "train_samples": int(len(X_train_sm)), "test_samples": int(len(X_test)),\n',
    '    "total_records": int(len(df)), "disruption_rate": round(float(y.mean()),4),\n',
    '    "years": sorted([str(x) for x in df["FY"].dropna().unique()]),\n',
    '    "risk_tiers": {"Low":"0-0.3","Medium":"0.3-0.6","High":"0.6-0.8","Critical":"0.8-1.0"},\n',
    '}\n',
    'with open("careassist_model_output/model_metadata.json","w") as f:\n',
    '    json.dump(meta, f, indent=2)\n',
    'print("model_metadata.json")\n',
    '\n',
    'feat_imp.to_csv("careassist_model_output/feature_importance.csv", index=False)\n',
    'print("feature_importance.csv")\n',
    '\n',
    'export_cols = ["RecNumbr","StFCID","FIPSCode","FY",\n',
    '    "age_at_removal","is_male","race","total_removals","placement_type","case_goal",\n',
    '    "has_disability","has_clinical_disability","has_behavioral","num_removal_reasons",\n',
    '    "los_current_setting","los_latest_removal","disruption","priority_score","risk_tier"]\n',
    'export_cols = [c for c in export_cols if c in df.columns]\n',
    'df[export_cols].to_csv("careassist_model_output/scored_cases.csv", index=False)\n',
    'print(f"scored_cases.csv ({len(df):,} records)")\n',
    '\n',
    'import shutil\n',
    'for f in ["eda_plots.png","model_evaluation.png","feature_importance.png","shap_summary.png","score_distribution.png"]:\n',
    '    if os.path.exists(f): shutil.copy(f, f"careassist_model_output/{f}")\n',
    'print(f\'\\nAll files: {os.listdir("careassist_model_output")}\')'
]))

# Cell 16: Download
nb['cells'].append(code([
    '# Cell 16: Download zip\n',
    'import shutil\n',
    'shutil.make_archive("careassist_model_output", "zip", ".", "careassist_model_output")\n',
    'print("Downloading careassist_model_output.zip...")\n',
    'files.download("careassist_model_output.zip")'
]))

# Cell 17: Summary
nb['cells'].append(code([
    '# Cell 17: COPY THIS OUTPUT AND PASTE IT BACK IN VS CODE CHAT\n',
    'print("="*60)\n',
    'print("COPY EVERYTHING BELOW THIS LINE")\n',
    'print("="*60)\n',
    'print(f"MODEL_TYPE={best_name}")\n',
    'print(f"ROC_AUC={best_auc:.4f}")\n',
    'print(f"RF_AUC={rf_auc:.4f}")\n',
    'print(f"XGB_AUC={xgb_auc:.4f}")\n',
    'print(f"TOTAL_RECORDS={len(df):,}")\n',
    'print(f"DISRUPTION_RATE={y.mean():.4f}")\n',
    'print(f"FEATURES={len(feature_names)}")\n',
    'print(f"TRAIN_SAMPLES={len(X_train_sm):,}")\n',
    'print(f"TEST_SAMPLES={len(X_test):,}")\n',
    'print(f\'YEARS={sorted(df["FY"].dropna().unique().tolist())}\')\n',
    'print(f"\\nTIER_DISTRIBUTION:")\n',
    'for t in ["Critical","High","Medium","Low"]:\n',
    '    if t in tier_dist.index: print(f"  {t}: {tier_dist[t]:,}")\n',
    'print(f"\\nTOP_10_FEATURES:")\n',
    'for _,r in feat_imp.head(10).iterrows():\n',
    '    print(f\'  {r["feature"]}: {r["importance"]:.4f}\')\n',
    'print(f"\\nCLASSIFICATION_REPORT:")\n',
    'print(classification_report(y_test, y_pred, target_names=["Stable","Disrupted"]))\n',
    'cm = confusion_matrix(y_test, y_pred)\n',
    'print(f"CONFUSION_MATRIX: TN={cm[0,0]:,} FP={cm[0,1]:,} FN={cm[1,0]:,} TP={cm[1,1]:,}")\n',
    'print("="*60)'
]))

path = os.path.expanduser(r'~\Downloads\CareAssist_Model_Colab.ipynb')
with open(path, 'w', encoding='utf-8') as f:
    json.dump(nb, f, indent=2, ensure_ascii=False)

size = os.path.getsize(path)
print(f'Written to {path}')
print(f'File size: {size:,} bytes')
print(f'Cells: {len(nb["cells"])}')

# Validate
with open(path) as f:
    test = json.load(f)
print(f'Validation: {len(test["cells"])} cells loaded OK')
