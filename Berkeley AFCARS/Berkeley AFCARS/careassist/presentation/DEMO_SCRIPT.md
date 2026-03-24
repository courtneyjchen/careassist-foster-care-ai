# CareAssist v4 — Full Demo Script

> **Presenters:** Samantha Townsend (and team)
> **Duration:** ~20–25 minutes
> **Audience:** Berkeley faculty, classmates, stakeholders

---

## PART 1 — INTRODUCTION & MOTIVATION (3 min)

### Opening

> "Good [morning/afternoon]. We're here to present **CareAssist** — an AI-driven case prioritization and management platform built for the foster care system.
>
> Every year, over 400,000 children in the United States are in foster care at any given time. Social workers managing these cases are overwhelmed — carrying caseloads of 20, 30, sometimes 40+ children, each with complex trauma histories, medical needs, court deadlines, and permanency goals. The question they face every Monday morning is: *Which child needs my attention most urgently this week?*
>
> Right now, that decision is largely based on gut instinct, sticky notes, and fragmented spreadsheets. CareAssist changes that. We built a full-stack web application that uses machine learning trained on **5.76 million real federal foster care records** to score placement disruption risk for every child — and then explains *why* a child is flagged, so the social worker can take informed action.
>
> This isn't about replacing social workers. It's about giving them a data-driven co-pilot."

---

## PART 2 — TECHNOLOGY STACK & ARCHITECTURE (3 min)

### Why Angular?

> "Let's talk about why we made the technology choices we did.
>
> For the frontend, we chose **Angular 17** with standalone components. Angular was the right choice for several reasons:
>
> 1. **Enterprise-grade structure** — Foster care systems are government enterprise software. Angular's opinionated architecture with TypeScript, dependency injection, and strong typing makes it well-suited for applications that need to be auditable, maintainable, and extensible by future development teams.
>
> 2. **Role-based access control** — We have four distinct user roles, each with completely different views. Angular's route guards, services, and component architecture let us cleanly separate concerns. A single `AuthService` and role-based guards control what every user sees.
>
> 3. **Standalone components** — We're using Angular 17's standalone component architecture, which eliminates NgModules entirely. Every component is self-contained with its own imports, template, and styles. This makes the codebase modular and tree-shakable.
>
> 4. **Lazy loading** — Every route uses `loadComponent()` for code splitting. The login page doesn't load the dashboard code. The social worker dashboard doesn't load the foster parent dashboard. This keeps initial load times fast."

### Backend: FastAPI + SQLite

> "On the backend, we chose **FastAPI** — a modern Python web framework that gives us:
>
> - **Async support** — all database queries are non-blocking using `aiosqlite` and SQLAlchemy's async ORM
> - **Automatic API documentation** — FastAPI generates Swagger/OpenAPI docs at `/docs`
> - **Type safety with Pydantic** — every request and response has a validated schema
>
> Our database is **SQLite** for the demo, but the SQLAlchemy ORM layer means we could swap in PostgreSQL for production with a single config change. The database schema has 11 tables: users, children, cases, case flags, notes, shared notes, placements, risk score history, family members, sibling links, and notifications."

### ML Pipeline

> "The machine learning pipeline was developed separately in **Jupyter notebooks** and **Google Colab**, then its inference logic was distilled into a pure-Python scorer that runs inside the FastAPI backend — no heavy ML library dependencies needed at runtime.
>
> The training pipeline uses scikit-learn, XGBoost, LightGBM, and CatBoost, with hyperparameter tuning via Optuna. The trained model's decision rules were exported as piecewise-linear scoring rules derived from partial dependence analysis, so we can replicate inference in pure Python."

---

## PART 3 — THE MACHINE LEARNING MODEL (4 min)

### Training Data: AFCARS

> "Our model is trained on the **Adoption and Foster Care Analysis and Reporting System** — AFCARS — which is the federal dataset mandated by the Children's Bureau. Every state reports foster care case data twice per year.
>
> We used **AFCARS fiscal years 2020 through 2024** — that's approximately **5.76 million records**. This is real, de-identified federal data covering every child in foster care in the United States over a 5-year window."

### Target Variable

> "Our prediction target is **placement disruption** — specifically, whether the number of placement episodes (`NUMPLEP` in AFCARS) increases within 12 months. A placement disruption means a child's current living arrangement broke down and they had to be moved — which is one of the most traumatic events a foster child can experience. Research consistently shows that placement instability is correlated with worse educational outcomes, behavioral health issues, and lower likelihood of achieving permanency.
>
> In our dataset, the base disruption rate is approximately **36%** — meaning roughly one in three children experience a placement disruption within a year."

### Ensemble Architecture

> "We don't rely on a single model. We built a **weighted ensemble** of four algorithms:
>
> | Model | Weight | Details |
> |-------|--------|---------|
> | **XGBoost** | 35% | 822 boosting rounds, max depth 13, learning rate 0.046 |
> | **LightGBM** | 35% | 1,911 rounds, max depth 13, 377 leaves |
> | **CatBoost** | 20% | 1,387 iterations, depth 12 |
> | **MLP (Neural Network)** | 10% | scikit-learn multi-layer perceptron |
>
> The ensemble weights were optimized through a **50-trial Optuna search** with **5-fold stacking cross-validation**. The weighted average outperformed every individual model and other ensembling strategies like simple averaging and stacking with logistic regression.
>
> **Why an ensemble?** Each algorithm has different inductive biases. XGBoost and LightGBM are both gradient-boosted tree methods but handle splits and regularization differently. CatBoost is especially strong with categorical features. The MLP captures non-linear interactions that tree methods might miss. By combining them, we reduce variance and get more robust predictions."

### Model Performance

> "Our final model achieves:
>
> - **ROC-AUC: 0.9205** — this means the model correctly ranks a true disruption case above a non-disruption case 92% of the time
> - **Average Precision: 0.8615** — strong precision-recall performance even with class imbalance
> - **F1 Score: 0.784** — a balanced measure of precision (63%) and recall (92%)
> - **Recall: 92%** — we catch 92% of children who will experience a disruption
>
> We optimized for **high recall** deliberately. In foster care, a false negative — missing a child who's about to experience a disruption — is far more costly than a false positive. We'd rather flag too many children for review than miss one who needs help.
>
> The decision threshold is set at **0.538**, optimized from the precision-recall curve. This is a 1.64 percentage-point improvement over our previous model iteration."

### Feature Engineering

> "The model uses **65 features** — 20 baseline features directly from AFCARS, plus 45 engineered features:
>
> - **Numeric features:** length of stay in current removal, length of stay in current setting, age at removal, total prior placements, number of removal reasons
> - **Engineered features:** age-squared (captures non-linear age effects — infants and teens are both higher risk), disability severity score (composite of medical + behavioral + disability flags), abuse severity score, substance abuse composite, removal risk score, LOS ratio (current setting vs. total removal), interaction terms (age × disability, removals × abuse)
> - **Binary features:** one-hot encoded placement types (group home, residential, foster home, kinship, pre-adoptive), permanency goals (adoption, reunification, emancipation, guardianship), removal reasons (neglect, physical abuse, sexual abuse, abandonment, parental substance abuse, housing, etc.), and derived flags (multiple removals, mandatory removal, ever adopted, TPR status, age bins)
>
> **Top 5 Most Important Features** (by gain-based importance):
> 1. Length of stay in latest removal (13.0%)
> 2. Length of stay in current setting (12.5%)
> 3. Placement type (11.0%) — group home and residential are highest risk
> 4. Total prior placements (5.2%)
> 5. Age at removal (4.8%)"

---

## PART 4 — SHAP EXPLAINABILITY (2 min)

> "A risk score alone isn't enough. A social worker needs to know *why* a child is flagged. That's where **SHAP** comes in.
>
> SHAP — **SHapley Additive exPlanations** — is grounded in cooperative game theory. It answers the question: *How much did each feature contribute to pushing this child's score above or below the population baseline?*
>
> For every case, we decompose the predicted risk score into individual feature contributions. Each feature gets a SHAP value that can be positive (increases risk) or negative (protective factor). The values sum up from the baseline population risk of 36% to the child's predicted score.
>
> In the app, when a social worker clicks **'Explain This Score in Detail,'** they see a horizontal bar chart showing the top contributing features — red bars pushing the score up (risk factors) and green bars pulling it down (protective factors). For each feature, they see the actual value for that child, the feature's human-readable label, and the magnitude of its contribution.
>
> **[DEMO: Click 'Explain This Score in Detail' on a high-risk case like Aisha Williams]**
>
> For example, here you can see that Aisha's score is driven up by her 30 months in care, group home placement, 5 prior placements, and behavioral needs — while her adoption permanency goal is slightly protective.
>
> This is critical for **trust and accountability**. Social workers won't — and shouldn't — blindly follow an algorithm. They need to see the reasoning, verify it matches what they know about the child, and bring that informed perspective into their clinical judgment."

---

## PART 5 — LIVE DEMO: ROLE WALKTHROUGHS (10 min)

### 5A. Login Page

> "Let's start at the login page.
>
> **[Show login screen]**
>
> We designed the login with **four role cards** — Social Worker, Supervisor, Foster Parent, and Aged-Out Youth — each with a distinct color and description. This is a demo environment, so clicking a role card logs you in directly. In production, this would be a standard email/password or SSO authentication flow.
>
> The login page has a playful, child-friendly design — notice the animated sun that follows your cursor and the crayon-drawing background. This was an intentional design choice: the software is *about children*, and we wanted the entry point to reflect warmth and care, not cold institutional software."

---

### 5B. Social Worker Dashboard — Jessica Hawkins

> "Let's log in as **Jessica Hawkins**, a social worker.
>
> **[Click Social Worker card]**
>
> Jessica lands on her **dashboard** — this is her command center. Let's walk through what she sees:
>
> **Stats Bar** — Four cards at the top: Active Cases (her total caseload), Flagged Cases (cases with ML-generated alerts), Pending Reviews (cases in 'open' status needing attention), and Average Permanency in months.
>
> **Flagged Cases** — Below the stats, the Flagged tab shows case cards sorted by risk score. Each card shows the child's name, case number, risk score as a percentage, status badge, and the top flag — like 'Placement Instability Risk' or 'Permanency Delay' — with severity and confidence.
>
> **Case Table** — A sortable table of all cases with columns for case number, child name, risk score, status, placement type, and months in care.
>
> **Side Panel** — When Jessica clicks a case in the table, a **detail panel slides in from the right**. This shows:
> - The child's name and case number
> - An **urgency score bar** — a horizontal progress bar color-coded red/orange/green
> - Active flags with severity and confidence
> - Key case details (status, placement, months, goal, assigned worker)
> - An **'Explain This Score in Detail'** button
> - An **'Ask AI About This Case'** button
>
> **[Click on Maya Johnson's case → show side panel]**
>
> The 'Explain This Score in Detail' button navigates to the **full case detail page** and automatically opens the SHAP explanation panel."

---

### 5C. Case Detail Page — Deep Dive

> "**[Click 'Explain This Score in Detail' or navigate to a case]**
>
> This is the **case detail page** — the most feature-rich page in the application. It has four tabs: Overview, Timeline, Family, and Notes.
>
> #### Overview Tab
>
> At the top: child name, case number, status badge, and a **risk gauge ring** — a circular SVG visualization showing the risk score as a filled arc with color coding (green < 30%, yellow 30-60%, orange 60-80%, red > 80%).
>
> **Risk Score Trend Chart** — A custom SVG sparkline showing 6 months of historical risk scores. The chart has a danger zone (shaded red area above 60%), color-coded data points, and date labels. This lets the worker see whether a child's risk is *trending up* or stabilizing.
>
> **Case Information** — A grid showing: Assigned Worker, Placement Type, Months in Care, Permanency Goal, Removal Reason, TPR Status, Date of Birth.
>
> **SHAP Explainability Panel** — Clicking 'Explain This Score in Detail' expands this panel, which shows:
> - The baseline population risk (36%)
> - The child's predicted score and risk tier
> - A **horizontal bar chart** of the top 10 features: each row has the feature label, a bidirectional bar (red for risk, green for protective), the contribution as a percentage, and the child's actual value for that feature
>
> **Active Flags** — AI-generated alert cards, each with: flag type (e.g., 'Placement Instability Risk', 'Behavioral Escalation', 'Permanency Delay'), severity badge (critical/high/medium/low), confidence percentage, description of the concern, and a clinical recommendation.
>
> **Sibling Linkage Map** — A visual node-and-connection diagram showing the child's siblings across the system. For example, Maya Johnson is connected to Aisha Williams as a half-sibling, and each node shows the sibling's case number and current placement type. *Note: This is currently populated with seed data. In a production deployment, this would pull from the AFCARS sibling fields and cross-reference cases system-wide. The vision is to help workers identify when siblings are separated across placements and advocate for sibling co-placement when appropriate.*
>
> #### Timeline Tab
>
> **[Click Timeline tab]**
>
> A **vertical placement timeline** showing every event in the child's case history — placement entries, transfers, flag triggers, court hearings, visits, and medical events. Each event is color-coded by type and shows the date, provider name (e.g., 'Garcia Family', 'Sunrise Youth Center'), and details. This gives workers an at-a-glance history of everything that's happened.
>
> For Aisha Williams, you can see 5 placements over 30 months — Foster Home → Foster Home → Group Home → Residential → Group Home — which visually tells the story of instability.
>
> #### Family Tab
>
> **[Click Family tab]**
>
> A **visual family tree** showing:
> - **Parents** (mother, father, step-parents) at the top
> - The **child** in the center
> - **Extended family** (grandparents, aunts, uncles) below
>
> Each family member node shows their name, relationship, phone number (visible only to social workers and supervisors), and a **safe/restricted contact badge** — green for safe, red for restricted. For example, Maya's mother Keisha is marked 'Restricted — Supervised visitation only' while her father Darnell is marked 'Safe — Completing parenting classes.'
>
> Workers can **add new family members** directly from this tab via a form.
>
> #### Notes Tab
>
> **[Click Notes tab]**
>
> Two sections:
>
> 1. **Shared Notes** — A chronological conversation thread between the social worker and foster parent. Think of it like a HIPAA-compliant messaging thread tied to a specific case. Maria Garcia (foster parent) can write: *'Ethan had a great week — sleeping through the night!'* and Jessica Hawkins (social worker) can respond: *'Can you confirm he's been taking his allergy medication?'* Notes can be pinned for importance.
>
> 2. **Case Notes** — Official case documentation entries (visit notes, court notes, general notes) with type badges and timestamps."

---

### 5D. AI Assistant

> "**[Navigate to AI Assistant from the sidebar]**
>
> The AI Assistant is our conversational interface. It's powered by a **context-aware natural language engine** that has access to the full caseload data.
>
> When Ollama (our local LLM runtime) is available, it uses **Llama 3.2** for natural language generation. When it's not available — as in our demo — the system falls back to a **smart rule-based engine** that parses the actual case data from the database and generates structured, data-driven responses.
>
> **[Click a quick-action suggestion: 'Which of my cases have the highest risk scores?']**
>
> The assistant returns the top 3 highest-risk cases with their names, case numbers, scores, and number of active flags. It's not hallucinating — it's querying the real database.
>
> Other things you can ask:
> - *'Summarize my caseload'* — returns counts by risk tier
> - *'What are my action items this week?'* — returns prioritized tasks based on flags and deadlines
> - *'Tell me about Aisha Williams'* — returns full case details, flags, and recommendations
>
> The context panel on the right shows quick action buttons and a list of the AI's capabilities."

---

### 5E. Supervisor Dashboard — James Chen

> "**[Log out → Log in as James Chen, Supervisor]**
>
> Supervisors see a completely different dashboard: the **Team Overview**.
>
> **Stats** — Total social workers under supervision, total cases across the team, total flagged cases, and average cases per worker.
>
> **Team Caseload by Worker** — Expandable cards for each social worker (Jessica Hawkins, Priya Patel, Marcus Williams). Each card shows:
> - The worker's name, email, and avatar
> - Metrics: total cases, flagged cases, high-risk cases, average risk score
> - A **workload bar** color-coded based on caseload size (green = manageable, orange = heavy, red = overloaded)
> - Expand the card to see a **full case table** with every child assigned to that worker — showing risk scores with visual bar indicators, status, placement type, months in care, and flag counts
>
> **[Expand Jessica Hawkins' card → show her 7 cases]**
>
> The supervisor can click any case to navigate to the full case detail page — they have the same deep-dive access as the social worker, including SHAP explanations.
>
> **Weekly Check-Ins** — A schedule of supervision sessions with each worker including discussion topics.
>
> The supervisor also has access to the **AI Assistant**, the full **Cases list**, **Reports** (with a team-level view grouping children by social worker), and the **Calendar** (populated with check-in sessions and worker case events)."

---

### 5F. Foster Parent Dashboard — Maria Garcia

> "**[Log out → Log in as Maria Garcia, Foster Parent]**
>
> Foster parents see the **Family Portal** — a completely different experience. *No risk scores, no ML flags, no SHAP explanations.* This is intentional. Foster parents are caregivers, not case managers. They need information about the children in their home, not clinical risk metrics.
>
> **My Children** — Cards for each child placed with Maria (Ethan Rodriguez, Liam Thompson, Emma Martinez). Each card shows:
> - The child's name, age, and gender
> - Placement type and permanency goal
> - Months in care
> - **Need tags** — colored badges if the child has medical, behavioral, or disability needs
> - Action buttons: **Upload Document** and **Message Social Worker**
>
> **[Click a child card to see expanded details]**
>
> The expanded panel shows personal details (DOB, gender, ethnicity, case number), placement info, and quick actions like uploading medical or school reports.
>
> From the sidebar, Maria can access:
> - **Messages** — direct messaging with Jessica Hawkins (her social worker), the pediatrician, school counselor, Foster Parent Network, Family Resource Center, and the therapist
> - **Notifications** — reminders about upcoming visits, new documents, messages from the worker
> - **Calendar** — pediatrician appointments, social worker meetings, parent-teacher conferences, therapy sessions, support group meetings
> - **Documents** — uploaded case files
> - **Reports** — per-child report cards with sections for Placement Summary, Health & Wellness, Education, and Upcoming Milestones
> - **Resources** — a curated directory of foster parent resources organized by category: Training, Support, Financial, Health, and Legal — including Pre-Service Training info, Trauma-Informed Parenting workshops, Respite Care, Monthly Stipend details, Medicaid information, and Foster Parent Rights"

---

### 5G. Aged-Out Youth Dashboard — Jordan Davis

> "**[Log out → Log in as Jordan Davis, Aged-Out Youth]**
>
> Jordan Davis is a young adult who has aged out of the foster care system. His portal is designed for **self-advocacy and independence**.
>
> **My Portal** — A clean, simple dashboard with:
> - Quick stats: My Documents, Medical Records, Messages, Resources
> - **Quick Access Cards**: Medical History, School Records, Contact Support Network, Resources & Support — each linking to the appropriate page
> - **My Information** — his personal details, last placement, time in care, former social worker and foster parent
>
> **My Records** — A unified view of Jordan's history, organized into three tabs:
> - **Medical History** — every physical exam, vaccination, dental visit, therapy session, with dates and providers
> - **School Records** — report cards, transcripts, IEP notes, school transfers
> - **Placement History** — every placement from initial removal through aging out, displayed as a visual timeline
>
> This is critical for aged-out youth. When you leave foster care at 18, you often lose access to your own records. CareAssist gives them a portable, consolidated record of their entire history.
>
> **Resources** — A curated directory specifically for transition-age youth: Transitional Housing, Independent Living Stipend, Job Training programs, Chafee Education Grants, Tuition Waivers, Extended Medicaid, Mental Health Support, Therapy Services, Foster Care Alumni Mentors, Life Skills Workshops, and Legal Aid.
>
> Jordan also has access to **Messages** (to stay in touch with his former case worker, life skills mentor, and housing services) and the **Calendar** (therapy sessions, budgeting workshops, housing applications, job fairs, mentorship meetings)."

---

## PART 6 — CROSS-CUTTING FEATURES (2 min)

### Notifications

> "Every role has a **notifications system** with real-time alerts. Notifications are typed — Alerts (red), Reminders (yellow), Flags (orange), Info (blue), System (teal) — and can be filtered by type. Clicking a notification marks it as read and navigates to the related case if applicable. Social workers get alerts like 'High Risk Alert: Risk score increased to 78%.' Supervisors get team-level alerts like 'Jessica Hawkins has 7 active cases with 3 flagged — consider reassignment.'"

### Messages

> "The **Messages** page provides a two-pane messaging interface with role-specific contact lists. Social workers message judges, doctors, and foster parents. Foster parents message their worker, the pediatrician, and support groups. This keeps all case-related communication in one auditable place."

### Calendar

> "The **Calendar** provides a full month-view grid with color-coded event types (hearings, visits, reviews, medical, personal). Events are role-specific and auto-generated from case data. Users can add custom events. Court hearings show as purple, home visits as teal, case reviews as orange, medical appointments as red."

### Reports

> "**Reports** adapt to each role. Social workers see per-child reports and a monthly caseload summary with metrics like new placements, closures, hearings, and home visits. Supervisors see the same data rolled up by social worker with a team-level overview. Foster parents see child-focused report cards covering health, education, and milestones."

---

## PART 7 — FUTURE WORK & VISION (2 min)

> "CareAssist is a functional prototype, but there are several areas we'd like to develop further:
>
> 1. **Sibling Linkage with Live AFCARS Data** — The sibling map currently uses seed data. In production, we would cross-reference the AFCARS sibling fields to dynamically identify all siblings across the system — even those assigned to different workers in different counties. This is a real gap in the current system: siblings are often separated without workers even knowing about each other.
>
> 2. **Real LLM Integration** — The AI assistant currently uses a smart rule-based fallback. With Ollama and Llama 3.2 (or a comparable model), the assistant would provide truly conversational responses — answering policy questions, suggesting evidence-based interventions, and helping workers draft court reports.
>
> 3. **S3 Document Storage** — The file upload infrastructure is built (the S3 service exists in the backend) but not yet connected to a live AWS bucket. In production, workers and foster parents would upload and retrieve medical records, court documents, IEPs, and school reports.
>
> 4. **Production Database** — Migrating from SQLite to PostgreSQL for concurrent multi-user access, proper indexing, and production-grade reliability.
>
> 5. **Real-Time Scoring** — Currently, risk scores are calculated at seed time. In production, scores would be recalculated whenever case data changes — a new placement, a new flag, a change in months-in-care — and the trend chart would update in real time.
>
> 6. **County-Level Deployment** — The scoring rules include state-level disruption rates. With county-level AFCARS data, we could incorporate geographic risk factors and regional resource availability.
>
> 7. **HIPAA Compliance & Authentication** — Production deployment would require SSO/SAML authentication, role-based access control at the API level (not just the frontend), audit logging, encryption at rest, and HIPAA BAA compliance."

---

## PART 8 — CLOSING (1 min)

> "To summarize: CareAssist is a full-stack, role-aware foster care case management platform powered by a weighted ensemble ML model trained on 5.76 million real AFCARS records. It scores placement disruption risk with 92% ROC-AUC, explains every score through SHAP-based feature decomposition, and delivers role-appropriate experiences for social workers, supervisors, foster parents, and aged-out youth.
>
> The technology stack — Angular 17, FastAPI, SQLAlchemy, and a four-model ensemble — was chosen to mirror production-grade enterprise software while remaining maintainable and extensible.
>
> Our goal is simple: **help the right child get the right attention at the right time.** Thank you."

---

## APPENDIX — QUICK REFERENCE

### Demo Login Credentials
| Role | Name | Email |
|------|------|-------|
| Social Worker | Jessica Hawkins | jessica.hawkins@careassist.org |
| Supervisor | James Chen | james.chen@careassist.org |
| Foster Parent | Maria Garcia | maria.garcia@careassist.org |
| Aged-Out Youth | Jordan Davis | jordan.davis@careassist.org |
| Social Worker | Priya Patel | priya.patel@careassist.org |
| Social Worker | Marcus Williams | marcus.williams@careassist.org |

*Password for all accounts:* `demo1234`

### Key Numbers to Remember
| Metric | Value |
|--------|-------|
| Training records | 5.76 million (AFCARS FY 2020-2024) |
| Model type | Weighted Ensemble (XGBoost + LightGBM + CatBoost + MLP) |
| ROC-AUC | 0.9205 |
| F1 Score | 0.784 |
| Recall | 92% |
| Features | 65 (20 baseline + 45 engineered) |
| Optuna trials | 50 |
| Cross-validation | 5-fold stacking |
| Decision threshold | 0.538 |
| Base disruption rate | 36% |
| Seed data | 18 children, 6 users, 3 social workers |

### Good Cases to Demo
| Child | Risk | Why it's interesting |
|-------|------|---------------------|
| **Aisha Williams** | High | 30 months in care, 5 placements, group home, TPR completed, no adoptive family — "Permanency Delay" critical flag |
| **Maya Johnson** | High | 3 placements, behavioral escalation, neglect removal — good SHAP demo (multiple contributing factors) |
| **Tyler Jackson** | High | 13 years old, 32 months in residential, aging out risk — critical flag |
| **Zoe Brown** | Low | 2 months, kinship care, 0 prior placements — shows what a healthy/protective case looks like in SHAP |
| **Ethan Rodriguez** | Medium | Shared notes with foster parent Maria Garcia — good for showing the foster parent ↔ worker communication |

### Potential Q&A Topics

**Q: "Isn't there bias risk in the model?"**
> "Absolutely — this is a critical concern. The AFCARS data reflects systemic biases in the child welfare system. Black and Indigenous children are disproportionately represented. We deliberately excluded race as a direct feature in our scoring model. However, proxy variables (zip code, placement type, removal reason) can still encode racial bias. In a production deployment, we would conduct fairness audits using metrics like equalized odds and demographic parity, and implement bias mitigation techniques like adversarial debiasing or reweighting."

**Q: "Why not just use ChatGPT / a commercial LLM?"**
> "HIPAA compliance. Foster care data is among the most sensitive PII that exists — children's trauma histories, medical records, family contact information. We cannot send that to a third-party API. That's why we use Ollama for local LLM inference — the model runs entirely on-premises, and no case data ever leaves the server."

**Q: "What if the model is wrong?"**
> "The model is a tool, not a decision-maker. That's why SHAP explainability is central to the design. When a social worker sees a high score, they can inspect the contributing features, compare them to their firsthand knowledge of the child, and override the recommendation if their clinical judgment disagrees. The system surfaces information — the human makes the call."

**Q: "How would this integrate with existing systems?"**
> "Most state foster care systems use platforms like SACWIS or CCWIS (Comprehensive Child Welfare Information Systems). CareAssist's API-first architecture means it could function as either a standalone application or an overlay that pulls data from an existing CCWIS system via API integration. The scoring engine is a pure-Python function — it could be deployed as a microservice that any system calls."
