import { useEffect, useMemo, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Shield, AlertTriangle, DollarSign, TrendingUp, CheckCircle } from 'lucide-react';
import { getStatistics } from '../api/tolls';
import { useAuth } from '../auth/AuthContext';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const { user } = useAuth();
  const uiRole = user?.role === 'official' || user?.role === 'admin' ? 'official' : 'driver';
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getStatistics();
        setStats(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load statistics.';
        toast.error(message);
      }
    };
    load();
  }, []);

  const violationsByStatus = useMemo(() => {
    if (!stats?.violations_by_status) {
      return [];
    }
    return stats.violations_by_status.map((item: { status: string; count: number }) => ({
      status: item.status,
      count: item.count,
    }));
  }, [stats]);

  const revenueSeries = useMemo(() => {
    if (!stats?.total_revenue) {
      return [{ label: 'Total', amount: 0 }];
    }
    return [{ label: 'Total', amount: Number.parseFloat(stats.total_revenue) || 0 }];
  }, [stats]);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar role={uiRole} />

      <div className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-10 h-10 text-[#312E81]" />
              <div>
                <h1 className="text-3xl font-bold text-[#0F172A]">Admin Dashboard</h1>
                <p className="text-slate-600">System overview and monitoring</p>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2 text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  Total Violations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#0F172A]">{stats?.total_fines ?? 0}</div>
                <p className="text-xs text-slate-600 mt-1">All time</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2 text-xs">
                  <TrendingUp className="w-4 h-4 text-[#6366F1]" />
                  Today's Captures
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#6366F1]">{stats?.captures_today ?? 0}</div>
                <p className="text-xs text-[#16A34A] mt-1">Captures processed</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2 text-xs">
                  <DollarSign className="w-4 h-4 text-[#16A34A]" />
                  Total Revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#16A34A]">${Number.parseFloat(stats?.total_revenue ?? '0').toFixed(2)}</div>
                <p className="text-xs text-slate-600 mt-1">Collected fines</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2 text-xs">
                  <CheckCircle className="w-4 h-4 text-[#F59E0B]" />
                  Pending Appeals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#F59E0B]">{stats?.pending_appeals ?? 0}</div>
                <p className="text-xs text-slate-600 mt-1">Awaiting review</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2 text-xs">
                  <DollarSign className="w-4 h-4 text-[#F59E0B]" />
                  Paid Fines
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#F59E0B]">{stats?.paid_fines ?? 0}</div>
                <p className="text-xs text-slate-600 mt-1">Marked as paid</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#0F172A]">
                  <TrendingUp className="w-5 h-5 text-[#312E81]" />
                  Violations by Status
                </CardTitle>
                <CardDescription>Current counts by status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={violationsByStatus}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="status" stroke="#64748B" />
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
                      fill="#6366F1" 
                      name="Violations"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#0F172A]">
                  <DollarSign className="w-5 h-5 text-[#16A34A]" />
                  Revenue Snapshot
                </CardTitle>
                <CardDescription>Total revenue collected</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="label" stroke="#64748B" />
                    <YAxis stroke="#64748B" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#ffffff', 
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => `$${value.toLocaleString()}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#16A34A" 
                      strokeWidth={3}
                      name="Revenue"
                      dot={{ fill: '#16A34A', r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* System Status */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-[#0F172A]">System Status</CardTitle>
              <CardDescription>Current operational status of the monitoring system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-[#EFF6FF] rounded-lg border-2 border-[#6366F1]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-3 bg-[#16A34A] rounded-full animate-pulse"></div>
                    <h4 className="font-semibold text-[#0F172A]">OCR System</h4>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">Operating normally</p>
                  <p className="text-xs text-slate-500">Last check: 2 minutes ago</p>
                </div>

                <div className="p-6 bg-[#EFF6FF] rounded-lg border-2 border-[#6366F1]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-3 bg-[#16A34A] rounded-full animate-pulse"></div>
                    <h4 className="font-semibold text-[#0F172A]">AI Processing</h4>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">All systems operational</p>
                  <p className="text-xs text-slate-500">Processing: 12 violations</p>
                </div>

                <div className="p-6 bg-[#EFF6FF] rounded-lg border-2 border-[#6366F1]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-3 bg-[#16A34A] rounded-full animate-pulse"></div>
                    <h4 className="font-semibold text-[#0F172A]">Database</h4>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">Healthy</p>
                  <p className="text-xs text-slate-500">Response time: 45ms</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
