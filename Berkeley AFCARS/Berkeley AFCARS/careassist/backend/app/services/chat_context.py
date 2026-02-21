"""Chat context builder for AI assistant."""


def build_case_context(case_detail: dict) -> str:
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
