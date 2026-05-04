import { Sidebar } from '../components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertTriangle, DollarSign, Calendar } from 'lucide-react';
import { mockStatistics, mockUser, mockViolations } from '../data/mockData';

export default function Statistics() {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar role={mockUser.role} />
      
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
                <div className="text-4xl font-bold text-[#0F172A]">{mockStatistics.totalViolations}</div>
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
                <div className="text-4xl font-bold text-[#F59E0B]">${mockStatistics.unpaidAmount}</div>
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
                <div className="text-4xl font-bold text-[#16A34A]">${mockStatistics.paidAmount}</div>
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
                <div className="text-4xl font-bold text-[#F59E0B]">{mockStatistics.pendingViolations}</div>
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
                  <LineChart data={mockStatistics.monthlyViolations}>
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
                  <BarChart data={mockStatistics.violationsBySpeed}>
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
                {mockViolations.slice(0, 5).map((violation) => (
                  <div key={violation.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#DC2626] rounded-lg flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#0F172A]">{violation.id}</p>
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
