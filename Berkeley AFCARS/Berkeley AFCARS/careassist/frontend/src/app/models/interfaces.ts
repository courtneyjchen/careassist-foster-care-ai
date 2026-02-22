export interface DashboardStats {
  active_cases: number;
  flagged_cases: number;
  pending_reviews: number;
  avg_permanency_months: number;
}

export interface FlaggedCaseSummary {
  case_id: number;
  case_number: string;
  child_name: string;
  priority_score: number;
  status: string;
  top_flag_type: string | null;
  top_flag_severity: string | null;
  flag_count: number;
}

export interface CaseSummary {
  id: number;
  case_number: string;
  child_name: string;
  priority_score: number;
  status: string;
  flag_count: number;
  placement_type: string | null;
  months_in_care: number;
}

export interface ChildInfo {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string | null;
  ethnicity: string | null;
  has_medical_needs: boolean;
  has_behavioral_needs: boolean;
  has_disability: boolean;
  prior_placements: number;
  prior_adoptions: number;
}

export interface CaseFlag {
  id: number;
  flag_type: string;
  severity: string;
  confidence: number;
  description: string | null;
  recommendation: string | null;
}

export type NoteType = 'general' | 'visit' | 'court' | 'medical' | 'behavioral' | 'placement';

export interface CaseNote {
  id: number;
  note_type: NoteType;
  content: string;
  created_at: string;
}

export interface CaseDetail {
  id: number;
  case_number: string;
  child: ChildInfo;
  priority_score: number;
  status: string;
  removal_reason: string | null;
  placement_type: string | null;
  has_parental_rights_terminated: boolean;
  permanency_goal: string | null;
  months_in_care: number;
  assigned_worker: string | null;
  flags: CaseFlag[];
  notes: CaseNote[];
}
