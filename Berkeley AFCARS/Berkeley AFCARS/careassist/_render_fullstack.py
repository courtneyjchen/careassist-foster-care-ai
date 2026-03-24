"""
CareAssist Full-Stack Architecture Diagram
Renders a polished 3-tier architecture diagram as PNG using matplotlib.
"""
import matplotlib
matplotlib.use('Agg')
matplotlib.rcParams['font.family'] = 'sans-serif'
matplotlib.rcParams['font.sans-serif'] = ['Arial', 'DejaVu Sans']
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import numpy as np

fig, ax = plt.subplots(figsize=(14, 16), dpi=150)
ax.set_xlim(0, 14)
ax.set_ylim(0, 16)
ax.axis('off')
fig.patch.set_facecolor('white')

# ── Helpers ───────────────────────────────────────────────
def rounded_box(x, y, w, h, color, ec=None, lw=1.5, alpha=1.0, zorder=2):
    box = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.18",
                         facecolor=color, edgecolor=ec or color, linewidth=lw,
                         alpha=alpha, zorder=zorder)
    ax.add_patch(box)
    return box

def draw_arrow(x1, y1, x2, y2, color='#94a3b8', lw=2.0, style='-|>', zorder=3):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle=style, color=color, lw=lw,
                                mutation_scale=18),
                zorder=zorder)

def icon_circle(x, y, r, color, text, fontsize=11):
    circle = plt.Circle((x, y), r, facecolor=color, edgecolor='white', linewidth=2, zorder=5)
    ax.add_patch(circle)
    ax.text(x, y, text, ha='center', va='center', fontsize=fontsize, color='white', fontweight='bold', zorder=6)

# ── Colors ────────────────────────────────────────────────
C_FE       = '#6366f1'   # indigo - frontend
C_FE_LIGHT = '#eef2ff'
C_API      = '#0ea5e9'   # sky blue - API
C_API_LIGHT= '#e0f2fe'
C_ML       = '#f59e0b'   # amber - ML engine
C_ML_LIGHT = '#fef3c7'
C_DB       = '#10b981'   # emerald - database
C_DB_LIGHT = '#d1fae5'
C_GRAY     = '#64748b'
C_LGRAY    = '#f1f5f9'

# ══════════════════════════════════════════════════════════
# TITLE
# ══════════════════════════════════════════════════════════
ax.text(7, 15.5, 'CareAssist — Full-Stack Architecture',
        ha='center', va='center', fontsize=20, fontweight='bold', color='#1e293b')
ax.text(7, 15.1, 'Angular 17 + FastAPI + ML Engine + SQLite',
        ha='center', va='center', fontsize=11, color=C_GRAY)

# ══════════════════════════════════════════════════════════
# LAYER 1: ANGULAR FRONTEND
# ══════════════════════════════════════════════════════════
fe_x, fe_y, fe_w, fe_h = 1.5, 12.2, 11, 2.5
rounded_box(fe_x, fe_y, fe_w, fe_h, C_FE_LIGHT, ec=C_FE, lw=2.5)
# Header bar
rounded_box(fe_x + 0.05, fe_y + fe_h - 0.65, fe_w - 0.10, 0.60, C_FE)
ax.text(7, fe_y + fe_h - 0.35, 'Angular 17 Frontend', ha='center', va='center',
        fontsize=15, fontweight='bold', color='white')

# Feature boxes inside
fe_features = [
    ('Dashboard', 2.6, 13.3), ('Case Detail', 5.0, 13.3), ('SHAP Charts', 7.4, 13.3),
    ('AI Chat', 9.8, 13.3),
    ('Supervisor View', 3.8, 12.55), ('Foster Parent View', 7.0, 12.55),
    ('Youth Resources', 10.2, 12.55),
]
for label, fx, fy in fe_features:
    w = len(label) * 0.16 + 0.6
    rounded_box(fx - w/2, fy - 0.22, w, 0.44, 'white', ec=C_FE, lw=1.2, zorder=4)
    ax.text(fx, fy, label, ha='center', va='center', fontsize=8.5, color=C_FE, fontweight='600', zorder=5)

# ══════════════════════════════════════════════════════════
# ARROW: Frontend → Backend
# ══════════════════════════════════════════════════════════
draw_arrow(7, 12.2, 7, 11.65, color=C_FE, lw=2.5)
# Label
rounded_box(5.8, 11.72, 2.4, 0.42, 'white', ec='#cbd5e1', lw=1.2, zorder=4)
ax.text(7, 11.93, 'REST API', ha='center', va='center', fontsize=9.5,
        fontweight='bold', color=C_GRAY, zorder=5)
draw_arrow(7, 11.72, 7, 11.15, color=C_API, lw=2.5)

# ══════════════════════════════════════════════════════════
# LAYER 2: FASTAPI BACKEND
# ══════════════════════════════════════════════════════════
be_x, be_y, be_w, be_h = 1.5, 8.1, 11, 3.0
rounded_box(be_x, be_y, be_w, be_h, C_API_LIGHT, ec=C_API, lw=2.5)
# Header bar
rounded_box(be_x + 0.05, be_y + be_h - 0.65, be_w - 0.10, 0.60, C_API)
ax.text(7, be_y + be_h - 0.35, 'FastAPI Backend  (Python 3.8)', ha='center', va='center',
        fontsize=15, fontweight='bold', color='white')

# Service boxes
be_services = [
    ('Authentication\n& RBAC', 2.8, 9.7),
    ('Case\nManagement', 5.2, 9.7),
    ('Dashboard\nAPI', 7.6, 9.7),
    ('Chat\n(LLM)', 10.0, 9.7),
    ('File Storage\n(S3)', 12.0, 9.7),
]
for label, sx, sy in be_services:
    rounded_box(sx - 0.95, sy - 0.5, 1.9, 1.0, 'white', ec=C_API, lw=1.2, zorder=4)
    ax.text(sx, sy, label, ha='center', va='center', fontsize=8.2, color='#0369a1',
            fontweight='600', zorder=5, linespacing=1.4)

# Sub-section label
ax.text(7, 8.75, 'Async endpoints  ·  Pydantic models  ·  JWT auth  ·  CORS middleware',
        ha='center', va='center', fontsize=8, color='#64748b', style='italic')

# ══════════════════════════════════════════════════════════
# ARROW: Backend → ML Engine
# ══════════════════════════════════════════════════════════
draw_arrow(7, 8.1, 7, 7.55, color=C_API, lw=2.5)
# Label
rounded_box(5.4, 7.58, 3.2, 0.42, 'white', ec='#cbd5e1', lw=1.2, zorder=4)
ax.text(7, 7.79, 'Risk Assessment', ha='center', va='center', fontsize=9.5,
        fontweight='bold', color=C_GRAY, zorder=5)
draw_arrow(7, 7.58, 7, 7.0, color=C_ML, lw=2.5)

# ══════════════════════════════════════════════════════════
# LAYER 3: ML ENGINE
# ══════════════════════════════════════════════════════════
ml_x, ml_y, ml_w, ml_h = 1.5, 3.9, 11, 3.05
rounded_box(ml_x, ml_y, ml_w, ml_h, C_ML_LIGHT, ec=C_ML, lw=2.5)
# Header bar
rounded_box(ml_x + 0.05, ml_y + ml_h - 0.65, ml_w - 0.10, 0.60, C_ML)
ax.text(7, ml_y + ml_h - 0.35, 'ML Engine: Pure-Python Scorer', ha='center', va='center',
        fontsize=15, fontweight='bold', color='white')

# Pipeline stages as connected boxes
stages = [
    ('65-Feature\nExtraction', 2.8),
    ('Piecewise-Linear\nScoring', 5.6),
    ('Weighted Ensemble\nProbability', 8.4),
    ('SHAP\nExplanations', 11.2),
]
for i, (label, sx) in enumerate(stages):
    rounded_box(sx - 1.1, 5.05, 2.2, 1.0, 'white', ec=C_ML, lw=1.5, zorder=4)
    ax.text(sx, 5.55, label, ha='center', va='center', fontsize=8.5, color='#92400e',
            fontweight='600', zorder=5, linespacing=1.4)
    if i < len(stages) - 1:
        next_sx = stages[i+1][1]
        draw_arrow(sx + 1.1, 5.55, next_sx - 1.1, 5.55, color=C_ML, lw=1.8)

# Bottom labels
ax.text(2.8, 4.55, 'Demographics\nPlacement · Removal\nBehavior · Services', ha='center', va='center',
        fontsize=7, color='#78716c', linespacing=1.3, style='italic')
ax.text(5.6, 4.55, 'XGBoost splits\nencoded as\nif/else chains', ha='center', va='center',
        fontsize=7, color='#78716c', linespacing=1.3, style='italic')
ax.text(8.4, 4.55, '0.35·XGB + 0.35·LGB\n+ 0.20·CB + 0.10·MLP\nThreshold = 0.40', ha='center', va='center',
        fontsize=7, color='#78716c', linespacing=1.3, style='italic')
ax.text(11.2, 4.55, '37 feature\nimportances\nper prediction', ha='center', va='center',
        fontsize=7, color='#78716c', linespacing=1.3, style='italic')

# ══════════════════════════════════════════════════════════
# ARROW: ML Engine → Database
# ══════════════════════════════════════════════════════════
draw_arrow(7, 3.9, 7, 3.35, color=C_ML, lw=2.5)
# Label
rounded_box(5.55, 3.38, 2.9, 0.42, 'white', ec='#cbd5e1', lw=1.2, zorder=4)
ax.text(7, 3.59, 'Read / Write', ha='center', va='center', fontsize=9.5,
        fontweight='bold', color=C_GRAY, zorder=5)
draw_arrow(7, 3.38, 7, 2.85, color=C_DB, lw=2.5)

# ══════════════════════════════════════════════════════════
# LAYER 4: DATABASE
# ══════════════════════════════════════════════════════════
db_x, db_y, db_w, db_h = 1.5, 0.9, 11, 1.9
rounded_box(db_x, db_y, db_w, db_h, C_DB_LIGHT, ec=C_DB, lw=2.5)
# Header bar
rounded_box(db_x + 0.05, db_y + db_h - 0.65, db_w - 0.10, 0.60, C_DB)
ax.text(7, db_y + db_h - 0.35, 'SQLite  (aiosqlite)', ha='center', va='center',
        fontsize=15, fontweight='bold', color='white')

# Table boxes
tables = ['Users', 'Cases', 'Children', 'Risk Scores', 'Audit Log']
table_xs = [2.6, 4.6, 6.8, 9.0, 11.2]
for label, tx in zip(tables, table_xs):
    w = len(label) * 0.16 + 0.5
    rounded_box(tx - w/2, 1.12, w, 0.44, 'white', ec=C_DB, lw=1.2, zorder=4)
    ax.text(tx, 1.34, label, ha='center', va='center', fontsize=8.5, color='#047857',
            fontweight='600', zorder=5)

# ══════════════════════════════════════════════════════════
# SIDE LABELS (layer numbers)
# ══════════════════════════════════════════════════════════
for i, (ly, lbl, c) in enumerate([
    (13.45, '1', C_FE), (9.6, '2', C_API), (5.4, '3', C_ML), (1.85, '4', C_DB)
]):
    circle = plt.Circle((0.7, ly), 0.35, facecolor=c, edgecolor='white', linewidth=2, zorder=5)
    ax.add_patch(circle)
    ax.text(0.7, ly, lbl, ha='center', va='center', fontsize=14, color='white', fontweight='bold', zorder=6)

# ══════════════════════════════════════════════════════════
# SAVE
# ══════════════════════════════════════════════════════════
out = r'c:\Users\Samantha Townsend\Downloads\fullstack_architecture_diagram.png'
fig.savefig(out, bbox_inches='tight', pad_inches=0.3, facecolor='white', dpi=150)
plt.close()
print(f'Saved to: {out}')
