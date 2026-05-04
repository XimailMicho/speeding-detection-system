// Mock data for the traffic monitoring system

export interface Violation {
  id: string;
  plateNumber: string;
  entryToll: string;
  exitToll: string;
  entryTime: string;
  exitTime: string;
  distance: number; // km
  actualTime: number; // minutes
  minimumTime: number; // minutes
  averageSpeed: number; // km/h
  speedLimit: number; // km/h
  amount: number;
  status: 'unpaid' | 'paid' | 'pending';
  date: string;
  entryImage: string;
  exitImage: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'driver' | 'official';
  licensePlates: string[];
}

export interface Vehicle {
  plateNumber: string;
  owner: string;
  registrationDate: string;
}

export interface TollStation {
  id: string;
  name: string;
  code: string;
  lat: number;
  lng: number;
}

export const tollStations: TollStation[] = [
  { id: '1', name: 'North Gateway Toll', code: 'NGT', lat: 40.7580, lng: -73.9855 },
  { id: '2', name: 'East Bridge Plaza', code: 'EBP', lat: 40.7489, lng: -73.9680 },
  { id: '3', name: 'South Valley Toll', code: 'SVT', lat: 40.7282, lng: -73.9942 },
  { id: '4', name: 'West Highway Toll', code: 'WHT', lat: 40.7589, lng: -74.0060 },
  { id: '5', name: 'Central Station Toll', code: 'CST', lat: 40.7614, lng: -73.9776 },
];

export const mockViolations: Violation[] = [
  {
    id: 'V-2026-001',
    plateNumber: 'ABC-1234',
    entryToll: 'North Gateway Toll',
    exitToll: 'South Valley Toll',
    entryTime: '2026-03-25 08:15:00',
    exitTime: '2026-03-25 08:35:00',
    distance: 45,
    actualTime: 20,
    minimumTime: 30,
    averageSpeed: 135,
    speedLimit: 90,
    amount: 250,
    status: 'unpaid',
    date: '2026-03-25',
    entryImage: 'https://images.unsplash.com/photo-1768123134291-bf7896a5ea0c?w=400',
    exitImage: 'https://images.unsplash.com/photo-1768123134291-bf7896a5ea0c?w=400',
  },
  {
    id: 'V-2026-002',
    plateNumber: 'ABC-1234',
    entryToll: 'East Bridge Plaza',
    exitToll: 'West Highway Toll',
    entryTime: '2026-03-20 14:20:00',
    exitTime: '2026-03-20 14:50:00',
    distance: 52,
    actualTime: 30,
    minimumTime: 40,
    averageSpeed: 104,
    speedLimit: 90,
    amount: 180,
    status: 'paid',
    date: '2026-03-20',
    entryImage: 'https://images.unsplash.com/photo-1768123134291-bf7896a5ea0c?w=400',
    exitImage: 'https://images.unsplash.com/photo-1768123134291-bf7896a5ea0c?w=400',
  },
  {
    id: 'V-2026-003',
    plateNumber: 'XYZ-5678',
    entryToll: 'Central Station Toll',
    exitToll: 'East Bridge Plaza',
    entryTime: '2026-03-18 10:00:00',
    exitTime: '2026-03-18 10:18:00',
    distance: 38,
    actualTime: 18,
    minimumTime: 28,
    averageSpeed: 126,
    speedLimit: 90,
    amount: 220,
    status: 'pending',
    date: '2026-03-18',
    entryImage: 'https://images.unsplash.com/photo-1768123134291-bf7896a5ea0c?w=400',
    exitImage: 'https://images.unsplash.com/photo-1768123134291-bf7896a5ea0c?w=400',
  },
  {
    id: 'V-2026-004',
    plateNumber: 'ABC-1234',
    entryToll: 'West Highway Toll',
    exitToll: 'North Gateway Toll',
    entryTime: '2026-03-15 16:45:00',
    exitTime: '2026-03-15 17:10:00',
    distance: 42,
    actualTime: 25,
    minimumTime: 32,
    averageSpeed: 100,
    speedLimit: 90,
    amount: 150,
    status: 'paid',
    date: '2026-03-15',
    entryImage: 'https://images.unsplash.com/photo-1768123134291-bf7896a5ea0c?w=400',
    exitImage: 'https://images.unsplash.com/photo-1768123134291-bf7896a5ea0c?w=400',
  },
  {
    id: 'V-2026-005',
    plateNumber: 'DEF-9012',
    entryToll: 'South Valley Toll',
    exitToll: 'Central Station Toll',
    entryTime: '2026-03-24 07:30:00',
    exitTime: '2026-03-24 07:52:00',
    distance: 48,
    actualTime: 22,
    minimumTime: 35,
    averageSpeed: 130,
    speedLimit: 90,
    amount: 280,
    status: 'unpaid',
    date: '2026-03-24',
    entryImage: 'https://images.unsplash.com/photo-1768123134291-bf7896a5ea0c?w=400',
    exitImage: 'https://images.unsplash.com/photo-1768123134291-bf7896a5ea0c?w=400',
  },
];

export const mockUser: User = {
  id: 'U-001',
  name: 'John Smith',
  email: 'john.smith@email.com',
  role: 'driver',
  licensePlates: ['ABC-1234', 'XYZ-5678'],
};

export const mockAdmin: User = {
  id: 'A-001',
  name: 'Sarah Johnson',
  email: 'sarah.johnson@transport.gov',
  role: 'official',
  licensePlates: [],
};

export const mockVehicles: Vehicle[] = [
  {
    plateNumber: 'ABC-1234',
    owner: 'John Smith',
    registrationDate: '2023-05-15',
  },
  {
    plateNumber: 'XYZ-5678',
    owner: 'John Smith',
    registrationDate: '2024-02-20',
  },
];

// Statistics data
export interface StatisticsData {
  totalViolations: number;
  unpaidAmount: number;
  paidAmount: number;
  pendingViolations: number;
  monthlyViolations: { id: string; month: string; count: number }[];
  violationsBySpeed: { id: string; range: string; count: number }[];
}

export const mockStatistics: StatisticsData = {
  totalViolations: 5,
  unpaidAmount: 530,
  paidAmount: 330,
  pendingViolations: 1,
  monthlyViolations: [
    { id: 'month-1', month: 'Jan', count: 2 },
    { id: 'month-2', month: 'Feb', count: 4 },
    { id: 'month-3', month: 'Mar', count: 5 },
  ],
  violationsBySpeed: [
    { id: 'speed-1', range: '90-100 km/h', count: 1 },
    { id: 'speed-2', range: '100-120 km/h', count: 2 },
    { id: 'speed-3', range: '120-140 km/h', count: 2 },
  ],
};

// Admin statistics
export interface AdminStatistics {
  totalViolations: number;
  dailyViolations: number;
  totalRevenue: number;
  pendingReview: number;
  todayRevenue: number;
  violationsByDay: { id: string; day: string; count: number }[];
  revenueByMonth: { id: string; month: string; amount: number }[];
}

export const mockAdminStatistics: AdminStatistics = {
  totalViolations: 1247,
  dailyViolations: 42,
  totalRevenue: 245680,
  pendingReview: 15,
  todayRevenue: 8400,
  violationsByDay: [
    { id: 'day-1', day: 'Mon', count: 35 },
    { id: 'day-2', day: 'Tue', count: 42 },
    { id: 'day-3', day: 'Wed', count: 38 },
    { id: 'day-4', day: 'Thu', count: 41 },
    { id: 'day-5', day: 'Fri', count: 48 },
    { id: 'day-6', day: 'Sat', count: 32 },
    { id: 'day-7', day: 'Sun', count: 28 },
  ],
  revenueByMonth: [
    { id: 'rev-1', month: 'Jan', amount: 78500 },
    { id: 'rev-2', month: 'Feb', amount: 82300 },
    { id: 'rev-3', month: 'Mar', amount: 84880 },
  ],
};