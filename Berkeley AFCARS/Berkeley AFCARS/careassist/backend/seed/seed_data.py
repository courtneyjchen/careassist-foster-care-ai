"""Seed demo data into the database."""
from datetime import date, datetime, timedelta
from sqlalchemy import select

from app.database import async_session
from app.models.user import User
from app.models.child import Child
from app.models.case import Case
from app.models.case_flag import CaseFlag
from app.models.note import Note
from app.models.risk_score_history import RiskScoreHistory
from app.models.family_member import FamilyMember
from app.models.sibling_link import SiblingLink
from app.models.notification import Notification
from app.models.shared_note import SharedNote
from app.models.placement import Placement
from app.services.risk_engine import calculate_priority_score


async def seed_if_empty():
    async with async_session() as db:
        existing = (await db.execute(select(User))).scalars().first()
        if existing:
            return  # Already seeded

        # ── Users ──
        u1 = User(
            email="jessica.hawkins@careassist.org",
            hashed_password="demo1234",
            first_name="Jessica",
            last_name="Hawkins",
            role="social_worker",
        )
        u2 = User(
            email="james.chen@careassist.org",
            hashed_password="demo1234",
            first_name="James",
            last_name="Chen",
            role="supervisor",
        )
        u3 = User(
            email="maria.garcia@careassist.org",
            hashed_password="demo1234",
            first_name="Maria",
            last_name="Garcia",
            role="foster_parent",
        )
        u4 = User(
            email="jordan.davis@careassist.org",
            hashed_password="demo1234",
            first_name="Jordan",
            last_name="Davis",
            role="aged_out_youth",
        )
        # Additional social workers under supervisor James Chen
        u5 = User(
            email="priya.patel@careassist.org",
            hashed_password="demo1234",
            first_name="Priya",
            last_name="Patel",
            role="social_worker",
        )
        u6 = User(
            email="marcus.williams@careassist.org",
            hashed_password="demo1234",
            first_name="Marcus",
            last_name="Williams",
            role="social_worker",
        )
        db.add_all([u1, u2, u3, u4, u5, u6])
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
            {"first_name": "Jordan", "last_name": "Davis", "date_of_birth": date(2002, 3, 14),
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
            # ── Additional children for fuller caseloads ──
            # Jessica Hawkins extras (indices 9-11)
            {"first_name": "Caleb", "last_name": "Washington", "date_of_birth": date(2015, 2, 14),
             "gender": "Male", "ethnicity": "Black", "has_behavioral_needs": True,
             "prior_placements": 2, "prior_adoptions": 0},
            {"first_name": "Isla", "last_name": "Moreno", "date_of_birth": date(2017, 8, 25),
             "gender": "Female", "ethnicity": "Hispanic", "has_medical_needs": True,
             "prior_placements": 1, "prior_adoptions": 0},
            {"first_name": "Jayden", "last_name": "Carter", "date_of_birth": date(2013, 11, 5),
             "gender": "Male", "ethnicity": "Black", "has_behavioral_needs": True,
             "has_disability": True, "prior_placements": 4, "prior_adoptions": 1},
            # Priya Patel extras (indices 12-14)
            {"first_name": "Aria", "last_name": "Kim", "date_of_birth": date(2016, 4, 12),
             "gender": "Female", "ethnicity": "Asian", "has_medical_needs": True,
             "prior_placements": 1, "prior_adoptions": 0},
            {"first_name": "Diego", "last_name": "Ramirez", "date_of_birth": date(2014, 7, 30),
             "gender": "Male", "ethnicity": "Hispanic", "has_behavioral_needs": True,
             "prior_placements": 3, "prior_adoptions": 0},
            {"first_name": "Nadia", "last_name": "Hassan", "date_of_birth": date(2018, 1, 19),
             "gender": "Female", "ethnicity": "Middle Eastern",
             "prior_placements": 0, "prior_adoptions": 0},
            # Marcus Williams extras (indices 15-17)
            {"first_name": "Tyler", "last_name": "Jackson", "date_of_birth": date(2012, 6, 22),
             "gender": "Male", "ethnicity": "Black", "has_behavioral_needs": True,
             "prior_placements": 5, "prior_adoptions": 1},
            {"first_name": "Lily", "last_name": "Chen", "date_of_birth": date(2016, 10, 3),
             "gender": "Female", "ethnicity": "Asian", "has_medical_needs": True,
             "has_behavioral_needs": True, "prior_placements": 2, "prior_adoptions": 0},
            {"first_name": "Owen", "last_name": "Murphy", "date_of_birth": date(2019, 3, 8),
             "gender": "Male", "ethnicity": "White",
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
             "removal_reason": "Neglect",
             "placement_type": "Foster Home", "permanency_goal": "Reunification",
             "months_in_care": 14, "has_parental_rights_terminated": False},
            {"case_number": "AC-2025-0198", "child": children[1], "status": "open",
             "removal_reason": "Parental Substance Abuse",
             "placement_type": "Foster Home", "permanency_goal": "Reunification",
             "months_in_care": 8, "has_parental_rights_terminated": False},
            {"case_number": "AC-2024-0891", "child": children[2], "status": "open",
             "removal_reason": "Physical Abuse",
             "placement_type": "Group Home", "permanency_goal": "Adoption",
             "months_in_care": 30, "has_parental_rights_terminated": True},
            {"case_number": "AC-2025-0267", "child": children[3], "status": "open",
             "removal_reason": "Parental Incarceration",
             "placement_type": "Foster Home", "permanency_goal": "Reunification",
             "months_in_care": 4, "has_parental_rights_terminated": False},
            {"case_number": "AC-2025-0155", "child": children[4], "status": "open",
             "removal_reason": "Neglect",
             "placement_type": "Foster Home", "permanency_goal": "Adoption",
             "months_in_care": 18, "has_parental_rights_terminated": True},
            {"case_number": "AC-2024-0734", "child": children[5], "status": "in_progress",
             "removal_reason": "Abandonment",
             "placement_type": "Residential", "permanency_goal": "Emancipation",
             "months_in_care": 36, "has_parental_rights_terminated": True},
            {"case_number": "AC-2025-0312", "child": children[6], "status": "open",
             "removal_reason": "Domestic Violence",
             "placement_type": "Foster Home", "permanency_goal": "Reunification",
             "months_in_care": 6, "has_parental_rights_terminated": False},
            {"case_number": "AC-2025-0089", "child": children[7], "status": "in_progress",
             "removal_reason": "Parental Substance Abuse",
             "placement_type": "Foster Home", "permanency_goal": "Adoption",
             "months_in_care": 22, "has_parental_rights_terminated": False},
            {"case_number": "AC-2025-0401", "child": children[8], "status": "open",
             "removal_reason": "Inadequate Housing",
             "placement_type": "Kinship Care", "permanency_goal": "Reunification",
             "months_in_care": 2, "has_parental_rights_terminated": False},
            # ── Additional cases ──
            # Jessica Hawkins (u1) extras
            {"case_number": "AC-2025-0445", "child": children[9], "status": "open",
             "removal_reason": "Neglect",
             "placement_type": "Foster Home", "permanency_goal": "Reunification",
             "months_in_care": 10, "has_parental_rights_terminated": False},
            {"case_number": "AC-2025-0478", "child": children[10], "status": "open",
             "removal_reason": "Domestic Violence",
             "placement_type": "Foster Home", "permanency_goal": "Reunification",
             "months_in_care": 5, "has_parental_rights_terminated": False},
            {"case_number": "AC-2024-0912", "child": children[11], "status": "in_progress",
             "removal_reason": "Physical Abuse",
             "placement_type": "Group Home", "permanency_goal": "Adoption",
             "months_in_care": 28, "has_parental_rights_terminated": True},
            # Priya Patel (u5) extras
            {"case_number": "AC-2025-0501", "child": children[12], "status": "open",
             "removal_reason": "Parental Substance Abuse",
             "placement_type": "Foster Home", "permanency_goal": "Reunification",
             "months_in_care": 7, "has_parental_rights_terminated": False},
            {"case_number": "AC-2025-0523", "child": children[13], "status": "in_progress",
             "removal_reason": "Neglect",
             "placement_type": "Group Home", "permanency_goal": "Adoption",
             "months_in_care": 16, "has_parental_rights_terminated": True},
            {"case_number": "AC-2025-0547", "child": children[14], "status": "open",
             "removal_reason": "Parental Incarceration",
             "placement_type": "Kinship Care", "permanency_goal": "Reunification",
             "months_in_care": 3, "has_parental_rights_terminated": False},
            # Marcus Williams (u6) extras
            {"case_number": "AC-2024-0867", "child": children[15], "status": "in_progress",
             "removal_reason": "Physical Abuse",
             "placement_type": "Residential", "permanency_goal": "Emancipation",
             "months_in_care": 32, "has_parental_rights_terminated": True},
            {"case_number": "AC-2025-0589", "child": children[16], "status": "open",
             "removal_reason": "Medical Neglect",
             "placement_type": "Foster Home", "permanency_goal": "Adoption",
             "months_in_care": 12, "has_parental_rights_terminated": False},
            {"case_number": "AC-2025-0612", "child": children[17], "status": "open",
             "removal_reason": "Inadequate Housing",
             "placement_type": "Kinship Care", "permanency_goal": "Reunification",
             "months_in_care": 1, "has_parental_rights_terminated": False},
        ]

        cases = []
        # Cases assigned to foster parent Maria Garcia (u3): indices 1, 3, 6
        foster_parent_cases = {1, 3, 6}  # Ethan Rodriguez, Liam Thompson, Emma Martinez
        # Distribute cases across social workers:
        #   u1 (Jessica Hawkins): cases 0,1,2,3  (Maya, Ethan, Aisha, Liam)
        #   u5 (Priya Patel):       cases 4,5,6    (Sofia, Jordan, Emma)
        #   u6 (Marcus Williams):    cases 7,8      (Noah, Zoe)
        worker_for_case = {0: u1, 1: u1, 2: u1, 3: u1,
                           4: u5, 5: u5, 6: u5,
                           7: u6, 8: u6,
                           9: u1, 10: u1, 11: u1,
                           12: u5, 13: u5, 14: u5,
                           15: u6, 16: u6, 17: u6}
        for idx, cd in enumerate(cases_data):
            child = cd.pop("child")
            worker = worker_for_case[idx]
            c = Case(child_id=child.id, assigned_worker_id=worker.id, **cd)
            if idx in foster_parent_cases:
                c.foster_parent_id = u3.id
            # Score with the XGBoost model instead of hardcoding
            c.priority_score = round(calculate_priority_score(child, c), 4)
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
            # Flags for new cases
            {"case": cases[9], "flag_type": "Behavioral Escalation", "severity": "medium",
             "confidence": 0.70,
             "description": "Caleb Washington showing increased aggression at school. Two suspensions this quarter.",
             "recommendation": "Refer to trauma-focused cognitive behavioral therapy."},
            {"case": cases[11], "flag_type": "Permanency Delay", "severity": "high",
             "confidence": 0.88,
             "description": "Jayden Carter has been in care 28 months with TPR completed. No adoptive family identified.",
             "recommendation": "Prioritize adoption matching and consider heart gallery listing."},
            {"case": cases[13], "flag_type": "Placement Instability Risk", "severity": "high",
             "confidence": 0.82,
             "description": "Diego Ramirez has had 3 prior placements. Current group home reports behavioral concerns.",
             "recommendation": "Assess for therapeutic foster care. Increase visit frequency."},
            {"case": cases[15], "flag_type": "Aging Out Risk", "severity": "critical",
             "confidence": 0.91,
             "description": "Tyler Jackson is 13 with 32 months in residential care and TPR completed. No permanent plan.",
             "recommendation": "Urgent: initiate independent living prep and intensive adoption recruitment."},
            {"case": cases[16], "flag_type": "Medical Non-Compliance", "severity": "medium",
             "confidence": 0.68,
             "description": "Lily Chen missed two medical follow-ups for chronic asthma management.",
             "recommendation": "Coordinate with foster parent to reschedule appointments."},
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

        # ── Placements (timeline data) ──
        now = datetime.utcnow()
        placements_data = [
            # Maya Johnson — 3 placements
            {"case": cases[0], "placement_type": "Kinship Care", "start_date": date(2024, 1, 15), "end_date": date(2024, 5, 20), "provider_name": "Johnson Family (Aunt)"},
            {"case": cases[0], "placement_type": "Group Home", "start_date": date(2024, 5, 21), "end_date": date(2024, 9, 10), "provider_name": "Sunrise Youth Center"},
            {"case": cases[0], "placement_type": "Foster Home", "start_date": date(2024, 9, 11), "end_date": None, "provider_name": "Garcia Family"},
            # Ethan Rodriguez — 1 placement
            {"case": cases[1], "placement_type": "Foster Home", "start_date": date(2025, 5, 1), "end_date": None, "provider_name": "Garcia Family"},
            # Aisha Williams — 5 placements
            {"case": cases[2], "placement_type": "Foster Home", "start_date": date(2022, 7, 10), "end_date": date(2022, 12, 1), "provider_name": "Taylor Family"},
            {"case": cases[2], "placement_type": "Foster Home", "start_date": date(2022, 12, 2), "end_date": date(2023, 4, 15), "provider_name": "Brooks Family"},
            {"case": cases[2], "placement_type": "Group Home", "start_date": date(2023, 4, 16), "end_date": date(2023, 11, 1), "provider_name": "Harbor House"},
            {"case": cases[2], "placement_type": "Residential", "start_date": date(2023, 11, 2), "end_date": date(2024, 6, 30), "provider_name": "Oakridge Center"},
            {"case": cases[2], "placement_type": "Group Home", "start_date": date(2024, 7, 1), "end_date": None, "provider_name": "Lighthouse Group Home"},
            # Sofia Nguyen — 2 placements
            {"case": cases[4], "placement_type": "Foster Home", "start_date": date(2024, 7, 1), "end_date": date(2025, 2, 15), "provider_name": "Park Family"},
            {"case": cases[4], "placement_type": "Foster Home", "start_date": date(2025, 2, 16), "end_date": None, "provider_name": "Chen Family"},
            # Jordan Davis — 4 placements
            {"case": cases[5], "placement_type": "Foster Home", "start_date": date(2021, 3, 1), "end_date": date(2021, 9, 15), "provider_name": "Adams Family"},
            {"case": cases[5], "placement_type": "Group Home", "start_date": date(2021, 9, 16), "end_date": date(2022, 6, 1), "provider_name": "Pacific Youth Home"},
            {"case": cases[5], "placement_type": "Foster Home", "start_date": date(2022, 6, 2), "end_date": date(2023, 1, 20), "provider_name": "Rivera Family"},
            {"case": cases[5], "placement_type": "Group Home", "start_date": date(2023, 1, 21), "end_date": None, "provider_name": "Bay Area Group Home"},
            # Caleb Washington — 2 placements
            {"case": cases[9], "placement_type": "Foster Home", "start_date": date(2025, 3, 10), "end_date": date(2025, 8, 1), "provider_name": "Mitchell Family"},
            {"case": cases[9], "placement_type": "Foster Home", "start_date": date(2025, 8, 2), "end_date": None, "provider_name": "Okafor Family"},
            # Isla Moreno — 1 placement
            {"case": cases[10], "placement_type": "Foster Home", "start_date": date(2025, 10, 5), "end_date": None, "provider_name": "Sullivan Family"},
            # Jayden Carter — 4 placements
            {"case": cases[11], "placement_type": "Foster Home", "start_date": date(2023, 11, 1), "end_date": date(2024, 3, 15), "provider_name": "Lewis Family"},
            {"case": cases[11], "placement_type": "Foster Home", "start_date": date(2024, 3, 16), "end_date": date(2024, 8, 20), "provider_name": "Dixon Family"},
            {"case": cases[11], "placement_type": "Group Home", "start_date": date(2024, 8, 21), "end_date": date(2025, 4, 1), "provider_name": "Horizon Youth Center"},
            {"case": cases[11], "placement_type": "Group Home", "start_date": date(2025, 4, 2), "end_date": None, "provider_name": "Beacon Group Home"},
            # Aria Kim — 1 placement
            {"case": cases[12], "placement_type": "Foster Home", "start_date": date(2025, 8, 15), "end_date": None, "provider_name": "Patel Family"},
            # Diego Ramirez — 3 placements
            {"case": cases[13], "placement_type": "Foster Home", "start_date": date(2024, 11, 1), "end_date": date(2025, 3, 10), "provider_name": "Torres Family"},
            {"case": cases[13], "placement_type": "Foster Home", "start_date": date(2025, 3, 11), "end_date": date(2025, 9, 1), "provider_name": "Nguyen Family"},
            {"case": cases[13], "placement_type": "Group Home", "start_date": date(2025, 9, 2), "end_date": None, "provider_name": "Valley Youth Home"},
            # Nadia Hassan — kinship
            {"case": cases[14], "placement_type": "Kinship Care", "start_date": date(2025, 12, 10), "end_date": None, "provider_name": "Hassan Family (Uncle)"},
            # Tyler Jackson — 5 placements
            {"case": cases[15], "placement_type": "Foster Home", "start_date": date(2023, 5, 1), "end_date": date(2023, 9, 15), "provider_name": "Howard Family"},
            {"case": cases[15], "placement_type": "Foster Home", "start_date": date(2023, 9, 16), "end_date": date(2024, 2, 1), "provider_name": "Coleman Family"},
            {"case": cases[15], "placement_type": "Group Home", "start_date": date(2024, 2, 2), "end_date": date(2024, 7, 15), "provider_name": "Crossroads Group Home"},
            {"case": cases[15], "placement_type": "Residential", "start_date": date(2024, 7, 16), "end_date": date(2025, 6, 1), "provider_name": "Pinecrest Residential"},
            {"case": cases[15], "placement_type": "Residential", "start_date": date(2025, 6, 2), "end_date": None, "provider_name": "Lakeside Residential"},
            # Lily Chen — 2 placements
            {"case": cases[16], "placement_type": "Foster Home", "start_date": date(2025, 3, 1), "end_date": date(2025, 9, 15), "provider_name": "Anderson Family"},
            {"case": cases[16], "placement_type": "Foster Home", "start_date": date(2025, 9, 16), "end_date": None, "provider_name": "Wu Family"},
            # Owen Murphy — kinship
            {"case": cases[17], "placement_type": "Kinship Care", "start_date": date(2026, 2, 10), "end_date": None, "provider_name": "Murphy Family (Grandparents)"},
        ]
        for pd in placements_data:
            case = pd.pop("case")
            db.add(Placement(case_id=case.id, **pd))

        # ── Risk Score History (6 months of trend data per case) ──
        import random
        random.seed(42)
        for case in cases:
            base = case.priority_score
            for months_ago in range(5, -1, -1):
                ts = now - timedelta(days=months_ago * 30)
                # Simulate drift: higher-risk cases trend up, lower trend stable/down
                drift = random.uniform(-0.06, 0.06)
                if base > 0.6:
                    drift += 0.01 * months_ago  # was lower before, trended up
                historical = max(0.05, min(0.98, base - drift))
                db.add(RiskScoreHistory(case_id=case.id, score=round(historical, 4), recorded_at=ts))

        # ── Sibling Links ──
        # Maya Johnson (children[0]) and Aisha Williams (children[2]) are half-siblings
        db.add(SiblingLink(child_id_1=children[0].id, child_id_2=children[2].id, relationship_type="half_sibling"))
        # Ethan Rodriguez (children[1]) and Emma Martinez (children[6]) are full siblings
        db.add(SiblingLink(child_id_1=children[1].id, child_id_2=children[6].id, relationship_type="full_sibling"))
        # Noah Lee (children[7]) and Zoe Brown (children[8]) are step-siblings
        db.add(SiblingLink(child_id_1=children[7].id, child_id_2=children[8].id, relationship_type="step_sibling"))

        # ── Family Members ──
        family_data = [
            # Maya Johnson's family
            {"child": children[0], "first_name": "Keisha", "last_name": "Johnson", "relationship_type": "mother", "phone": "(510) 555-0142", "safe_contact": False, "notes": "Supervised visitation only. History of neglect."},
            {"child": children[0], "first_name": "Darnell", "last_name": "Johnson", "relationship_type": "father", "phone": "(510) 555-0198", "safe_contact": True, "notes": "Completing parenting classes. Engaged in reunification."},
            {"child": children[0], "first_name": "Patricia", "last_name": "Johnson", "relationship_type": "grandmother", "phone": "(510) 555-0267", "safe_contact": True, "notes": "Maternal grandmother. Strong bond with Maya. Potential kinship placement."},
            # Ethan Rodriguez's family
            {"child": children[1], "first_name": "Rosa", "last_name": "Rodriguez", "relationship_type": "mother", "phone": "(415) 555-0311", "safe_contact": True, "notes": "In substance abuse treatment program. Making good progress."},
            {"child": children[1], "first_name": "Miguel", "last_name": "Rodriguez", "relationship_type": "father", "phone": "(415) 555-0322", "safe_contact": True, "notes": "Active participant in case planning."},
            {"child": children[1], "first_name": "Elena", "last_name": "Rodriguez", "relationship_type": "aunt", "phone": "(415) 555-0333", "safe_contact": True, "notes": "Backup caregiver. Available on weekends."},
            # Aisha Williams's family
            {"child": children[2], "first_name": "Tanya", "last_name": "Williams", "relationship_type": "mother", "phone": "(510) 555-0891", "safe_contact": False, "notes": "TPR completed. No contact ordered."},
            {"child": children[2], "first_name": "Robert", "last_name": "Williams", "relationship_type": "father", "phone": None, "safe_contact": False, "notes": "Unknown whereabouts. TPR completed."},
            {"child": children[2], "first_name": "Gloria", "last_name": "Williams", "relationship_type": "grandmother", "phone": "(510) 555-0892", "safe_contact": True, "notes": "Paternal grandmother. Visits monthly."},
            # Liam Thompson's family
            {"child": children[3], "first_name": "Sarah", "last_name": "Thompson", "relationship_type": "mother", "phone": "(925) 555-0267", "safe_contact": True, "notes": "Currently incarcerated. Expected release in 8 months."},
            {"child": children[3], "first_name": "Mark", "last_name": "Thompson", "relationship_type": "father", "phone": "(925) 555-0268", "safe_contact": True, "notes": "Out-of-state. Sends letters weekly."},
            # Sofia Nguyen's family
            {"child": children[4], "first_name": "Linh", "last_name": "Nguyen", "relationship_type": "mother", "phone": "(408) 555-0155", "safe_contact": True, "notes": "Cooperating with services. Language barrier — interpreter needed."},
            {"child": children[4], "first_name": "David", "last_name": "Nguyen", "relationship_type": "father", "phone": None, "safe_contact": False, "notes": "Deported. No current contact."},
            {"child": children[4], "first_name": "Mai", "last_name": "Tran", "relationship_type": "grandmother", "phone": "(408) 555-0156", "safe_contact": True, "notes": "Maternal grandmother. Primary support. Speaks Vietnamese only."},
            # Jordan Davis's family
            {"child": children[5], "first_name": "Crystal", "last_name": "Davis", "relationship_type": "mother", "phone": None, "safe_contact": False, "notes": "Abandoned child at age 8. TPR completed."},
            {"child": children[5], "first_name": "James", "last_name": "Davis", "relationship_type": "uncle", "phone": "(510) 555-0734", "safe_contact": True, "notes": "Paternal uncle. Visits quarterly. Potential guardianship resource."},
        ]
        for fd in family_data:
            child = fd.pop("child")
            db.add(FamilyMember(child_id=child.id, **fd))

        # ── Notifications ──
        notif_data = [
            # Jessica Hawkins (u1)
            {"user": u1, "title": "High Risk Alert: Maya Johnson", "message": "Risk score for Maya Johnson (AC-2025-0142) has increased to 78%. Behavioral escalation flag triggered.", "notification_type": "alert", "related_case": cases[0], "days_ago": 0},
            {"user": u1, "title": "Court Hearing Reminder", "message": "Court hearing for Maya Johnson (AC-2025-0142) is scheduled for March 15, 2026. Permanency report due.", "notification_type": "reminder", "related_case": cases[0], "days_ago": 1},
            {"user": u1, "title": "New Flag: Permanency Delay", "message": "Critical permanency delay flag added for Aisha Williams (AC-2024-0891). 30 months in care with no adoptive placement.", "notification_type": "flag", "related_case": cases[2], "days_ago": 2},
            {"user": u1, "title": "Case Update: Ethan Rodriguez", "message": "Medical appointment completed. All vitals normal. Next appointment in 3 months.", "notification_type": "info", "related_case": cases[1], "days_ago": 3},
            {"user": u1, "title": "Monthly Report Available", "message": "Your monthly caseload report for February 2026 is now available in Reports.", "notification_type": "system", "days_ago": 5},
            {"user": u1, "title": "Shared Note from Maria Garcia", "message": "Foster parent Maria Garcia left a new note on Ethan Rodriguez's case regarding medication schedule.", "notification_type": "info", "related_case": cases[1], "days_ago": 1},
            # James Chen (u2) — supervisor
            {"user": u2, "title": "Team Alert: High Caseload", "message": "Jessica Hawkins has 7 active cases with 3 flagged. Consider reassignment.", "notification_type": "alert", "days_ago": 0},
            {"user": u2, "title": "Weekly Team Summary", "message": "Team performance: 18 active cases, 8 flagged cases, average risk score 0.54. Review recommended.", "notification_type": "system", "days_ago": 2},
            {"user": u2, "title": "Critical Case: Aisha Williams", "message": "Case AC-2024-0891 has been flagged critical. Permanency delay — 30 months in care.", "notification_type": "alert", "related_case": cases[2], "days_ago": 1},
            # Maria Garcia (u3) — foster parent
            {"user": u3, "title": "Upcoming Visit: Ethan Rodriguez", "message": "Home visit by Jessica Hawkins scheduled for March 16, 2026 at 2:00 PM.", "notification_type": "reminder", "related_case": cases[1], "days_ago": 0},
            {"user": u3, "title": "New Message from Worker", "message": "Jessica Hawkins sent you a message about Liam Thompson's school report.", "notification_type": "info", "related_case": cases[3], "days_ago": 1},
            {"user": u3, "title": "Document Uploaded", "message": "Medical exam report for Emma Martinez has been uploaded to the case file.", "notification_type": "info", "related_case": cases[6], "days_ago": 3},
            # Jordan Davis (u4) — aged out youth
            {"user": u4, "title": "New Resource Available", "message": "Independent living skills workshop available on March 20, 2026. Sign up in Resources.", "notification_type": "info", "days_ago": 1},
            {"user": u4, "title": "Document Ready", "message": "Your education records have been uploaded and are available in My Documents.", "notification_type": "system", "days_ago": 4},
        ]
        for nd in notif_data:
            user = nd.pop("user")
            related = nd.pop("related_case", None)
            days = nd.pop("days_ago")
            is_read = days > 2
            db.add(Notification(
                user_id=user.id,
                related_case_id=related.id if related else None,
                is_read=is_read,
                created_at=now - timedelta(days=days),
                **nd,
            ))

        # ── Shared Notes (Foster Parent ↔ Worker) ──
        shared_notes_data = [
            # Ethan Rodriguez case (cases[1]) — Maria Garcia + Jessica Hawkins
            {"case": cases[1], "author": u3, "content": "Ethan had a great week! He's been sleeping through the night consistently. His appetite has improved and he's eating vegetables now. Soccer practice is going well — coach says he's one of the most enthusiastic kids on the team.", "days_ago": 1, "pinned": True},
            {"case": cases[1], "author": u1, "content": "That's wonderful to hear, Maria! I'll note the sleep improvement in the progress report. Can you confirm he's been taking his allergy medication daily? The doctor mentioned it at the last appointment.", "days_ago": 1},
            {"case": cases[1], "author": u3, "content": "Yes, he takes it every morning with breakfast. No allergic reactions this month. I also wanted to mention — he asked about his sister Emma again. Would it be possible to arrange a sibling visit?", "days_ago": 0},
            # Liam Thompson case (cases[3]) — Maria Garcia + Jessica Hawkins
            {"case": cases[3], "author": u1, "content": "Hi Maria, just a heads up — Liam's mother Sarah may be calling this weekend. She has approved phone privileges on Saturdays between 10am-12pm. Please document the call duration.", "days_ago": 3},
            {"case": cases[3], "author": u3, "content": "Got it, thank you Jessica. Liam seems excited about talking to his mom. He drew her a picture at school. Also — he had a small tantrum yesterday at bedtime but calmed down after I read him a story.", "days_ago": 2},
            {"case": cases[3], "author": u1, "content": "The tantrum is noted. If they become more frequent, let me know and we can explore behavioral support. Has he been adjusting well to the new preschool?", "days_ago": 2},
            {"case": cases[3], "author": u3, "content": "Preschool is going great! His teacher says he's made two friends already and loves circle time. He's the youngest in his class but keeping up well.", "days_ago": 1, "pinned": True},
            # Emma Martinez case (cases[6]) — Maria Garcia + Priya Patel (u5)
            {"case": cases[6], "author": u3, "content": "Emma had her pediatric checkup today. Doctor says she's in good health but slightly underweight. They recommended increasing protein in her diet. I'll start adding more eggs and chicken.", "days_ago": 4},
            {"case": cases[6], "author": u5, "content": "Thank you for the update, Maria. I'll add this to her medical file. Has she been having any issues with the new daycare?", "days_ago": 3},
            {"case": cases[6], "author": u3, "content": "She cried the first two days but now loves it. She especially likes the art station. She drew a picture of our family (including our cat!) which the teacher put on the wall. She seems much happier.", "days_ago": 2},
        ]
        for snd in shared_notes_data:
            case = snd.pop("case")
            author = snd.pop("author")
            days = snd.pop("days_ago")
            pinned = snd.pop("pinned", False)
            db.add(SharedNote(
                case_id=case.id, author_id=author.id,
                content=snd["content"], is_pinned=pinned,
                created_at=now - timedelta(days=days),
            ))

        await db.commit()
        print("✅ Database seeded with demo data.")
