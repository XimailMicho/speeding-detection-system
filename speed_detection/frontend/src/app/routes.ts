import { createBrowserRouter } from 'react-router';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import FineEvidence from './pages/FineEvidence';
import Payment from './pages/Payment';
import Profile from './pages/Profile';
import Statistics from './pages/Statistics';
import AdminDashboard from './pages/AdminDashboard';
import ViolationManagement from './pages/ViolationManagement';
import VehicleTracking from './pages/VehicleTracking';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Landing,
  },
  {
    path: '/login',
    Component: Login,
  },
  {
    path: '/register',
    Component: Register,
  },
  {
    path: '/dashboard',
    Component: UserDashboard,
  },
  {
    path: '/violation/:id',
    Component: FineEvidence,
  },
  {
    path: '/payment/:id',
    Component: Payment,
  },
  {
    path: '/profile',
    Component: Profile,
  },
  {
    path: '/statistics',
    Component: Statistics,
  },
  {
    path: '/admin',
    Component: AdminDashboard,
  },
  {
    path: '/admin/violations',
    Component: ViolationManagement,
  },
  {
    path: '/admin/tracking',
    Component: VehicleTracking,
  },
]);
