# CareAssist — Capstone Presentation 2
## Slides + Speaker Script
### Total Target: ~13 minutes

---

---

## SLIDE 1: Title Slide

**CareAssist**
*AI-Driven Placement Stability Prediction for Foster Care*

Team [Your Team Name]
UC Berkeley MIDS — Capstone Presentation 2
March 2026

---

## SLIDE 2: The Problem (1 of 2)

### Every Year, Thousands of Foster Children Experience Placement Disruption

- **400,000+** children in U.S. foster care at any given time (AFCARS)
- **~38%** of placements end in disruption — transfers, runaway, institutional escalation
- Each disruption = compounding trauma, broken attachments, worse long-term outcomes
- Social workers manage **15–25 cases each** with limited time and no predictive tooling

> *"We're always reacting. By the time we know a placement is failing, the kid has already been moved."*
> — Domain expert interviews with child welfare practitioners

---

### SCRIPT — SLIDES 1–2 (~2 min)

> Good afternoon. We're Team [Name], and we're building CareAssist — an AI-driven tool that helps foster care social workers predict which placements are at risk of disruption *before* they fail.
>
> Here's the problem. There are over 400,000 children in the U.S. foster care system at any given time. Federal AFCARS data shows that roughly 38% of placements end in disruption — that means the child is moved again: transferred, runs away, or gets escalated to a group home or institution. Every one of those moves compounds trauma and breaks the attachments that kids need to heal.
>
> Social workers carry caseloads of 15 to 25 children, and right now they're triaging based on gut feel and whoever called last. There's no predictive tooling. As one practitioner told us: "We're always reacting. By the time we know a placement is failing, the kid has already been moved."
>
> That's the gap we're filling. CareAssist gives caseworkers early warning — flagging the cases most likely to disrupt so they can intervene proactively, not reactively.

---

---

## SLIDE 3: Target User & Impact

### Who We're Building For

**Primary user:** Foster care social workers / caseworkers
- Need to prioritize limited time across a large caseload
- Currently lack data-driven tools for risk assessment

**Key user questions CareAssist answers:**
1. *"Which of my cases are most likely to disrupt in the next 12 months?"*
2. *"Why is this case flagged — what specific risk factors should I focus on?"*

**Impact:**
- Earlier intervention → fewer placement moves → better outcomes for kids
- Actionable explanations (SHAP) → caseworkers trust and understand the model
- Supports data-informed policy at the agency level

---

---

## SLIDE 4: The MVP

### CareAssist — Minimum Viable Product

**Full-stack web application:**
- **Frontend:** Angular 17 dashboard — case list, risk scores, SHAP explanations, AI chat assistant
- **Backend:** FastAPI (Python) — REST API, SQLite, role-based access (caseworker / supervisor / foster parent)
- **ML Engine:** Weighted ensemble model — pure-Python inference, no heavy ML library dependencies in prod

**Key MVP features:**
1. ✅ Risk-ranked case dashboard (sortable by priority score)
2. ✅ Case detail view with SHAP-style factor explanations
3. ✅ AI chat assistant for case questions (LLM-powered)
4. ✅ Supervisor overview with aggregate risk analytics
5. ✅ Foster parent portal (limited view)
6. ✅ Role-based login (caseworker, supervisor, foster parent)

---

### SCRIPT — SLIDES 3–4 (~3 min)

> So who are we building for? Our primary user is the foster care social worker — the caseworker managing 15 to 25 kids who needs to decide every week: which cases get my attention first?
>
> Through our domain research, we identified two key questions caseworkers need answered. First: "Which of my cases are most likely to disrupt in the next 12 months?" And second: "Why is this case flagged — what specific risk factors should I focus on?" CareAssist answers both.
>
> Our MVP is a full-stack web application. On the frontend, we have an Angular 17 dashboard with a risk-ranked case list, individual case detail pages with SHAP-style explanations, an AI chat assistant, and role-based views for caseworkers, supervisors, and foster parents. The backend is FastAPI with Python, serving a REST API with SQLite storage.
>
> The ML engine — which is the core of what I'll walk you through next — is a weighted ensemble model that runs as pure Python inference, meaning we don't need heavy ML libraries like XGBoost or LightGBM installed in production. We distilled the model into scoring rules that run natively. This makes deployment lightweight and keeps the app fast.

---

---

## SLIDE 5: Data Pipeline

### Data: AFCARS Foster Care National Dataset

| Detail | Value |
|--------|-------|
| **Source** | Adoption & Foster Care Analysis and Reporting System (AFCARS) — U.S. DHHS |
| **Years** | FY 2020 – FY 2024 |
| **Records** | ~5.76 million child-year observations |
| **Target variable** | Placement disruption: NUMPLEP ≥ 3 OR removal reason ∈ {runaway, placement transfer} |
| **Positive rate** | ~38.5% (class imbalance addressed via scale_pos_weight & stratified splits) |
| **Train / Test** | 439,061 / 109,766 (80/20 stratified split) |

**EDA Insights that shaped our approach:**
- Length of stay is strongly bimodal — log transforms improved model separation
- Teen age group (13+) has 2× disruption rate vs. school-age → added age bins
- Disability + behavioral flags are correlated → created composite severity scores
- State-level disruption rates vary 20–55% → added state risk encoding

---

### SCRIPT — SLIDE 5 (~30 sec)

> Our data comes from AFCARS — the federal foster care reporting system. We're working with 5.76 million child-year records from fiscal years 2020 through 2024. Our target variable is placement disruption, which we define as three or more placements in an episode, or a removal reason indicating runaway or transfer. The positive rate is about 38.5%, and we used stratified 80/20 splits for training and evaluation.
>
> Our EDA drove several modeling decisions — for example, length of stay is bimodal, so we applied log transforms. Teens disrupt at twice the rate of school-age kids, which led us to engineer age bin features. We also found that disability and behavioral flags are correlated, so we built composite severity scores rather than treating them independently.

---

---

## SLIDE 6: Model Evolution — The Journey

### From Single Model to Weighted Ensemble

| Version | Model | Features | AUC | Recall | Precision | What Changed |
|---------|-------|----------|-----|--------|-----------|--------------|
| **v1 (Baseline)** | XGBoost (single) | 20 | 0.9041 | 91% | 58% | Baseline with standard AFCARS features |
| **v2 (Mistake)** | XGBoost (single) | ~12 | 0.8135 | — | — | Accidentally dropped features + downsampled 50% → **discarded** |
| **v3 (Recovery)** | XGBoost (tuned) | 20 | 0.9139 | — | — | Restored all features, 15 Optuna trials |
| **v4 (Final)** | **Weighted Ensemble** | **65** | **0.9205** | **92%** | **63%** | 4-model ensemble, 50 Optuna trials, 45 engineered features |

**Net improvement: +1.64 percentage points AUC over baseline**

---

### SCRIPT — SLIDE 6 (~1.5 min)

> Let me walk you through how we got here, because the journey matters.
>
> We started with a single XGBoost model using 20 features directly from AFCARS — things like age at removal, total prior removals, disability flags, removal reasons, length of stay, placement type, and case goal. That baseline gave us an AUC of 0.9041 with 91% recall.
>
> Then we tried to improve it — v2 — and actually made it worse. We accidentally dropped about 10 features during a refactor and downsampled the data to 50%, which tanked the AUC to 0.8135. We caught the mistake, diagnosed it, and discarded that version.
>
> V3 was the recovery: we restored all 20 features and added 15 Optuna hyperparameter trials. That got us to 0.9139 — above baseline.
>
> But the real gains came in v4. We expanded from 20 to 65 features by engineering domain-informed features: age bins, disability severity composites, abuse severity scores, substance abuse indicators, log-transformed length of stay, interaction terms like age × disability, and state-level risk encodings. Then we trained four separate models and combined them into a weighted ensemble. That's where we landed: AUC 0.9205, recall 92%, precision 63%. A net gain of 1.64 percentage points over the original baseline.

---

---

## SLIDE 7: Feature Engineering Deep Dive

### From 20 Raw Features → 65 Engineered Features

**Original 20 (AFCARS fields):**
age_at_removal, total_removals, has_disability, has_clinical_disability, has_behavioral, num_removal_reasons, PHYABUSE, SEXABUSE, NEGLECT, AAPARENT, DAPARENT, NOCOPE, ABANDMNT, HOUSING, los_current_setting, los_latest_removal, ever_adopted, mandatory_removal, placement_type, case_goal

**+45 Engineered features (grouped):**

| Category | Features | Rationale |
|----------|----------|-----------|
| **Age bins** | age_infant, age_toddler, age_school, age_teen, age_squared | Non-linear age effects; teens 2× disruption rate |
| **Severity composites** | disability_severity, abuse_severity, substance_abuse_score, removal_risk_score | Correlated flags → single signal; reduces multicollinearity |
| **LOS transforms** | los_setting_log, los_removal_log, los_short/medium/long, los_ratio | Bimodal distribution → log transform improves discrimination |
| **Interaction terms** | age × los, age × disability, removals × disability, age × risk, age × behavioral, removals × abuse | Captures compounding vulnerabilities |
| **History flags** | multiple_removals, many_removals, totalrem_log, has_multiple_disabilities, has_multiple_abuse, high_removal_risk | Threshold indicators for escalating risk |
| **State-level** | state_disruption_rate, state_risk_low, state_risk_high | Controls for jurisdiction-level policy variation |
| **One-hot** | placement_type_1–8, case_goal_1–7, place_out_1–2 | Captures placement setting and permanency goal effects |

---

### SCRIPT — SLIDE 7 (~1.5 min)

> Feature engineering was where we got the biggest returns. We went from 20 raw AFCARS fields to 65 features, all driven by what we found in EDA and domain knowledge.
>
> A few examples. Age has a non-linear relationship with disruption — infants and teens are both higher risk than school-age kids — so we added age bins and an age-squared term. Disability, clinical, and behavioral flags are correlated, so instead of three binary flags we created a composite *disability severity* score from 0 to 3, and similarly for abuse severity and substance abuse.
>
> Length of stay has a bimodal distribution, so we added log transforms and categorical bins — short, medium, long — plus a ratio feature comparing how long they've been in the current setting versus total removal time.
>
> We also created interaction terms that capture compounding vulnerabilities. For instance, age × disability captures the fact that a teenager with a behavioral diagnosis disrupts at a much higher rate than either factor alone. And we added state-level disruption rate encodings to control for the 20-to-55 percent variation across jurisdictions.
>
> Every feature we added was hypothesis-driven, validated against the data, and contributed to the ensemble's performance.

---

---

## SLIDE 8: The Ensemble Architecture

### v4 Weighted Ensemble — 4 Models, 50 Optuna Trials

```
                    ┌─────────────┐
                    │  65 Features │
                    └──────┬──────┘
           ┌───────────┬───┴───┬───────────┐
           ▼           ▼       ▼           ▼
      ┌─────────┐ ┌────────┐ ┌────────┐ ┌─────┐
      │ XGBoost │ │LightGBM│ │CatBoost│ │ MLP │
      │ 822 rds │ │1911 rds│ │1387 it │ │     │
      │ depth=13│ │leaves= │ │depth=12│ │ NN  │
      │ lr=0.046│ │  377   │ │lr=0.044│ │     │
      └────┬────┘ └───┬────┘ └───┬────┘ └──┬──┘
           │          │          │          │
        w=0.35     w=0.35     w=0.20     w=0.10
           │          │          │          │
           └──────────┴────┬─────┴──────────┘
                           ▼
                   Weighted Average
                    Probability
                           │
                    Threshold = 0.40
                           │
                 ┌─────────┴─────────┐
                 ▼                   ▼
            HIGH RISK            LOW RISK
```

**Why an ensemble?**
- Diversity: 3 GBDT variants + 1 neural net → reduces overfitting
- Robustness: No single model dominates — each captures different patterns
- Optimal weights found via grid search on validation set

---

### SCRIPT — SLIDE 8 (~2 min)

> Here's the architecture of our final model. We train four separate models on the same 65 features, each with hyperparameters tuned by Optuna over 50 trials on an H100 GPU.
>
> The first is XGBoost — 822 boosting rounds, max depth 13, learning rate 0.046. The second is LightGBM — 1,911 rounds, 377 leaves, which is a different tree-building strategy that handles sparse features differently. Third is CatBoost — 1,387 iterations, depth 12 — which has built-in handling for categorical features and ordered boosting that reduces prediction shift. And finally, an MLP neural network that captures non-linear patterns the tree models might miss.
>
> We combine them with a weighted average: XGBoost and LightGBM each get 35% weight, CatBoost gets 20%, and the MLP gets 10%. These weights were optimized on the validation set. The result goes through a threshold of 0.40, which we specifically chose to maximize recall — catching at-risk kids — because in child welfare, a missed case is far worse than a false alarm.
>
> Why an ensemble rather than just the best single model? Each model captures different patterns. XGBoost and LightGBM build trees differently, CatBoost uses ordered boosting, and the MLP picks up non-linearities. Together they reduce overfitting and are more robust across subpopulations. The ensemble AUC of 0.9205 beats every individual model.

---

---

## SLIDE 9: Model Comparison & Results

### All Models Evaluated — Ensemble Wins

| Method | AUC | Avg Precision | F1 |
|--------|-----|---------------|-----|
| **Weighted Ensemble** | **0.9205** | **0.8615** | **0.7836** |
| Stacking (Logistic Regression meta) | 0.9203 | 0.8612 | 0.7722 |
| Simple Average (3 GBDT) | 0.9201 | 0.8609 | 0.7827 |
| LightGBM (tuned) | 0.9200 | 0.8605 | 0.7823 |
| XGBoost (tuned) | 0.9196 | 0.8599 | 0.7815 |
| Rank Average | 0.9191 | 0.8593 | 0.7781 |
| CatBoost (tuned) | 0.9166 | 0.8548 | 0.7773 |
| MLP (neural net) | 0.9081 | 0.8406 | 0.7442 |

**Threshold decision:** Optimized threshold was 0.538 (maximizes F1), but we chose **0.40** to prioritize **recall (92%)** over precision — because missing a child at risk is far worse than a false positive.

*[Include: ROC curve plot from ml_output/roc_curves.png]*
*[Include: Confusion matrix from ml_output/confusion_matrix.png]*

---

### SCRIPT — SLIDE 9 (~1 min)

> Here are the results across all methods we evaluated. The weighted ensemble leads at 0.9205 AUC. Stacking with a logistic regression meta-learner was nearly identical at 0.9203, but the weighted average is simpler to deploy and interpret, so we went with it.
>
> An important point about our threshold. Optuna found the optimal F1 threshold at 0.538, which gives 88% recall and 70% precision. But we made a deliberate decision to use 0.40 instead, which raises recall to 92% at the cost of precision dropping to 63%. In child welfare, this is the right trade-off — a false positive means a caseworker checks on a kid who's probably fine, but a false negative means an at-risk child falls through the cracks. We'd rather over-flag than under-flag.

---

---

## SLIDE 10: Explainability — SHAP

### Every Prediction is Explainable

**Top risk factors (from SHAP analysis):**
1. **Length of stay** (current setting & total removal) — strongest signal
2. **Placement type** — group homes & residential = highest risk
3. **Age at removal** — teens and infants at elevated risk
4. **Prior removals** — each additional removal compounds risk
5. **Disability severity** — behavioral + clinical needs = highest risk
6. **Neglect & abuse indicators** — multiple flags amplify risk
7. **Permanency goal** — emancipation/long-term foster = higher risk than reunification

**In the app:** Each case detail page shows a SHAP-style bar chart explaining *why* the model flagged that case, with plain-language labels like "Long time in current placement" or "Child has behavioral health needs."

*[Include: SHAP bar plot from ml_output/shap_bar.png]*
*[Include: SHAP beeswarm plot from ml_output/shap_beeswarm.png]*

---

### SCRIPT — SLIDE 10 (~1 min)

> Explainability is critical because caseworkers won't trust a black-box score. We use SHAP-style explanations — for every case, the app shows a bar chart of the top contributing factors with plain-language labels.
>
> The top risk factors our model surfaces are length of stay, placement type — group homes are the highest risk — age at removal, number of prior removals, disability severity, and abuse indicators. These align with what the child welfare literature tells us, which validates the model isn't picking up spurious correlations.
>
> In the app, a caseworker clicks into a case and immediately sees something like: "This case is flagged High Risk because: long time in current placement, child has behavioral health needs, multiple prior removals." That's actionable. They know exactly where to focus their intervention.

---

---

## SLIDE 11: App Architecture & Deployment

### Full-Stack Architecture

```
┌────────────────────────────────┐
│     Angular 17 Frontend        │
│  Dashboard · Case Detail ·     │
│  SHAP Charts · AI Chat ·      │
│  Supervisor View · Foster View │
└────────────┬───────────────────┘
             │ REST API
┌────────────▼───────────────────┐
│     FastAPI Backend (Python)   │
│  Auth · Cases · Dashboard ·    │
│  Chat (LLM) · Files (S3)     │
├────────────────────────────────┤
│  ML Engine: Pure-Python Scorer │
│  65-feature extraction →       │
│  Piecewise-linear scoring →    │
│  Weighted ensemble probability │
│  → SHAP explanations           │
├────────────────────────────────┤
│  SQLite (aiosqlite)            │
│  Users · Cases · Children ·    │
│  Risk scores · Audit log       │
└────────────────────────────────┘
```

**Key deployment decision:** We distill the trained ensemble into **piecewise-linear scoring rules** + **binary contribution weights** so the production server runs pure Python — no xgboost, lightgbm, catboost, or torch dependencies. This keeps the Docker image small and inference fast (~1 ms/case).

---

### SCRIPT — SLIDE 11 (~30 sec)

> Briefly on architecture — we have an Angular frontend talking to a FastAPI backend over REST. The ML engine is embedded in the backend as a pure-Python scorer — we distilled the ensemble's behavior into piecewise-linear scoring rules derived from partial-dependence analysis. This means production has zero ML library dependencies. Inference is about a millisecond per case. The database is SQLite for the MVP, easily swappable to Postgres in production.

---

---

## SLIDE 12: Challenges & Trade-offs

### Key Decisions Driven by Data

| Decision | Options Explored | Rationale |
|----------|-----------------|-----------|
| **Threshold = 0.40** vs. 0.538 | F1-optimal (0.538) vs. recall-priority (0.40) | Missing at-risk kids is unacceptable in child welfare; chose higher recall |
| **Weighted avg** vs. stacking | Stacking (LR meta), rank avg, simple avg | Weighted avg: +0.02 pp AUC, simpler to deploy, more interpretable |
| **Pure-Python scorer** vs. model file loading | Pickle/ONNX vs. rule distillation | No ML library deps in prod; smaller image; fast cold start |
| **65 features** vs. 20 baseline | 20 raw → 65 engineered | Domain-driven engineering; +1.64 pp AUC improvement |
| **4 models** vs. single best | Single XGB, single LGB, ensemble | Ensemble reduces variance; more robust across subgroups |
| **50 Optuna trials** on H100 GPU | 15 vs. 25 vs. 50 trials | Significant AUC gains from 15→50; diminishing returns after ~40 |

---

### SCRIPT — SLIDE 12 (~1 min)

> I want to highlight a few key decisions, because decision-making is central to this work.
>
> First, threshold. The model's optimal F1 threshold is 0.538, but we deliberately chose 0.40 because recall matters more than precision in child welfare. This was a conscious trade-off driven by the problem context.
>
> Second, we tried multiple ensemble strategies — stacking with a logistic regression meta-learner, rank averaging, simple averaging. The weighted average won by a small margin and is simpler to deploy, so we went with it.
>
> Third, deployment. Rather than shipping XGBoost and LightGBM as production dependencies, we distilled the model into piecewise-linear scoring rules. This is a trade-off: we lose some fidelity versus running the actual trained models, but we gain a much lighter production footprint and zero ML dependencies.
>
> Every one of these decisions was driven by either the data, the domain context, or engineering trade-offs — not guesswork.

---

---

## SLIDE 13: Remaining Work & Project Plan

### What's Left — Semester Roadmap

| Task | Owner | Second Chair | Target |
|------|-------|-------------|--------|
| User testing with 2–3 caseworkers | [Name] | [Name] | Week 10 |
| Integrate real agency case data (anonymized) | [Name] | [Name] | Week 11 |
| AI chat assistant refinement (prompt tuning) | [Name] | [Name] | Week 11 |
| Supervisor analytics dashboard polish | [Name] | [Name] | Week 12 |
| Load testing & performance benchmarking | [Name] | [Name] | Week 12 |
| Cloud deployment (AWS / GCP) | [Name] | [Name] | Week 13 |
| Final presentation & demo prep | All | — | Week 14 |

**Potential obstacles:**
- Access to real case data — may require IRB or data use agreement → fallback: enhanced synthetic data
- User feedback may require UI pivots — built modular components to adapt
- LLM chat cost at scale — evaluating local models vs. API trade-offs

---

### SCRIPT — SLIDE 13 (~30 sec)

> For the remainder of the semester, our priorities are: user testing with actual caseworkers, integrating anonymized real case data, refining the AI chat assistant, and deploying to the cloud. The main risk is data access — if we can't get real agency data, we'll enhance our synthetic dataset. Each task has an owner and backup, and we're tracking weekly in our project board.

---

---

## SLIDE 14: Mission Slide (Closing)

### CareAssist

**Every child in foster care deserves stability.**

CareAssist uses machine learning to identify at-risk placements before they fail — giving caseworkers the early warning and actionable insight they need to intervene, keep kids safe, and reduce the cycle of placement disruption.

**92% recall · 65 features · 4-model ensemble · Explainable AI**

*Built on 5.76 million AFCARS records. Designed for the people who protect our most vulnerable children.*

---

### SCRIPT — SLIDE 14 (~30 sec)

> Every child in foster care deserves stability. CareAssist uses machine learning to identify at-risk placements before they fail, giving caseworkers the early warning they need to intervene. Our v4 ensemble catches 92% of at-risk cases across 65 engineered features, with full explainability so workers know exactly why a case is flagged and where to focus.
>
> We built this on 5.76 million federal records, and we designed it for the people who protect our most vulnerable children. Thank you.

---

---

# FULL SPEAKER SCRIPT (consolidated, ~13 min)

---

## [SLIDE 1 — Title] (15 sec)

"Good afternoon. We're Team [Name], and we're building CareAssist — an AI-driven tool that helps foster care social workers predict which placements are at risk of disruption before they fail."

## [SLIDE 2 — The Problem] (1 min 45 sec)

"Here's the problem. There are over 400,000 children in the U.S. foster care system at any given time. Federal AFCARS data shows that roughly 38% of placements end in disruption — that means the child is moved again: transferred, runs away, or gets escalated to a group home or institution. Every one of those moves compounds trauma and breaks the attachments kids need to heal.

Social workers carry caseloads of 15 to 25 children, and right now they're triaging based on gut feel and whoever called last. There's no predictive tooling. As one practitioner said: 'We're always reacting. By the time we know a placement is failing, the kid has already been moved.'

That's the gap we're filling. CareAssist gives caseworkers early warning — flagging the cases most likely to disrupt so they can intervene proactively, not reactively."

## [SLIDE 3 — Target User & Impact] (1 min)

"Our primary user is the foster care social worker. Through domain research, we identified two key questions they need answered. First: 'Which of my cases are most likely to disrupt in the next 12 months?' And second: 'Why is this case flagged — what risk factors should I focus on?' CareAssist answers both. The impact is straightforward: earlier intervention means fewer placement moves, which means better outcomes for kids."

## [SLIDE 4 — The MVP] (1 min 15 sec)

"Our MVP is a full-stack web application. The frontend is Angular 17 with a risk-ranked case dashboard, individual case detail pages with SHAP-style explanations, an AI chat assistant, and role-based views for caseworkers, supervisors, and foster parents.

The backend is FastAPI with Python, serving a REST API with SQLite. The ML engine — which is the core of what I'll walk through next — is a weighted ensemble model running as pure Python inference. We distilled the model into scoring rules, so we don't need XGBoost or LightGBM installed in production."

## [SLIDE 5 — Data Pipeline] (45 sec)

"Our data comes from AFCARS — the federal foster care reporting system. We're working with 5.76 million child-year records from fiscal years 2020 through 2024. Our target is placement disruption: three or more placements in an episode, or a removal reason of runaway or transfer. The positive rate is about 38.5%.

Our EDA drove key modeling decisions. Length of stay is bimodal — log transforms helped. Teens disrupt at twice the rate of school-age kids, so we engineered age bins. Disability and behavioral flags are correlated, so we built composite severity scores. And state-level disruption rates vary from 20 to 55 percent, so we added jurisdiction-level features."

## [SLIDE 6 — Model Evolution] (1 min 30 sec)

"Let me walk through how we got here, because the journey matters.

We started with a single XGBoost model using 20 features from AFCARS — age at removal, prior removals, disability flags, removal reasons, length of stay, placement type, and case goal. That baseline gave us AUC 0.9041 with 91% recall.

Then we tried to improve it — version 2 — and actually made it worse. We accidentally dropped features and downsampled the data, tanking AUC to 0.8135. We caught the mistake, diagnosed it, and discarded that version.

V3 was the recovery — restored all features, added Optuna tuning, got to 0.9139. But the real gains came in v4. We expanded to 65 features, trained four separate models with 50 Optuna trials on an H100 GPU, and combined them into a weighted ensemble. Final result: AUC 0.9205, recall 92%, precision 63%. A net gain of 1.64 percentage points."

## [SLIDE 7 — Feature Engineering] (1 min 30 sec)

"Feature engineering was where we got the biggest returns. We went from 20 raw fields to 65 features, all driven by EDA and domain knowledge.

Age has a non-linear relationship with disruption — infants and teens are both higher risk — so we added age bins and age-squared. Disability, clinical, and behavioral flags are correlated, so we created composite severity scores from 0 to 3. Length of stay got log transforms and categorical bins.

We created interaction terms — age times disability, removals times abuse — that capture compounding vulnerabilities. For example, a teenager with behavioral diagnosis disrupts at a much higher rate than either factor alone. We also added state-level encodings to control for jurisdiction variation.

Every feature was hypothesis-driven and validated against the data."

## [SLIDE 8 — Ensemble Architecture] (2 min)

"Here's the final architecture. We train four models on the same 65 features, each tuned with Optuna.

XGBoost: 822 rounds, depth 13, learning rate 0.046. LightGBM: 1,911 rounds, 377 leaves — a different tree-building strategy. CatBoost: 1,387 iterations, depth 12 — built-in categorical handling and ordered boosting. And an MLP neural network for non-linear patterns.

We combine them with weighted averaging: XGBoost and LightGBM at 35% each, CatBoost at 20%, MLP at 10%. Threshold is 0.40 — deliberately chosen to maximize recall because in child welfare, a missed case is far worse than a false alarm.

Why an ensemble? Each model captures different patterns — XGBoost and LightGBM build trees differently, CatBoost uses ordered boosting, the MLP handles non-linearities. Together they reduce overfitting and are more robust. The ensemble beats every individual model."

## [SLIDE 9 — Results] (1 min)

"The weighted ensemble leads at 0.9205 AUC. We evaluated eight methods total — stacking, rank averaging, simple averaging, and each individual model. The weighted average was simpler to deploy than stacking and slightly better, so we went with it.

On threshold: the F1-optimal point is 0.538, giving 88% recall and 70% precision. But we deliberately chose 0.40 for 92% recall and 63% precision. A false positive means a caseworker checks on a kid who's probably fine. A false negative means an at-risk child falls through the cracks. We'd rather over-flag."

## [SLIDE 10 — Explainability] (1 min)

"Explainability is critical because caseworkers won't trust a black box. We use SHAP-style explanations — for every case, the app shows a bar chart of top contributing factors with plain-language labels.

The top risk factors are length of stay, placement type — group homes highest risk — age at removal, prior removals, disability severity, and abuse indicators. These align with the child welfare literature, validating the model.

A caseworker clicks into a case and sees: 'Flagged High Risk because: long time in current placement, child has behavioral health needs, multiple prior removals.' That's actionable."

## [SLIDE 11 — Architecture] (30 sec)

"Briefly on deployment — Angular frontend, FastAPI backend, pure-Python scorer. We distilled the ensemble into piecewise-linear scoring rules, so production has zero ML dependencies. Inference is about a millisecond per case. SQLite for the MVP, swappable to Postgres."

## [SLIDE 12 — Challenges & Decisions] (45 sec)

"A few key decisions. Threshold: F1-optimal is 0.538, but we chose 0.40 for recall because the domain demands it. Weighted average over stacking: simpler, same performance. Pure-Python scorer over model loading: no ML deps in prod. Sixty-five features over twenty: domain-driven engineering, plus 1.64 points of AUC. Every decision was driven by data, domain context, or engineering trade-offs."

## [SLIDE 13 — Remaining Work] (30 sec)

"For the rest of the semester: user testing with caseworkers, integrating anonymized real data, refining the AI chat, cloud deployment, and final polish. Our biggest risk is data access — if we can't get real agency data, we'll enhance our synthetic dataset. Each task has an owner and backup."

## [SLIDE 14 — Mission / Close] (20 sec)

"Every child in foster care deserves stability. CareAssist identifies at-risk placements before they fail, giving caseworkers the early warning they need to intervene. Ninety-two percent recall across 65 features, full explainability, designed for the people who protect our most vulnerable children. Thank you."

---

*Total estimated time: ~13 minutes. Leaves 1–2 min for Q&A within the 15-minute window.*
