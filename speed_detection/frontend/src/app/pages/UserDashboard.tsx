import { useState } from 'react';
import { Link } from 'react-router';
import { Sidebar } from '../components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Receipt, AlertTriangle, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { mockViolations, mockUser } from '../data/mockData';

export default function UserDashboard() {
  const unpaidViolations = mockViolations.filter(v => v.status === 'unpaid');
  const paidViolations = mockViolations.filter(v => v.status === 'paid');
  const allUserViolations = mockViolations;

  const totalFines = mockViolations.length;
  const unpaidAmount = unpaidViolations.reduce((sum, v) => sum + v.amount, 0);
  const latestViolation = mockViolations[0];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'unpaid':
        return <Badge className="bg-[#DC2626] text-white hover:bg-[#DC2626]">Unpaid</Badge>;
      case 'paid':
        return <Badge className="bg-[#16A34A] text-white hover:bg-[#16A34A]">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-[#F59E0B] text-white hover:bg-[#F59E0B]">Pending</Badge>;
      default:
        return null;
    }
  };

  const ViolationTable = ({ violations }: { violations: typeof mockViolations }) => (
    <Table>
      <TableHeader>
        <TableRow className="bg-slate-50">
          <TableHead className="font-bold text-[#0F172A]">Violation ID</TableHead>
          <TableHead className="font-bold text-[#0F172A]">Date</TableHead>
          <TableHead className="font-bold text-[#0F172A]">Route</TableHead>
          <TableHead className="font-bold text-[#0F172A]">Speed</TableHead>
          <TableHead className="font-bold text-[#0F172A]">Amount</TableHead>
          <TableHead className="font-bold text-[#0F172A]">Status</TableHead>
          <TableHead className="font-bold text-[#0F172A]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {violations.map((violation) => (
          <TableRow key={violation.id} className="hover:bg-slate-50">
            <TableCell className="font-semibold text-[#6366F1]">{violation.id}</TableCell>
            <TableCell>{violation.date}</TableCell>
            <TableCell>
              <div className="text-sm">
                <div className="font-medium">{violation.entryToll}</div>
                <div className="text-slate-500">→ {violation.exitToll}</div>
              </div>
            </TableCell>
            <TableCell>
              <span className="font-semibold text-[#DC2626]">{violation.averageSpeed} km/h</span>
            </TableCell>
            <TableCell>
              <span className="font-semibold text-[#F59E0B]">${violation.amount}</span>
            </TableCell>
            <TableCell>{getStatusBadge(violation.status)}</TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Link to={`/violation/${violation.id}`}>
                  <Button size="sm" variant="outline" className="border-[#6366F1] text-[#6366F1] hover:bg-[#6366F1] hover:text-white">
                    View
                  </Button>
                </Link>
                {violation.status === 'unpaid' && (
                  <Link to={`/payment/${violation.id}`}>
                    <Button size="sm" className="bg-[#312E81] hover:bg-[#4338CA] text-white">
                      Pay
                    </Button>
                  </Link>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar role={mockUser.role} />
      
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Dashboard</h1>
            <p className="text-slate-600">Welcome back, {mockUser.name}</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  Total Violations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div className="text-4xl font-bold text-[#0F172A]">{totalFines}</div>
                  <AlertTriangle className="w-8 h-8 text-[#DC2626]" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Unpaid Amount
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div className="text-4xl font-bold text-[#F59E0B]">${unpaidAmount}</div>
                  <Clock className="w-8 h-8 text-[#F59E0B]" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Latest Violation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-2xl font-bold text-[#0F172A]">{latestViolation.id}</div>
                    <div className="text-sm text-slate-600">{latestViolation.date}</div>
                  </div>
                  {getStatusBadge(latestViolation.status)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Violations Table with Tabs */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-2xl text-[#0F172A]">My Violations</CardTitle>
              <CardDescription>View and manage your traffic violations</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="unpaid" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger 
                    value="unpaid" 
                    className="data-[state=active]:bg-[#6366F1] data-[state=active]:text-white"
                  >
                    Unpaid ({unpaidViolations.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="paid"
                    className="data-[state=active]:bg-[#6366F1] data-[state=active]:text-white"
                  >
                    Paid ({paidViolations.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="all"
                    className="data-[state=active]:bg-[#6366F1] data-[state=active]:text-white"
                  >
                    All History ({allUserViolations.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="unpaid">
                  <ViolationTable violations={unpaidViolations} />
                </TabsContent>

                <TabsContent value="paid">
                  <ViolationTable violations={paidViolations} />
                </TabsContent>

                <TabsContent value="all">
                  <ViolationTable violations={allUserViolations} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
