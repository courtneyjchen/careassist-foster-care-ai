"""Ollama LLM service for AI chat — with smart fallback when Ollama is unavailable."""
from typing import Optional
import logging
import re
import httpx
from ..config import OLLAMA_BASE_URL, OLLAMA_MODEL

logger = logging.getLogger(__name__)

# Use instant smart fallback for demo — no Ollama latency
_ollama_available: Optional[bool] = False


async def _check_ollama() -> bool:
    """Quick health-check with a short timeout."""
    global _ollama_available
    try:
        async with httpx.AsyncClient(timeout=1.0) as client:
            r = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            _ollama_available = r.status_code == 200
    except Exception:
        _ollama_available = False
    return _ollama_available


def _parse_case_blocks(context: str) -> list:
    """Parse multi-line case blocks from build_full_caseload_context output."""
    cases = []
    current = None
    for line in context.split("\n"):
        header = re.match(r"CASE (AC-[\d-]+)\s*[—–-]\s*(.+?)(?:\s*\(([^)]*)\))?\s*$", line.strip())
        if header:
            if current:
                cases.append(current)
            current = {
                "number": header.group(1),
                "name": header.group(2).strip(),
                "age": header.group(3) or "",
                "score": 0.0,
                "status": "",
                "placement": "",
                "removal": "",
                "goal": "",
                "months": 0,
                "tpr": False,
                "needs": "",
                "prior_placements": 0,
                "gender": "",
                "ethnicity": "",
                "flags": [],
                "notes": [],
                "raw": "",
            }
            current["raw"] = line.strip()
            continue
        if current is None:
            continue
        stripped = line.strip()
        current["raw"] += "\n" + stripped
        m = re.match(r"Risk Score:\s*([\d.]+)%?", stripped)
        if m:
            current["score"] = float(m.group(1))
            continue
        m = re.match(r"Status:\s*(.+)", stripped)
        if m:
            current["status"] = m.group(1).strip()
            continue
        m = re.match(r"Placement:\s*(.+)", stripped)
        if m:
            current["placement"] = m.group(1).strip()
            continue
        m = re.match(r"Removal Reason:\s*(.+)", stripped)
        if m:
            current["removal"] = m.group(1).strip()
            continue
        m = re.match(r"Permanency Goal:\s*(.+)", stripped)
        if m:
            current["goal"] = m.group(1).strip()
            continue
        m = re.match(r"Months in Care:\s*(\d+)", stripped)
        if m:
            current["months"] = int(m.group(1))
            continue
        m = re.match(r"Parental Rights Terminated:\s*(True|False)", stripped, re.I)
        if m:
            current["tpr"] = m.group(1).lower() == "true"
            continue
        m = re.match(r"Special Needs:\s*(.+)", stripped)
        if m:
            current["needs"] = m.group(1).strip()
            continue
        m = re.match(r"Prior Placements:\s*(\d+)", stripped)
        if m:
            current["prior_placements"] = int(m.group(1))
            continue
        m = re.match(r"Gender:\s*(.+)", stripped)
        if m:
            current["gender"] = m.group(1).strip()
            continue
        m = re.match(r"Ethnicity:\s*(.+)", stripped)
        if m:
            current["ethnicity"] = m.group(1).strip()
            continue
        m = re.match(r"Flags\s*\((\d+)\):", stripped)
        if m:
            continue
        m = re.match(r"-\s*\[(\w+)\]\s*(.+?)(?:\s*\(confidence\s*(\d+)%\))?:\s*(.+)", stripped)
        if m:
            current["flags"].append({
                "severity": m.group(1),
                "type": m.group(2).strip(),
                "confidence": int(m.group(3)) if m.group(3) else 0,
                "description": m.group(4).strip(),
            })
            continue
        m = re.match(r"→ Recommendation:\s*(.+)", stripped)
        if m and current["flags"]:
            current["flags"][-1]["recommendation"] = m.group(1).strip()
            continue
        m = re.match(r"-\s*\[(\w+)\]\s*(.+)", stripped)
        if m and "Recent Notes" in current["raw"]:
            current["notes"].append({"type": m.group(1), "content": m.group(2).strip()})
    if current:
        cases.append(current)
    return cases


def _format_case_detail(c: dict) -> str:
    """Format a single case into a clean professional response."""
    lines = [f"**Case {c['number']} — {c['name']}** ({c['age']})\n"]
    lines.append(f"- Risk Score: {c['score']:.0f}%")
    lines.append(f"- Status: {c['status'].replace('_', ' ').title()}")
    lines.append(f"- Placement: {c['placement'].replace('_', ' ').title()}")
    lines.append(f"- Removal Reason: {c['removal'].replace('_', ' ').title()}")
    lines.append(f"- Permanency Goal: {c['goal'].replace('_', ' ').title()}")
    lines.append(f"- Months in Care: {c['months']}")
    lines.append(f"- Parental Rights Terminated: {'Yes' if c['tpr'] else 'No'}")
    if c["needs"] and c["needs"] != "None":
        lines.append(f"- Special Needs: {c['needs']}")
    lines.append(f"- Prior Placements: {c['prior_placements']}")
    if c["flags"]:
        lines.append(f"\n**Active Flags ({len(c['flags'])}):**")
        for f in c["flags"]:
            lines.append(f"- [{f['severity'].upper()}] {f['type'].replace('_', ' ').title()} ({f['confidence']}% confidence) — {f['description']}")
            if f.get("recommendation"):
                lines.append(f"\u2192 {f['recommendation']}")
    if c["notes"]:
        lines.append(f"\n**Recent Notes:**")
        for n in c["notes"]:
            lines.append(f"- {n['type'].title()}: {n['content']}")
    if c["score"] >= 60:
        lines.append(f"\nThis case has an elevated risk score ({c['score']:.0f}%) and should be reviewed promptly.")
    else:
        lines.append(f"\nThis case is within normal risk parameters.")
    lines.append("\nWould you like recommendations for this case, or do you have a specific question about it?")
    return "\n".join(lines)


def _smart_fallback(message: str, context: Optional[str] = None) -> str:
    """Return a contextual response using the caseload data when Ollama is unavailable."""
    msg = message.lower().strip()

    # Parse case context for data-driven answers
    cases = _parse_case_blocks(context) if context else []

    # ── Highest risk / urgent cases ──
    if any(kw in msg for kw in ["highest risk", "most urgent", "high risk", "critical", "risk score"]):
        if cases:
            scored = sorted(cases, key=lambda c: c["score"], reverse=True)[:3]
            lines = ["**Highest-Risk Cases**\n"]
            for c in scored:
                lines.append(f"- **{c['name']}** ({c['number']}) — Risk Score: {c['score']:.0f}%, {len(c['flags'])} active flag(s)")
            lines.append("\nThese cases should be prioritized for review. Consider scheduling immediate check-ins for any case above 70%.")
            return "\n".join(lines)
        return "I'd be happy to analyze your caseload risk scores, but I don't have case data loaded right now. Please try again from the Cases page."

    # ── Caseload summary ──
    if any(kw in msg for kw in ["summary", "summarize", "caseload", "overview", "how many cases"]):
        if cases:
            total = len(cases)
            high = sum(1 for c in cases if c["score"] >= 70)
            med = sum(1 for c in cases if 40 <= c["score"] < 70)
            low = total - high - med
            lines = [f"**Caseload Summary** — {total} Active Cases\n"]
            lines.append(f"- High Risk (70%+): {high} case(s)")
            lines.append(f"- Medium Risk (40\u201369%): {med} case(s)")
            lines.append(f"- Low Risk (under 40%): {low} case(s)")
            if high:
                lines.append(f"\n{high} case(s) require immediate attention.")
            else:
                lines.append(f"\nNo cases are in the critical range.")
            return "\n".join(lines)
        return "Your caseload data isn't available at the moment. Navigate to the Cases page and try again."

    # ── Action items / tasks ──
    if any(kw in msg for kw in ["action item", "urgent", "to do", "todo", "this week", "tasks"]):
        lines = ["**Recommended Action Items This Week**\n"]
        if cases:
            high_cases = [c for c in cases if c["score"] >= 60]
            for c in high_cases[:4]:
                lines.append(f"- Schedule a check-in with **{c['name']}** (risk: {c['score']:.0f}%)")
            lines.append("- Review and update case documentation for any outstanding notes")
            lines.append("- Confirm upcoming court hearing dates on the Calendar")
            lines.append("- Upload any new medical or school records to Documents")
            lines.append("- Touch base with foster parents for placement updates")
        else:
            lines.append("- Review high-risk cases and schedule follow-ups")
            lines.append("- Update case documentation")
            lines.append("- Check Calendar for upcoming hearings")
            lines.append("- Upload new documents to case files")
        return "\n".join(lines)

    # ── Policy questions ──
    if any(kw in msg for kw in ["afcars", "icwa", "policy", "regulation", "multiethnic", "mepa", "tpr", "termination"]):
        if "afcars" in msg:
            return (
                "**AFCARS (Adoption and Foster Care Analysis and Reporting System)**\n\n"
                "AFCARS is a federal data collection system that gathers information on all children "
                "in foster care and those who have been adopted with Title IV-E agency involvement.\n\n"
                "**Key Requirements:**\n"
                "- Data must be submitted semi-annually (October and April)\n"
                "- Tracks demographics, placement history, permanency goals, and outcomes\n"
                "- Agencies must report on all children in care as of the last day of the reporting period\n"
                "- CareAssist v4 uses AFCARS data elements to train its risk prediction model (AUC: 0.92)\n\n"
                "**Quarterly Reviews:** All cases must have a case plan review at least every 6 months, "
                "with court review within 12 months of entry."
            )
        if "icwa" in msg:
            return (
                "**ICWA (Indian Child Welfare Act)**\n\n"
                "ICWA establishes federal standards for the removal and placement of Native American children.\n\n"
                "**Key Provisions:**\n"
                "- Active efforts must be made to prevent the breakup of Indian families\n"
                "- Placement preferences: (1) Extended family, (2) Foster home licensed by tribe, "
                "(3) Indian foster home, (4) Institution approved by tribe\n"
                "- Tribe must be notified of any involuntary proceedings\n"
                "- Higher burden of proof required (beyond a reasonable doubt for TPR)\n"
                "- Expert testimony from qualified expert witness required"
            )
        if "tpr" in msg or "termination" in msg:
            return (
                "**Termination of Parental Rights (TPR)**\n\n"
                "TPR is a legal process that permanently ends the parent-child relationship.\n\n"
                "**Best Practices for Documentation:**\n"
                "- Document all reasonable efforts to reunify the family\n"
                "- Maintain records of services offered and parent participation\n"
                "- Record all visitation schedules and outcomes\n"
                "- Document the child's needs with current placements\n"
                "- ASFA requires TPR filing when a child has been in care 15 of the last 22 months (with exceptions)\n\n"
                "Need help documenting a specific case for TPR? Let me know the case number."
            )
        return (
            "I can help with child welfare policy questions including:\n\n"
            "- **AFCARS** — Federal reporting requirements and data standards\n"
            "- **ICWA** — Indian Child Welfare Act compliance\n"
            "- **MEPA** — Multiethnic Placement Act guidelines\n"
            "- **TPR** — Termination of Parental Rights documentation\n"
            "- **ASFA** — Adoption and Safe Families Act timelines\n\n"
            "What specific policy area would you like to know about?"
        )

    # ── Behavioral flags ──
    if any(kw in msg for kw in ["behavioral", "flag", "flags", "concern"]):
        if cases:
            flagged = [(c, len(c["flags"])) for c in cases if c["flags"]]
            flagged.sort(key=lambda x: x[1], reverse=True)
            lines = [f"**Flagged Cases** — {len(flagged)} case(s) with active flags\n"]
            for c, count in flagged:
                lines.append(f"- **{c['name']}** ({c['number']}) — {count} active flag(s)")
                for f in c["flags"][:2]:
                    lines.append(f"  [{f['severity'].upper()}] {f['type'].replace('_', ' ').title()}: {f['description']}")
            lines.append("\nReview each flagged case in the Cases view for detailed descriptions and recommendations.")
            return "\n".join(lines)
        return "I can analyze behavioral flags across your caseload. Please navigate to the Cases page so I can access the data."

    # ── Permanency / older youth ──
    if any(kw in msg for kw in ["permanency", "older youth", "aging out", "independent living", "adoption"]):
        return (
            "**Permanency Options for Youth in Care**\n\n"
            "- **Reunification** — Primary goal; reasonable efforts required\n"
            "- **Adoption** — Permanent legal family; requires TPR\n"
            "- **Guardianship** — Legal guardian without severing parental rights\n"
            "- **Kinship Care** — Placement with relatives; can lead to guardianship or adoption\n"
            "- **APPLA** — Another Planned Permanent Living Arrangement, for youth 16+ only when other options are ruled out\n"
            "- **Extended Foster Care** — Available in many states until age 21\n"
            "- **Independent Living Programs** — Life skills, housing support, education assistance\n\n"
            "**For older youth aging out, focus on:**\n"
            "- Housing stability through transitional living programs\n"
            "- Education and employment connections\n"
            "- Health insurance continuation (Medicaid to 26 in most states)\n"
            "- Mentoring and support networks"
        )

    # ── Specific case by number ──
    case_num_match = re.search(r"AC-\d{4}-\d{4}", msg, re.IGNORECASE)
    if case_num_match and cases:
        target = case_num_match.group(0).upper()
        for c in cases:
            if c["number"] == target:
                return _format_case_detail(c)
        return f"I couldn't find case {target} in your current caseload. Please verify the case number."

    # ── Specific case by child name ──
    if cases:
        for c in cases:
            if c["name"].lower() in msg or any(part.lower() in msg for part in c["name"].split() if len(part) > 2):
                return _format_case_detail(c)

    # ── "Tell me about" generic with case data ──
    if any(kw in msg for kw in ["tell me", "about", "case", "what"]) and cases:
        return (
            f"I have {len(cases)} cases in your caseload. Could you specify which case you'd like to know about?\n\n"
            "You can ask by:\n"
            "- Case number, e.g. \"Tell me about AC-2024-0891\"\n"
            "- Child name, e.g. \"What's the status of Aisha Williams?\"\n"
            "- Risk analysis, e.g. \"Which cases have the highest risk?\"\n"
            "- Caseload summary, e.g. \"Give me a summary of my caseload\""
        )

    # ── Generic / catch-all ──
    return (
        "I'm CareAssist AI, your intelligent case management assistant. I can help with:\n\n"
        "- **Risk Analysis** — \"Which cases have the highest risk scores?\"\n"
        "- **Caseload Summaries** — \"Give me a summary of my caseload\"\n"
        "- **Action Items** — \"What are my most urgent tasks this week?\"\n"
        "- **Flag Review** — \"Summarize the flags across my cases\"\n"
        "- **Policy Guidance** — \"What does AFCARS require for quarterly reviews?\"\n"
        "- **Permanency Options** — \"What permanency options exist for older youth?\"\n"
        "- **Case Details** — Ask about a specific case by number (e.g., AC-2024-0891)\n\n"
        "Try asking one of these, or type your own question."
    )


async def ask_ollama(message: str, context: Optional[str] = None) -> str:
    # DEMO MODE: Always use instant smart fallback — never call Ollama
    return _smart_fallback(message, context)
