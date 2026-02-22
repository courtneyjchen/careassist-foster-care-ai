"""Seed demo data into the database."""
from datetime import date, datetime
from sqlalchemy import select

from ..app.database import async_session
from ..app.models.user import User
from ..app.models.child import Child
from ..app.models.case import Case
from ..app.models.case_flag import CaseFlag
from ..app.models.note import Note


async def seed_if_empty():
    async with async_session() as db:
        existing = (await db.execute(select(User))).scalars().first()
        if existing:
            return  # Already seeded

        # ── Users ──
        u1 = User(
            email="samantha.townsend@careassist.org",
            hashed_password="demo1234",
            first_name="Samantha",
            last_name="Townsend",
            role="social_worker",
        )
        u2 = User(
            email="james.chen@careassist.org",
            hashed_password="demo1234",
            first_name="James",
            last_name="Chen",
            role="supervisor",
        )
        db.add_all([u1, u2])
        await db.flush()

        # ── Children ──
        children_data = [
            {"first_name": "Maya", "last_name": "Johnson", "date_of_birth": date(2014, 5, 10),
             "gender": "Female", "ethnicity": "Black", "has_behavioral_needs": True,
             "prior_placements": 3, "prior_adoptions": 0},
            {"first_name": "Ethan", "last_name": "Rodriguez", "date_of_birth": date(2016, 9, 22),
             "gender": "Male", "ethnicity": "Hispanic", "has_medical_needs": True,
             "prior_placements": 1, "prior_adoptions": 0},
            {"first_name": "Aisha", "last_name": "Williams", "date_of_birth": date(2012, 1, 15),
             "gender": "Female", "ethnicity": "Black", "has_behavioral_needs": True,
             "has_disability": True, "prior_placements": 5, "prior_adoptions": 1},
            {"first_name": "Liam", "last_name": "Thompson", "date_of_birth": date(2018, 7, 3),
             "gender": "Male", "ethnicity": "White",
             "prior_placements": 0, "prior_adoptions": 0},
            {"first_name": "Sofia", "last_name": "Nguyen", "date_of_birth": date(2015, 11, 28),
             "gender": "Female", "ethnicity": "Asian", "has_medical_needs": True,
             "has_behavioral_needs": True, "prior_placements": 2, "prior_adoptions": 0},
            {"first_name": "Jordan", "last_name": "Davis", "date_of_birth": date(2010, 3, 14),
             "gender": "Male", "ethnicity": "Black",
             "prior_placements": 4, "prior_adoptions": 1},
            {"first_name": "Emma", "last_name": "Martinez", "date_of_birth": date(2017, 6, 8),
             "gender": "Female", "ethnicity": "Hispanic", "has_medical_needs": True,
             "prior_placements": 1, "prior_adoptions": 0},
            {"first_name": "Noah", "last_name": "Lee", "date_of_birth": date(2013, 12, 1),
             "gender": "Male", "ethnicity": "Multiracial", "has_behavioral_needs": True,
             "prior_placements": 2, "prior_adoptions": 0},
            {"first_name": "Zoe", "last_name": "Brown", "date_of_birth": date(2019, 4, 17),
             "gender": "Female", "ethnicity": "White",
             "prior_placements": 0, "prior_adoptions": 0},
        ]

        children = []
        for cd in children_data:
            c = Child(**cd)
            db.add(c)
            children.append(c)
        await db.flush()

        # ── Cases ──
        cases_data = [
            {"case_number": "AC-2025-0142", "child": children[0], "status": "open",
             "priority_score": 0.87, "removal_reason": "Neglect",
             "placement_type": "Foster Home", "permanency_goal": "Reunification",
             "months_in_care": 14, "has_parental_rights_terminated": False},
            {"case_number": "AC-2025-0198", "child": children[1], "status": "open",
             "priority_score": 0.72, "removal_reason": "Parental Substance Abuse",
             "placement_type": "Kinship Care", "permanency_goal": "Reunification",
             "months_in_care": 8, "has_parental_rights_terminated": False},
            {"case_number": "AC-2024-0891", "child": children[2], "status": "open",
             "priority_score": 0.94, "removal_reason": "Physical Abuse",
             "placement_type": "Group Home", "permanency_goal": "Adoption",
             "months_in_care": 30, "has_parental_rights_terminated": True},
            {"case_number": "AC-2025-0267", "child": children[3], "status": "open",
             "priority_score": 0.35, "removal_reason": "Parental Incarceration",
             "placement_type": "Kinship Care", "permanency_goal": "Reunification",
             "months_in_care": 4, "has_parental_rights_terminated": False},
            {"case_number": "AC-2025-0155", "child": children[4], "status": "open",
             "priority_score": 0.81, "removal_reason": "Neglect",
             "placement_type": "Foster Home", "permanency_goal": "Adoption",
             "months_in_care": 18, "has_parental_rights_terminated": True},
            {"case_number": "AC-2024-0734", "child": children[5], "status": "in_progress",
             "priority_score": 0.68, "removal_reason": "Abandonment",
             "placement_type": "Residential", "permanency_goal": "Emancipation",
             "months_in_care": 36, "has_parental_rights_terminated": True},
            {"case_number": "AC-2025-0312", "child": children[6], "status": "open",
             "priority_score": 0.55, "removal_reason": "Domestic Violence",
             "placement_type": "Foster Home", "permanency_goal": "Reunification",
             "months_in_care": 6, "has_parental_rights_terminated": False},
            {"case_number": "AC-2025-0089", "child": children[7], "status": "in_progress",
             "priority_score": 0.76, "removal_reason": "Parental Substance Abuse",
             "placement_type": "Foster Home", "permanency_goal": "Adoption",
             "months_in_care": 22, "has_parental_rights_terminated": False},
            {"case_number": "AC-2025-0401", "child": children[8], "status": "open",
             "priority_score": 0.28, "removal_reason": "Inadequate Housing",
             "placement_type": "Kinship Care", "permanency_goal": "Reunification",
             "months_in_care": 2, "has_parental_rights_terminated": False},
        ]

        cases = []
        for cd in cases_data:
            child = cd.pop("child")
            c = Case(child_id=child.id, assigned_worker_id=u1.id, **cd)
            db.add(c)
            cases.append(c)
        await db.flush()

        # ── Flags ──
        flags_data = [
            {"case": cases[0], "flag_type": "Placement Instability Risk", "severity": "high",
             "confidence": 0.87,
             "description": "Child has had 3 prior placements. Pattern suggests elevated disruption risk.",
             "recommendation": "Consider therapeutic foster care placement with enhanced support."},
            {"case": cases[0], "flag_type": "Behavioral Escalation", "severity": "medium",
             "confidence": 0.72,
             "description": "Recent behavioral reports indicate increasing aggression at school.",
             "recommendation": "Schedule behavioral health assessment within 2 weeks."},
            {"case": cases[2], "flag_type": "Permanency Delay", "severity": "critical",
             "confidence": 0.94,
             "description": "Child has been in care for 30 months with TPR completed but no adoptive placement identified.",
             "recommendation": "Expedite adoption matching. Consider recruitment event."},
            {"case": cases[2], "flag_type": "Educational Disruption", "severity": "high",
             "confidence": 0.78,
             "description": "Child has changed schools 4 times in 2 years.",
             "recommendation": "Coordinate with education liaison for school stability plan."},
            {"case": cases[4], "flag_type": "Medical Non-Compliance", "severity": "high",
             "confidence": 0.81,
             "description": "Missed 3 consecutive medical appointments. Ongoing treatment at risk.",
             "recommendation": "Contact foster parent immediately. Arrange transportation if needed."},
            {"case": cases[7], "flag_type": "Aging Out Risk", "severity": "medium",
             "confidence": 0.65,
             "description": "Youth approaching age threshold without permanent placement.",
             "recommendation": "Begin independent living skills assessment and planning."},
        ]

        for fd in flags_data:
            case = fd.pop("case")
            flag = CaseFlag(case_id=case.id, **fd)
            db.add(flag)

        # ── Notes ──
        notes_data = [
            {"case": cases[0], "note_type": "visit",
             "content": "Home visit completed. Foster parent reports Maya is adjusting but still has nightmares. School performance improving slightly."},
            {"case": cases[0], "note_type": "court",
             "content": "Court hearing scheduled for March 15. Need to prepare permanency report."},
            {"case": cases[2], "note_type": "general",
             "content": "Adoption recruitment profile completed. Photo listing approved. Awaiting match."},
        ]

        for nd in notes_data:
            case = nd.pop("case")
            note = Note(case_id=case.id, author_id=u1.id, **nd)
            db.add(note)

        await db.commit()
        print("✅ Database seeded with demo data.")
