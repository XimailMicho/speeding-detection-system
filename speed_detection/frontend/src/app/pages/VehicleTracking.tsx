import { useEffect, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Search, Car, MapPin, Clock, TrendingUp } from 'lucide-react';
import { getFines } from '../api/tolls';
import { mapFineToViolation, Violation } from '../api/mappers';
import { useAuth } from '../auth/AuthContext';
import { toast } from 'sonner';

export default function VehicleTracking() {
  const { user } = useAuth();
  const uiRole = user?.role === 'official' || user?.role === 'admin' ? 'official' : 'driver';
  const [plateNumber, setPlateNumber] = useState('');
  const [searchResults, setSearchResults] = useState<Violation[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [violations, setViolations] = useState<Violation[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const fines = await getFines();
        setViolations(fines.map(mapFineToViolation));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load violations.';
        toast.error(message);
      }
    };
    load();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (plateNumber.trim()) {
      const normalized = plateNumber.toLowerCase().trim();
      const results = violations.filter(
        (v) => v.plateNumber.toLowerCase() === normalized
      );
      setSearchResults(results);
      setHasSearched(true);
    }
  };

  const totalViolations = searchResults.length;
  const totalFines = searchResults.reduce((sum, v) => sum + v.amount, 0);
  const avgSpeed = searchResults.length > 0 
    ? Math.round(searchResults.reduce((sum, v) => sum + v.averageSpeed, 0) / searchResults.length)
    : 0;

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar role={uiRole} />

      <div className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Vehicle Tracking</h1>
            <p className="text-slate-600">Track vehicle movement and violation history</p>
          </div>

          {/* Search Form */}
          <Card className="shadow-lg border-0 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#0F172A]">
                <Search className="w-5 h-5 text-[#312E81]" />
                Search Vehicle
              </CardTitle>
              <CardDescription>Enter a license plate number to view vehicle history</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="plateNumber" className="mb-2 block">License Plate Number</Label>
                  <Input
                    id="plateNumber"
                    placeholder="e.g., ABC-1234"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    className="bg-white border-slate-300"
                  />
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="bg-[#312E81] hover:bg-[#4338CA] text-white">
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {hasSearched && (
            <>
              {searchResults.length > 0 ? (
                <>
                  {/* Vehicle Info */}
                  <Card className="shadow-lg border-0 mb-8">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-[#0F172A]">
                        <Car className="w-5 h-5 text-[#312E81]" />
                        Vehicle Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-6 p-6 bg-gradient-to-br from-[#312E81] to-[#6366F1] rounded-lg text-white">
                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                          <Car className="w-10 h-10" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-3xl font-bold mb-2">{plateNumber.toUpperCase()}</h3>
                          <p className="text-indigo-200">Registered Vehicle</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="shadow-lg border-0">
                      <CardHeader className="pb-3">
                        <CardDescription className="flex items-center gap-2">
                          <Car className="w-4 h-4" />
                          Total Violations
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-bold text-[#DC2626]">{totalViolations}</div>
                        <p className="text-sm text-slate-600 mt-1">Recorded violations</p>
                      </CardContent>
                    </Card>

                    <Card className="shadow-lg border-0">
                      <CardHeader className="pb-3">
                        <CardDescription className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Average Speed
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-bold text-[#F59E0B]">{avgSpeed} km/h</div>
                        <p className="text-sm text-slate-600 mt-1">Across violations</p>
                      </CardContent>
                    </Card>

                    <Card className="shadow-lg border-0">
                      <CardHeader className="pb-3">
                        <CardDescription className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Total Fines
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-bold text-[#F59E0B]">${totalFines}</div>
                        <p className="text-sm text-slate-600 mt-1">All violations</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Movement History */}
                  <Card className="shadow-lg border-0 mb-8">
                    <CardHeader>
                      <CardTitle className="text-[#0F172A]">Movement Timeline</CardTitle>
                      <CardDescription>Chronological violation history</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50">
                            <TableHead className="font-bold text-[#0F172A]">Date & Time</TableHead>
                            <TableHead className="font-bold text-[#0F172A]">Entry Point</TableHead>
                            <TableHead className="font-bold text-[#0F172A]">Exit Point</TableHead>
                            <TableHead className="font-bold text-[#0F172A]">Distance</TableHead>
                            <TableHead className="font-bold text-[#0F172A]">Travel Time</TableHead>
                            <TableHead className="font-bold text-[#0F172A]">Speed</TableHead>
                            <TableHead className="font-bold text-[#0F172A]">Fine</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {searchResults.map((violation) => (
                            <TableRow key={violation.id} className="hover:bg-slate-50">
                              <TableCell>
                                <div>
                                  <div className="font-semibold text-[#0F172A]">{violation.date}</div>
                                  <div className="text-sm text-slate-600">{new Date(violation.entryTime).toLocaleTimeString()}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-[#16A34A]" />
                                  <span className="font-medium">{violation.entryToll}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-[#DC2626]" />
                                  <span className="font-medium">{violation.exitToll}</span>
                                </div>
                              </TableCell>
                              <TableCell>{violation.distance} km</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-slate-400" />
                                  <span className="font-semibold text-[#DC2626]">{violation.actualTime} min</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="font-bold text-[#DC2626]">{violation.averageSpeed} km/h</span>
                              </TableCell>
                              <TableCell>
                                <span className="font-bold text-[#F59E0B]">${violation.amount}</span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  {/* Map Visualization */}
                  <Card className="shadow-lg border-0">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-[#0F172A]">
                        <MapPin className="w-5 h-5 text-[#312E81]" />
                        Route Visualization
                      </CardTitle>
                      <CardDescription>Vehicle movement across toll stations</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-slate-200 rounded-lg overflow-hidden h-[400px]">
                        <iframe
                          src="https://www.openstreetmap.org/export/embed.html?bbox=-74.02%2C40.71%2C-73.94%2C40.78&layer=mapnik"
                          className="w-full h-full"
                          title="Route Map"
                        ></iframe>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="shadow-lg border-0">
                  <CardContent className="py-16 text-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Car className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-[#0F172A] mb-2">No Violations Found</h3>
                    <p className="text-slate-600">
                      No violation records found for plate number: <span className="font-semibold">{plateNumber.toUpperCase()}</span>
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {!hasSearched && (
            <Card className="shadow-lg border-0">
              <CardContent className="py-16 text-center">
                <div className="w-20 h-20 bg-[#EFF6FF] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-10 h-10 text-[#312E81]" />
                </div>
                <h3 className="text-xl font-bold text-[#0F172A] mb-2">Search for a Vehicle</h3>
                <p className="text-slate-600">Enter a license plate number above to view vehicle history and violations</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
