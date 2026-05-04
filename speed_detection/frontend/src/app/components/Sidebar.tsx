import { Link, useLocation } from 'react-router';
import { 
  LayoutDashboard, 
  Receipt, 
  User, 
  BarChart3, 
  LogOut,
  Shield,
  Search,
  Car
} from 'lucide-react';

interface SidebarProps {
  role?: 'driver' | 'official';
}

export function Sidebar({ role = 'driver' }: SidebarProps) {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const userLinks = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/statistics', icon: BarChart3, label: 'Statistics' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  const adminLinks = [
    { path: '/admin', icon: LayoutDashboard, label: 'Overview' },
    { path: '/admin/violations', icon: Receipt, label: 'Violations' },
    { path: '/admin/tracking', icon: Search, label: 'Vehicle Tracking' },
  ];

  const links = role === 'official' ? adminLinks : userLinks;

  return (
    <div className="w-64 bg-[#312E81] text-white h-screen fixed left-0 top-0 flex flex-col">
      <div className="p-6 border-b border-[#4338CA]">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-[#F59E0B]" />
          <div>
            <h1 className="text-xl font-bold">RoadEye</h1>
            <p className="text-xs text-indigo-200">AI Monitoring System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    active
                      ? 'bg-[#6366F1] text-white'
                      : 'text-indigo-200 hover:bg-[#4338CA] hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{link.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-[#4338CA]">
        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-indigo-200 hover:bg-[#4338CA] hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </Link>
      </div>
    </div>
  );
}
