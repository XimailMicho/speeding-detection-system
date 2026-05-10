import type { ApiFine } from './tolls';

export interface Violation {
  id: number;
  referenceNumber: string;
  plateNumber: string;
  entryToll: string;
  exitToll: string;
  entryTime: string;
  exitTime: string;
  distance: number;
  actualTime: number;
  minimumTime: number;
  averageSpeed: number;
  speedLimit: number;
  amount: number;
  status: 'unpaid' | 'paid' | 'pending';
  date: string;
  entryImage: string;
  exitImage: string;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : date.toLocaleDateString();
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : date.toLocaleString();
}

function mapStatus(status: ApiFine['status']): Violation['status'] {
  if (status === 'paid') {
    return 'paid';
  }
  if (status === 'unpaid') {
    return 'unpaid';
  }
  return 'pending';
}

export function mapFineToViolation(fine: ApiFine): Violation {
  const traversal = fine.traversal;
  const entryCapture = traversal.entry_capture;
  const exitCapture = traversal.exit_capture;
  const expectedSeconds = traversal.expected_duration_seconds ?? 0;
  const observedSeconds = traversal.observed_duration_seconds ?? 0;
  const averageSpeed = traversal.average_speed_kph ?? 0;
  const speedLimit = traversal.speed_limit_kph ?? traversal.connection.speed_limit_kph;

  return {
    id: fine.id,
    referenceNumber: fine.reference_number,
    plateNumber: fine.vehicle.license_plate,
    entryToll: entryCapture.toll.name,
    exitToll: exitCapture.toll.name,
    entryTime: entryCapture.captured_at,
    exitTime: exitCapture.captured_at,
    distance: traversal.connection.distance_km,
    actualTime: Math.max(1, Math.round(observedSeconds / 60)),
    minimumTime: Math.max(1, Math.round(expectedSeconds / 60)),
    averageSpeed: Math.round(averageSpeed),
    speedLimit: Math.round(speedLimit || 0),
    amount: Number.parseFloat(fine.amount_due || fine.base_amount),
    status: mapStatus(fine.status),
    date: formatDate(fine.issued_at),
    entryImage: '',
    exitImage: '',
  };
}

export function summarizeViolations(violations: Violation[]) {
  const unpaid = violations.filter((item) => item.status === 'unpaid');
  const paid = violations.filter((item) => item.status === 'paid');
  const pending = violations.filter((item) => item.status === 'pending');
  return {
    total: violations.length,
    unpaidCount: unpaid.length,
    paidCount: paid.length,
    pendingCount: pending.length,
    unpaidAmount: unpaid.reduce((sum, item) => sum + item.amount, 0),
    paidAmount: paid.reduce((sum, item) => sum + item.amount, 0),
  };
}
