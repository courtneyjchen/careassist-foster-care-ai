# CareAssist: An AI-Driven Case Prioritization Tool for Foster Care

> *Developed as part of UC Berkeley’s Master of Information and Data Science (MIDS) Spring 2026 Capstone project. CareAssist was selected as one of six featured projects for the UC Berkeley MIDS Capstone Showcase, where it was presented to a panel of subject matter experts. The project has also received government interest for potential continuation as a nonprofit initiative.*

---

## Overview

With over 400,000 children in the U.S. foster care system and approximately 38% of placements ending in disruption, the system often fails to provide the continuity and stability children need to heal and thrive. Because foster care systems are managed at the county level, repeated placements can result in fragmented medical records, case notes, and lineage information while also compounding trauma for children.

In response to social workers’ direct request for a case prioritization tool, CareAssist introduces a unified, AI-powered platform that uses machine learning to identify early warning signs of placement disruption. The solution is twofold: consolidating fragmented case histories into a unified system while enabling social workers to proactively prioritize at-risk cases and intervene before crises occur.

---

## Quick Links

| Resource | Description |
|---|---|
| 🌐 [Project Website](https://care-assist.github.io/) | Overview of the platform, mission, and end-users |
| 💻 [Live Platform](https://d23ykduqz141u1.cloudfront.net/login) | Interactive CareAssist application |
| 🎥 [Video Demo](https://youtu.be/JWdxfRCivQc) | Walkthrough of the platform and workflow |
| 🎓 [UC Berkeley Showcase](https://www.ischool.berkeley.edu/projects/2026/careassist-ai-driven-case-prioritization-tool-foster-care) | Featured MIDS Capstone project |

---

## Technical Highlights

- Ensemble machine learning pipeline trained on AFCARS foster care records
- Angular + PostgreSQL platform with role-based access controls
- SHAP explainability for interpretable risk prediction
- Ollama-powered LLM assistant with localized deployment

---

## Key Results

The final ensemble model achieved:

| Metric | Performance |
|---|---|
| ROC-AUC | **0.9205** |
| Average Precision | **0.8615** |
| F1 Score | **0.784** |
| Recall | **92%** for identifying at-risk placement disruptions |
