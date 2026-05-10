import { useEffect, useMemo, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertTriangle, DollarSign, Calendar } from 'lucide-react';
import { getFines, getStatistics } from '../api/tolls';
import { mapFineToViolation, Violation } from '../api/mappers';
import { useAuth } from '../auth/AuthContext';
import { toast } from 'sonner';

export default function Statistics() {
  const { user } = useAuth();
  const uiRole = user?.role === 'official' || user?.role === 'admin' ? 'official' : 'driver';
  const [violations, setViolations] = useState<Violation[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [fines, statsData] = await Promise.all([getFines(), getStatistics()]);
        setViolations(fines.map(mapFineToViolation));
        setStats(statsData);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load statistics.';
        toast.error(message);
      }
    };
    load();
  }, []);

  const monthlyViolations = useMemo(() => {
    const buckets = new Map<string, number>();
    for (const violation of violations) {
      const date = new Date(violation.entryTime);
      if (Number.isNaN(date.valueOf())) {
        continue;
      }
      const label = date.toLocaleString('default', { month: 'short' });
      buckets.set(label, (buckets.get(label) || 0) + 1);
    }
    return Array.from(buckets.entries()).map(([month, count]) => ({ month, count }));
  }, [violations]);

  const violationsBySpeed = useMemo(() => {
    const ranges = [
      { label: '0-80 km/h', min: 0, max: 80 },
      { label: '80-100 km/h', min: 80, max: 100 },
      { label: '100-120 km/h', min: 100, max: 120 },
      { label: '120+ km/h', min: 120, max: Number.MAX_VALUE },
    ];
    return ranges.map((range) => ({
      range: range.label,
      count: violations.filter((v) => v.averageSpeed >= range.min && v.averageSpeed < range.max).length,
    }));
  }, [violations]);

  const unpaidAmount = Number.parseFloat(stats?.amount_due ?? '0');
  const paidAmount = violations.filter((v) => v.status === 'paid').reduce((sum, v) => sum + v.amount, 0);
  const pendingCount = violations.filter((v) => v.status === 'pending').length;

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar role={uiRole} />

      <div className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Personal Statistics</h1>
            <p className="text-slate-600">Overview of your traffic violations and trends</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
                  Total Violations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-[#0F172A]">{stats?.total_fines ?? violations.length}</div>
                <p className="text-sm text-slate-600 mt-1">All time</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#DC2626]" />
                  Unpaid Amount
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-[#F59E0B]">${unpaidAmount.toFixed(2)}</div>
                <p className="text-sm text-slate-600 mt-1">Outstanding</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#16A34A]" />
                  Paid Amount
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-[#16A34A]">${paidAmount.toFixed(2)}</div>
                <p className="text-sm text-slate-600 mt-1">Completed</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Pending Review
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-[#F59E0B]">{pendingCount}</div>
                <p className="text-sm text-slate-600 mt-1">Under review</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#0F172A]">
                  <TrendingUp className="w-5 h-5 text-[#312E81]" />
                  Monthly Violations Trend
                </CardTitle>
                <CardDescription>Number of violations per month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyViolations}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="month" stroke="#64748B" />
                    <YAxis stroke="#64748B" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#ffffff', 
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#6366F1" 
                      strokeWidth={3}
                      name="Violations"
                      dot={{ fill: '#6366F1', r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#0F172A]">
                  <TrendingUp className="w-5 h-5 text-[#312E81]" />
                  Violations by Speed Range
                </CardTitle>
                <CardDescription>Distribution of violations by speed</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={violationsBySpeed}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="range" stroke="#64748B" />
                    <YAxis stroke="#64748B" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#ffffff', 
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="count" 
                      fill="#DC2626" 
                      name="Violations"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Violations Table */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-[#0F172A]">Recent Violations</CardTitle>
              <CardDescription>Your last 5 traffic violations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {violations.slice(0, 5).map((violation) => (
                  <div key={violation.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#DC2626] rounded-lg flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#0F172A]">{violation.referenceNumber}</p>
                        <p className="text-sm text-slate-600">{violation.date} • {violation.entryToll} → {violation.exitToll}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#F59E0B] text-lg">${violation.amount}</p>
                      <p className="text-sm text-slate-600">{violation.averageSpeed} km/h</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
