import { apiFetch } from './client';

export interface ApiToll {
  id: number;
  name: string;
  code?: string | null;
  is_active: boolean;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface ApiConnection {
  id: number;
  from_toll: ApiToll;
  to_toll: ApiToll;
  distance_km: number;
  max_speed_kph?: number | null;
  speed_limit_kph: number;
  allowed_time_minutes: string;
  minimum_allowed_seconds: number;
}

export interface ApiCapture {
  id: number;
  toll: ApiToll;
  vehicle_id?: number | null;
  plate_text: string;
  captured_at: string;
}

export interface ApiVehicle {
  id: number;
  license_plate: string;
  plate_country: string;
  owner_id?: number | null;
  make?: string | null;
  model?: string | null;
  color?: string | null;
  registration_expires_at?: string | null;
  is_active: boolean;
}

export interface ApiTraversal {
  id: number;
  entry_capture: ApiCapture;
  exit_capture: ApiCapture;
  connection: ApiConnection;
  vehicle: ApiVehicle;
  observed_duration_seconds: number;
  expected_duration_seconds?: number | null;
  average_speed_kph?: number | null;
  speed_limit_kph?: number | null;
  speed_over_limit_kph?: number | null;
  is_speeding: boolean;
  fine_id?: number | null;
}

export interface ApiFine {
  id: number;
  reference_number: string;
  vehicle: ApiVehicle;
  driver_id?: number | null;
  traversal: ApiTraversal;
  base_amount: string;
  amount_due: string;
  discount_percent: number;
  discount_deadline: string;
  issued_at: string;
  status: 'unpaid' | 'paid' | 'appealed' | 'cancelled';
  notes?: string;
}

export interface ApiStatisticsAdmin {
  total_fines: number;
  unpaid_fines: number;
  paid_fines: number;
  appealed_fines: number;
  cancelled_fines: number;
  total_revenue: string;
  pending_appeals: number;
  captures_today: number;
  violations_by_status: Array<{ status: string; count: number }>;
  notifications: Array<{ channel: string; status: string; count: number }>;
}

export interface ApiStatisticsUser {
  total_fines: number;
  unpaid_fines: number;
  paid_fines: number;
  appealed_fines: number;
  amount_due: string;
}

export async function getFines(): Promise<ApiFine[]> {
  const payload = await apiFetch('/api/fines/');
  return payload.results as ApiFine[];
}

export async function getFine(fineId: string | number): Promise<ApiFine> {
  return apiFetch(`/api/fines/${fineId}/`);
}

export async function payFine(fineId: string | number) {
  return apiFetch(`/api/fines/${fineId}/pay/`, { method: 'POST', body: JSON.stringify({}) });
}

export async function getTraversals(): Promise<ApiTraversal[]> {
  const payload = await apiFetch('/api/traversals/');
  return payload.results as ApiTraversal[];
}

export async function getStatistics(): Promise<ApiStatisticsAdmin | ApiStatisticsUser> {
  return apiFetch('/api/statistics/');
}

export async function getVehicles(): Promise<ApiVehicle[]> {
  const payload = await apiFetch('/api/vehicles/');
  return payload.results as ApiVehicle[];
}

export async function createVehicle(data: { license_plate: string; plate_country?: string }) {
  return apiFetch('/api/vehicles/', {
    method: 'POST',
    body: JSON.stringify({
      license_plate: data.license_plate,
      plate_country: data.plate_country || 'MK',
    }),
  });
}

