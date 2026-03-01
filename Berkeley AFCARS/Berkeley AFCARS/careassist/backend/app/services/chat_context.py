"""Chat context builder for AI assistant."""
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload

from ..models.case import Case
from ..models.case_flag import CaseFlag
from ..models.child import Child
from ..models.note import Note


def build_case_context(case_detail: dict) -> str:
    """Build context string for a single case (dict-based)."""
    child = case_detail.get("child", {})
    flags = case_detail.get("flags", [])
    notes = case_detail.get("notes", [])

    context = f"""Case #{case_detail.get('case_number', 'N/A')}
Child: {child.get('first_name', '')} {child.get('last_name', '')}
DOB: {child.get('date_of_birth', 'N/A')}
Priority Score: {case_detail.get('priority_score', 0):.0%}
Status: {case_detail.get('status', 'N/A')}
Placement Type: {case_detail.get('placement_type', 'N/A')}
Months in Care: {case_detail.get('months_in_care', 0)}
Permanency Goal: {case_detail.get('permanency_goal', 'N/A')}
Medical Needs: {child.get('has_medical_needs', False)}
Behavioral Needs: {child.get('has_behavioral_needs', False)}
Prior Placements: {child.get('prior_placements', 0)}

Flags:
"""
    for f in flags:
        context += f"- [{f.get('severity', 'N/A').upper()}] {f.get('flag_type', '')} ({f.get('confidence', 0):.0%}): {f.get('description', '')}\n"

    if notes:
        context += "\nRecent Notes:\n"
        for n in notes[:5]:
            context += f"- [{n.get('note_type', 'general')}] {n.get('content', '')[:200]}\n"

    return context


async def build_full_caseload_context(db: AsyncSession) -> str:
    """Fetch ALL active cases from the database and build a comprehensive
    context string so the AI can answer questions about the real caseload."""

    # ── Dashboard stats ──
    total = (await db.execute(select(func.count(Case.id)))).scalar() or 0
    flagged_count = (await db.execute(
        select(func.count(func.distinct(CaseFlag.case_id)))
    )).scalar() or 0
    open_count = (await db.execute(
        select(func.count(Case.id)).where(Case.status == "open")
    )).scalar() or 0
    avg_months = (await db.execute(
        select(func.avg(Case.months_in_care))
    )).scalar() or 0

    # ── All cases with children, flags, notes ──
    result = await db.execute(
        select(Case)
        .options(
            joinedload(Case.child),
            joinedload(Case.flags),
            joinedload(Case.notes),
        )
        .order_by(Case.priority_score.desc())
    )
    cases = result.unique().scalars().all()

    # ── Build context ──
    lines = []  # type: List[str]
    lines.append("=== CAREASSIST DASHBOARD DATA (REAL DATA FROM DATABASE) ===")
    lines.append("")
    lines.append("CASELOAD SUMMARY:")
    lines.append(f"  Total active cases: {total}")
    lines.append(f"  Cases with flags: {flagged_count}")
    lines.append(f"  Open cases needing review: {open_count}")
    lines.append(f"  Average months in care: {round(avg_months, 1)}")
    lines.append("")
    lines.append("ALL CASES (sorted by risk score, highest first):")
    lines.append("-" * 60)

    for c in cases:
        child = c.child
        score_pct = round(c.priority_score * 100, 1) if c.priority_score else 0
        age_str = ""
        if child and child.date_of_birth:
            from datetime import date
            today = date.today()
            age = today.year - child.date_of_birth.year - (
                (today.month, today.day) < (child.date_of_birth.month, child.date_of_birth.day)
            )
            age_str = f"Age {age}"

        child_name = f"{child.first_name} {child.last_name}" if child else "Unknown"

        lines.append(f"")
        lines.append(f"CASE {c.case_number} — {child_name} ({age_str})")
        lines.append(f"  Risk Score: {score_pct}%")
        lines.append(f"  Status: {c.status}")
        lines.append(f"  Placement: {c.placement_type or 'N/A'}")
        lines.append(f"  Removal Reason: {c.removal_reason or 'N/A'}")
        lines.append(f"  Permanency Goal: {c.permanency_goal or 'N/A'}")
        lines.append(f"  Months in Care: {c.months_in_care or 0}")
        lines.append(f"  Parental Rights Terminated: {c.has_parental_rights_terminated}")

        if child:
            needs = []  # type: List[str]
            if child.has_medical_needs:
                needs.append("Medical")
            if child.has_behavioral_needs:
                needs.append("Behavioral")
            if child.has_disability:
                needs.append("Disability")
            lines.append(f"  Special Needs: {', '.join(needs) if needs else 'None'}")
            lines.append(f"  Prior Placements: {child.prior_placements}")
            lines.append(f"  Gender: {child.gender or 'N/A'}")
            lines.append(f"  Ethnicity: {child.ethnicity or 'N/A'}")

        # Flags
        if c.flags:
            lines.append(f"  Flags ({len(c.flags)}):")
            for f in sorted(c.flags, key=lambda x: x.confidence or 0, reverse=True):
                lines.append(
                    f"    - [{f.severity.upper()}] {f.flag_type} "
                    f"(confidence {round((f.confidence or 0) * 100)}%): {f.description}"
                )
                if f.recommendation:
                    lines.append(f"      → Recommendation: {f.recommendation}")

        # Notes
        if c.notes:
            lines.append(f"  Recent Notes:")
            for n in c.notes[:3]:
                lines.append(f"    - [{n.note_type}] {n.content[:200]}")

    lines.append("")
    lines.append("=== END OF DASHBOARD DATA ===")

    return "\n".join(lines)
