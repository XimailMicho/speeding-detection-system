import { Sidebar } from '../components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Shield, AlertTriangle, DollarSign, TrendingUp, CheckCircle } from 'lucide-react';
import { mockAdminStatistics, mockAdmin } from '../data/mockData';

export default function AdminDashboard() {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar role={mockAdmin.role} />
      
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
                <div className="text-3xl font-bold text-[#0F172A]">{mockAdminStatistics.totalViolations.toLocaleString()}</div>
                <p className="text-xs text-slate-600 mt-1">All time</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2 text-xs">
                  <TrendingUp className="w-4 h-4 text-[#6366F1]" />
                  Today's Violations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#6366F1]">{mockAdminStatistics.dailyViolations}</div>
                <p className="text-xs text-[#16A34A] mt-1">+12% from yesterday</p>
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
                <div className="text-3xl font-bold text-[#16A34A]">${mockAdminStatistics.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-slate-600 mt-1">Collected fines</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2 text-xs">
                  <CheckCircle className="w-4 h-4 text-[#F59E0B]" />
                  Pending Review
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#F59E0B]">{mockAdminStatistics.pendingReview}</div>
                <p className="text-xs text-slate-600 mt-1">Awaiting approval</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2 text-xs">
                  <DollarSign className="w-4 h-4 text-[#F59E0B]" />
                  Today's Revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#F59E0B]">${mockAdminStatistics.todayRevenue.toLocaleString()}</div>
                <p className="text-xs text-slate-600 mt-1">Collected today</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#0F172A]">
                  <TrendingUp className="w-5 h-5 text-[#312E81]" />
                  Weekly Violations
                </CardTitle>
                <CardDescription>Daily violation count for this week</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockAdminStatistics.violationsByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="day" stroke="#64748B" />
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
                  Monthly Revenue
                </CardTitle>
                <CardDescription>Revenue collected per month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockAdminStatistics.revenueByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="month" stroke="#64748B" />
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
