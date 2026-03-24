"""
CareAssist v4 Weighted Ensemble Architecture Diagram
Renders a polished architecture diagram as PNG using matplotlib.
"""
import matplotlib
matplotlib.use('Agg')
matplotlib.rcParams['font.family'] = 'sans-serif'
matplotlib.rcParams['font.sans-serif'] = ['Arial', 'DejaVu Sans']
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import numpy as np

fig, ax = plt.subplots(figsize=(16, 13.5), dpi=150)
ax.set_xlim(0, 16)
ax.set_ylim(0, 13.5)
ax.axis('off')
fig.patch.set_facecolor('white')

# ── Helpers ───────────────────────────────────────────────
def rounded_box(x, y, w, h, color, ec=None, lw=1.5, alpha=1.0, zorder=2):
    box = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.15",
                         facecolor=color, edgecolor=ec or color, linewidth=lw,
                         alpha=alpha, zorder=zorder)
    ax.add_patch(box)
    return box

def draw_arrow(x1, y1, x2, y2, color='#94a3b8', lw=1.6, style='->', zorder=1):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle=style, color=color, lw=lw),
                zorder=zorder)

# ── Color palette ─────────────────────────────────────────
C_INPUT   = '#6366f1'
C_XGB     = '#f43f5e'
C_LGB     = '#0ea5e9'
C_CB      = '#10b981'
C_MLP     = '#f59e0b'
C_AGG     = '#8b5cf6'
C_THRESH  = '#f97316'
C_HIGH    = '#ef4444'
C_LOW     = '#22c55e'
C_GRAY    = '#64748b'
C_LIGHT   = '#f1f5f9'

# ══════════════════════════════════════════════════════════
# TITLE
# ══════════════════════════════════════════════════════════
ax.text(8, 13.0, 'CareAssist v4 — Weighted Ensemble Architecture',
        ha='center', va='center', fontsize=18, fontweight='bold', color='#1e293b')
ax.text(8, 12.6, 'AUC 0.9205  ·  Recall 92%  ·  Precision 32%  ·  5.76M AFCARS Records',
        ha='center', va='center', fontsize=10, color=C_GRAY)

# ══════════════════════════════════════════════════════════
# LAYER 1: INPUT FEATURES
# ══════════════════════════════════════════════════════════
rounded_box(4.5, 11.4, 7, 0.9, C_INPUT)
ax.text(8, 11.97, '65 Engineered Features', ha='center', va='center',
        fontsize=14, fontweight='bold', color='white')
ax.text(8, 11.62, 'Demographics · Placement History · Removal Circumstances · Behavior · Services',
        ha='center', va='center', fontsize=8.5, color='#c7d2fe')

# ══════════════════════════════════════════════════════════
# ARROWS: Input → Models
# ══════════════════════════════════════════════════════════
model_xs = [2.0, 5.5, 9.0, 12.5]  # center x of each model card
model_top = 10.65
for mx in model_xs:
    draw_arrow(8, 11.4, mx, model_top, color='#cbd5e1', lw=1.3, style='->')

# ══════════════════════════════════════════════════════════
# LAYER 2: MODEL CARDS
# ══════════════════════════════════════════════════════════
card_w, card_h = 2.8, 2.5
header_h = 0.55

models = [
    {'name': 'XGBoost', 'color': C_XGB, 'x': 0.6,
     'lines': ['822 boosting rounds', 'max_depth = 13', 'learning_rate = 0.046',
               'subsample = 0.72', 'colsample = 0.68']},
    {'name': 'LightGBM', 'color': C_LGB, 'x': 4.1,
     'lines': ['1,911 boosting rounds', 'num_leaves = 377', 'learning_rate = 0.021',
               'feature_fraction = 0.65', 'bagging_fraction = 0.80']},
    {'name': 'CatBoost', 'color': C_CB, 'x': 7.6,
     'lines': ['1,387 iterations', 'depth = 12', 'learning_rate = 0.044',
               'l2_leaf_reg = 4.8', 'random_strength = 1.2']},
    {'name': 'MLP Neural Net', 'color': C_MLP, 'x': 11.1,
     'lines': ['256 → 128 → 64 units', 'ReLU + Dropout (0.3)', 'Adam optimizer',
               'Batch size = 256', '50 epochs']},
]

for m in models:
    x, y = m['x'], 10.65 - card_h
    # Card body (white)
    rounded_box(x, y, card_w, card_h, 'white', ec=m['color'], lw=2.0)
    # Header bar
    rounded_box(x + 0.02, y + card_h - header_h - 0.02, card_w - 0.04, header_h + 0.1, m['color'])
    # Model name
    ax.text(x + card_w/2, y + card_h - header_h/2 + 0.03, m['name'],
            ha='center', va='center', fontsize=12, fontweight='bold', color='white')
    # Parameter lines
    for i, line in enumerate(m['lines']):
        ax.text(x + card_w/2, y + card_h - header_h - 0.35 - i*0.32, line,
                ha='center', va='center', fontsize=8.5, color='#475569')

# ══════════════════════════════════════════════════════════
# WEIGHT BADGES
# ══════════════════════════════════════════════════════════
weights = [('0.35', C_XGB), ('0.35', C_LGB), ('0.20', C_CB), ('0.10', C_MLP)]
badge_y = 7.72

for i, (w, c) in enumerate(weights):
    cx = models[i]['x'] + card_w/2
    rounded_box(cx - 0.45, badge_y, 0.9, 0.4, c)
    ax.text(cx, badge_y + 0.2, f'w = {w}', ha='center', va='center',
            fontsize=9.5, fontweight='bold', color='white')

# ══════════════════════════════════════════════════════════
# ARROWS: Weights → Aggregation
# ══════════════════════════════════════════════════════════
agg_top = 7.2
for i in range(4):
    cx = models[i]['x'] + card_w/2
    draw_arrow(cx, badge_y, cx, agg_top, color='#cbd5e1', lw=1.3)

# ══════════════════════════════════════════════════════════
# LAYER 3: WEIGHTED AVERAGE
# ══════════════════════════════════════════════════════════
rounded_box(3.5, 6.3, 9, 0.85, C_AGG)
ax.text(8, 6.82, 'Weighted Average Probability', ha='center', va='center',
        fontsize=13, fontweight='bold', color='white')
ax.text(8, 6.50, 'P = 0.35·XGB + 0.35·LGB + 0.20·CB + 0.10·MLP',
        ha='center', va='center', fontsize=9, color='#ddd6fe')

# Arrow: Agg → Threshold
draw_arrow(8, 6.3, 8, 5.8, color='#94a3b8', lw=1.8)

# ══════════════════════════════════════════════════════════
# LAYER 4: DECISION THRESHOLD
# ══════════════════════════════════════════════════════════
rounded_box(4.8, 4.95, 6.4, 0.8, 'white', ec=C_THRESH, lw=2.5)
ax.text(8, 5.47, 'Decision Threshold', ha='center', va='center',
        fontsize=13, fontweight='bold', color='#7c3aed')
ax.text(8, 5.13, 'P ≥ 0.40 → HIGH RISK     |     P < 0.40 → LOW RISK',
        ha='center', va='center', fontsize=9.5, color=C_GRAY)

# ══════════════════════════════════════════════════════════
# ARROWS: Threshold → Outcomes
# ══════════════════════════════════════════════════════════
draw_arrow(6.5, 4.95, 4.2, 4.35, color=C_HIGH, lw=2.2)
draw_arrow(9.5, 4.95, 11.8, 4.35, color=C_LOW, lw=2.2)

# ══════════════════════════════════════════════════════════
# LAYER 5: OUTCOMES
# ══════════════════════════════════════════════════════════
# HIGH RISK
rounded_box(1.2, 2.7, 5.0, 1.65, 'white', ec=C_HIGH, lw=2.5)
rounded_box(1.22, 3.82, 4.96, 0.50, C_HIGH)
ax.text(3.7, 4.10, '⚠  HIGH RISK', ha='center', va='center',
        fontsize=13, fontweight='bold', color='white')
ax.text(3.7, 3.55, 'Placement instability predicted', ha='center', va='center',
        fontsize=9.5, color='#475569')
ax.text(3.7, 3.22, '→  Trigger enhanced monitoring', ha='center', va='center',
        fontsize=8.5, color='#94a3b8')
ax.text(3.7, 2.94, '→  Assign preventive services', ha='center', va='center',
        fontsize=8.5, color='#94a3b8')

# LOW RISK
rounded_box(9.8, 2.7, 5.0, 1.65, 'white', ec=C_LOW, lw=2.5)
rounded_box(9.82, 3.82, 4.96, 0.50, C_LOW)
ax.text(12.3, 4.10, '✓  LOW RISK', ha='center', va='center',
        fontsize=13, fontweight='bold', color='white')
ax.text(12.3, 3.55, 'Placement stability expected', ha='center', va='center',
        fontsize=9.5, color='#475569')
ax.text(12.3, 3.22, '→  Standard case management', ha='center', va='center',
        fontsize=8.5, color='#94a3b8')
ax.text(12.3, 2.94, '→  Routine check-ins', ha='center', va='center',
        fontsize=8.5, color='#94a3b8')

# ══════════════════════════════════════════════════════════
# PERFORMANCE METRICS BAR
# ══════════════════════════════════════════════════════════
rounded_box(2.0, 1.15, 12.0, 1.15, C_LIGHT, ec='#e2e8f0', lw=1.5)

metrics = [
    ('0.9205', 'AUC-ROC', '#6366f1'),
    ('92%', 'Recall', '#ef4444'),
    ('32%', 'Precision', '#f59e0b'),
    ('5.76M', 'Records Analyzed', '#475569'),
]

metric_xs = [4.0, 6.5, 9.0, 12.0]
for (val, label, c), mx in zip(metrics, metric_xs):
    ax.text(mx, 1.92, val, ha='center', va='center', fontsize=16, fontweight='bold', color=c)
    ax.text(mx, 1.55, label, ha='center', va='center', fontsize=8.5, color='#94a3b8')

# Separator lines
for sep_x in [5.25, 7.75, 10.5]:
    ax.plot([sep_x, sep_x], [1.40, 2.10], color='#e2e8f0', lw=1.5, zorder=3)

# ══════════════════════════════════════════════════════════
# SAVE
# ══════════════════════════════════════════════════════════
out = r'c:\Users\Samantha Townsend\Downloads\v4_architecture_diagram.png'
fig.savefig(out, bbox_inches='tight', pad_inches=0.3, facecolor='white', dpi=150)
plt.close()
print(f'Saved to: {out}')
