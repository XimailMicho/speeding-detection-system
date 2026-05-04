import { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Search, Filter, Eye, CheckCircle, XCircle } from 'lucide-react';
import { mockViolations, mockAdmin } from '../data/mockData';
import { toast } from 'sonner';

export default function ViolationManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [violations, setViolations] = useState(mockViolations);

  const filteredViolations = violations.filter((violation) => {
    const matchesSearch = 
      violation.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      violation.plateNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || violation.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = (id: string) => {
    setViolations(violations.map(v => 
      v.id === id ? { ...v, status: 'unpaid' as const } : v
    ));
    toast.success(`Violation ${id} approved`);
  };

  const handleReject = (id: string) => {
    setViolations(violations.filter(v => v.id !== id));
    toast.error(`Violation ${id} rejected`);
  };

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

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar role={mockAdmin.role} />
      
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Violation Management</h1>
            <p className="text-slate-600">Review and manage traffic violations</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-3">
                <CardDescription>Total Violations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#0F172A]">{violations.length}</div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader className="pb-3">
                <CardDescription>Pending Review</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#F59E0B]">
                  {violations.filter(v => v.status === 'pending').length}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader className="pb-3">
                <CardDescription>Unpaid</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#DC2626]">
                  {violations.filter(v => v.status === 'unpaid').length}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader className="pb-3">
                <CardDescription>Paid</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#16A34A]">
                  {violations.filter(v => v.status === 'paid').length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="shadow-lg border-0 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#0F172A]">
                <Filter className="w-5 h-5 text-[#312E81]" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <Input
                    placeholder="Search by ID or plate number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white border-slate-300"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-white border-slate-300">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Violations Table */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-[#0F172A]">All Violations</CardTitle>
              <CardDescription>
                Showing {filteredViolations.length} of {violations.length} violations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-bold text-[#0F172A]">ID</TableHead>
                    <TableHead className="font-bold text-[#0F172A]">Plate</TableHead>
                    <TableHead className="font-bold text-[#0F172A]">Date</TableHead>
                    <TableHead className="font-bold text-[#0F172A]">Route</TableHead>
                    <TableHead className="font-bold text-[#0F172A]">Speed</TableHead>
                    <TableHead className="font-bold text-[#0F172A]">Amount</TableHead>
                    <TableHead className="font-bold text-[#0F172A]">Status</TableHead>
                    <TableHead className="font-bold text-[#0F172A]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredViolations.map((violation) => (
                    <TableRow key={violation.id} className="hover:bg-slate-50">
                      <TableCell className="font-semibold text-[#6366F1]">{violation.id}</TableCell>
                      <TableCell>
                        <div className="font-semibold text-[#0F172A] bg-slate-100 px-3 py-1 rounded inline-block">
                          {violation.plateNumber}
                        </div>
                      </TableCell>
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
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-[#6366F1] text-[#6366F1] hover:bg-[#6366F1] hover:text-white"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {violation.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                className="bg-[#16A34A] hover:bg-[#15803D] text-white"
                                onClick={() => handleApprove(violation.id)}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                className="bg-[#DC2626] hover:bg-[#B91C1C] text-white"
                                onClick={() => handleReject(violation.id)}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
