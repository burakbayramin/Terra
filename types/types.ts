export type News = {
  id: string;
  title: string;
  snippet: string;
  content: string;
  image: string;
  created_at: string;
  category: string[];
  source: string;
  earthquake_id?: string | null;
};

export interface Earthquake {
  id: string;
  provider: string;
  title: string;
  date: string;
  mag: number;
  depth: number;
  longitude: number;
  latitude: number;
  region: string;
  faultline: string;
}

export interface EarthquakeStats {
  total_last_day: number;
  total_last_week: number;
  total_last_month: number;
  mag3_plus_last_day: number;
  mag3_plus_last_week: number;
  mag3_plus_last_month: number;
  mag4_plus_last_day: number;
  mag4_plus_last_week: number;
  mag4_plus_last_month: number;
  mag5_plus_last_day: number;
  mag5_plus_last_week: number;
  mag5_plus_last_month: number;
}

export interface City {
  id: number;
  name: string;
}

export interface District {
  id: number;
  name: string;
}

export interface Profile {
  id: string;
  updated_at: string | null;
  name: string | null;
  surname: string | null;
  city: string | null;
  district: string | null;
  created_at: string | null;
  emergency_phone: string | null;
  safety_score?: number | null;
  has_completed_safety_form: boolean;
}

export interface EarthquakeFeltReport {
  id: string;
  profile_id: string;
  earthquake_id: string;
  created_at: string;
}

export interface FeltReportStats {
  total_reports: number;
  user_has_reported: boolean;
}

// Network types based on the SQL schema
export interface Network {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  max_members: number;
  is_private: boolean;
  join_code: string | null;
  member_count?: number;
  creator_profile?: Profile;
}

export interface NetworkMember {
  id: string;
  network_id: string;
  user_id: string;
  role: "creator" | "member";
  joined_at: string;
  updated_at: string;
  is_active: boolean;
  invited_by: string | null;
  profile?: Profile;
  network?: Network;
}

export interface NetworkInvitation {
  id: string;
  network_id: string;
  inviter_id: string;
  invitee_id: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  created_at: string;
  responded_at: string | null;
  message: string | null;
  network?: Network;
  inviter_profile?: Profile;
  invitee_profile?: Profile;
}

export interface NetworkRequest {
  id: string;
  network_id: string;
  requester_id: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  message: string | null;
  network?: Network;
  requester_profile?: Profile;
  reviewer_profile?: Profile;
}
