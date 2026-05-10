import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Sidebar } from '../components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Receipt, AlertTriangle, Clock, DollarSign } from 'lucide-react';
import { getFines } from '../api/tolls';
import { mapFineToViolation, summarizeViolations, Violation } from '../api/mappers';
import { useAuth } from '../auth/AuthContext';
import { toast } from 'sonner';

export default function UserDashboard() {
  const { user } = useAuth();
  const uiRole = user?.role === 'official' || user?.role === 'admin' ? 'official' : 'driver';
  const [violations, setViolations] = useState<Violation[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const fines = await getFines();
        setViolations(fines.map(mapFineToViolation));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load fines.';
        toast.error(message);
      }
    };
    load();
  }, []);

  const summary = useMemo(() => summarizeViolations(violations), [violations]);
  const unpaidViolations = useMemo(() => violations.filter((v) => v.status === 'unpaid'), [violations]);
  const paidViolations = useMemo(() => violations.filter((v) => v.status === 'paid'), [violations]);
  const latestViolation = violations[0];

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

  const ViolationTable = ({ violations }: { violations: Violation[] }) => (
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
            <TableCell className="font-semibold text-[#6366F1]">{violation.referenceNumber}</TableCell>
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
      <Sidebar role={uiRole} />

      <div className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Dashboard</h1>
            <p className="text-slate-600">Welcome back, {user?.first_name || user?.email || 'Driver'}</p>
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
                  <div className="text-4xl font-bold text-[#0F172A]">{summary.total}</div>
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
                  <div className="text-4xl font-bold text-[#F59E0B]">${summary.unpaidAmount.toFixed(2)}</div>
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
                    <div className="text-2xl font-bold text-[#0F172A]">{latestViolation?.referenceNumber ?? '—'}</div>
                    <div className="text-sm text-slate-600">{latestViolation?.date ?? ''}</div>
                  </div>
                  {latestViolation ? getStatusBadge(latestViolation.status) : null}
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
                    All History ({violations.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="unpaid">
                  <ViolationTable violations={unpaidViolations} />
                </TabsContent>

                <TabsContent value="paid">
                  <ViolationTable violations={paidViolations} />
                </TabsContent>

                <TabsContent value="all">
                  <ViolationTable violations={violations} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
