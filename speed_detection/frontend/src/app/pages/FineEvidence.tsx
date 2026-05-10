import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { Sidebar } from '../components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { ArrowLeft, Camera, Clock, MapPin, AlertTriangle, TrendingUp } from 'lucide-react';
import { getFine } from '../api/tolls';
import { mapFineToViolation, Violation } from '../api/mappers';
import { useAuth } from '../auth/AuthContext';
import { toast } from 'sonner';

export default function FineEvidence() {
  const { id } = useParams();
  const { user } = useAuth();
  const uiRole = user?.role === 'official' || user?.role === 'admin' ? 'official' : 'driver';
  const [violation, setViolation] = useState<Violation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const fine = await getFine(id);
        setViolation(mapFineToViolation(fine));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load violation.';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#F8FAFC]">
        <Sidebar role={uiRole} />
        <div className="flex-1 ml-64 p-8 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Loading violation...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (!violation) {
    return (
      <div className="flex min-h-screen bg-[#F8FAFC]">
        <Sidebar role={uiRole} />
        <div className="flex-1 ml-64 p-8 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Violation Not Found</h2>
            <Link to="/dashboard">
              <Button className="bg-[#312E81] hover:bg-[#4338CA] text-white mt-4">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'unpaid':
        return <Badge className="bg-[#DC2626] text-white hover:bg-[#DC2626] px-4 py-2 text-base">Unpaid</Badge>;
      case 'paid':
        return <Badge className="bg-[#16A34A] text-white hover:bg-[#16A34A] px-4 py-2 text-base">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-[#F59E0B] text-white hover:bg-[#F59E0B] px-4 py-2 text-base">Pending Review</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar role={uiRole} />

      <div className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Link to="/dashboard">
              <Button variant="ghost" className="text-[#6366F1] hover:text-[#312E81] -ml-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>

          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Violation Evidence</h1>
              <p className="text-slate-600">Violation ID: {violation.referenceNumber}</p>
            </div>
            {getStatusBadge(violation.status)}
          </div>

          {/* Violation Alert */}
          <Card className="mb-8 bg-[#FEF2F2] border-2 border-[#DC2626] shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#DC2626] rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-[#DC2626] mb-2">Speed Violation Detected</h3>
                  <p className="text-[#0F172A] mb-4">
                    Vehicle traveled between toll stations in {violation.actualTime} minutes, which is {violation.minimumTime - violation.actualTime} minutes 
                    faster than the minimum safe travel time of {violation.minimumTime} minutes.
                  </p>
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-sm text-slate-600">Average Speed</p>
                      <p className="text-2xl font-bold text-[#DC2626]">{violation.averageSpeed} km/h</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Speed Limit</p>
                      <p className="text-2xl font-bold text-[#0F172A]">{violation.speedLimit} km/h</p>
                    </div>
                    <div className="ml-auto">
                      <p className="text-sm text-slate-600">Fine Amount</p>
                      <p className="text-3xl font-bold text-[#F59E0B]">${violation.amount}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* License Plate Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#0F172A]">
                  <Camera className="w-5 h-5 text-[#312E81]" />
                  Entry Point Evidence
                </CardTitle>
                <CardDescription>{violation.entryToll}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-slate-200 rounded-lg overflow-hidden mb-4 flex items-center justify-center">
                  {violation.entryImage ? (
                    <img
                      src={violation.entryImage}
                      alt="Entry point license plate"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-slate-500">No entry image available</span>
                  )}
                </div>
                <div className="space-y-2 bg-slate-50 p-4 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-slate-600">License Plate:</span>
                    <span className="font-semibold text-[#0F172A]">{violation.plateNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Time:</span>
                    <span className="font-semibold text-[#0F172A]">{violation.entryTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Location:</span>
                    <span className="font-semibold text-[#0F172A]">{violation.entryToll}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#0F172A]">
                  <Camera className="w-5 h-5 text-[#312E81]" />
                  Exit Point Evidence
                </CardTitle>
                <CardDescription>{violation.exitToll}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-slate-200 rounded-lg overflow-hidden mb-4 flex items-center justify-center">
                  {violation.exitImage ? (
                    <img
                      src={violation.exitImage}
                      alt="Exit point license plate"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-slate-500">No exit image available</span>
                  )}
                </div>
                <div className="space-y-2 bg-slate-50 p-4 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-slate-600">License Plate:</span>
                    <span className="font-semibold text-[#0F172A]">{violation.plateNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Time:</span>
                    <span className="font-semibold text-[#0F172A]">{violation.exitTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Location:</span>
                    <span className="font-semibold text-[#0F172A]">{violation.exitToll}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Route Map */}
          <Card className="shadow-lg border-0 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#0F172A]">
                <MapPin className="w-5 h-5 text-[#312E81]" />
                Route Map
              </CardTitle>
              <CardDescription>Journey between toll stations</CardDescription>
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

          {/* Violation Details */}
          <Card className="shadow-lg border-0 mb-8">
            <CardHeader>
              <CardTitle className="text-[#0F172A]">Violation Details</CardTitle>
              <CardDescription>Complete information about this traffic violation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-[#312E81] mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-600">Route Distance</p>
                      <p className="text-xl font-semibold text-[#0F172A]">{violation.distance} km</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                    <Clock className="w-5 h-5 text-[#312E81] mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-600">Actual Travel Time</p>
                      <p className="text-xl font-semibold text-[#DC2626]">{violation.actualTime} minutes</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                    <Clock className="w-5 h-5 text-[#16A34A] mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-600">Minimum Safe Time</p>
                      <p className="text-xl font-semibold text-[#0F172A]">{violation.minimumTime} minutes</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-[#DC2626] mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-600">Average Speed</p>
                      <p className="text-xl font-semibold text-[#DC2626]">{violation.averageSpeed} km/h</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-[#312E81] mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-600">Speed Limit</p>
                      <p className="text-xl font-semibold text-[#0F172A]">{violation.speedLimit} km/h</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-[#FEF3C7] rounded-lg border-2 border-[#F59E0B]">
                    <AlertTriangle className="w-5 h-5 text-[#F59E0B] mt-0.5" />
                    <div>
                      <p className="text-sm text-[#92400E]">Fine Amount</p>
                      <p className="text-3xl font-bold text-[#F59E0B]">${violation.amount}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {violation.status === 'unpaid' && (
            <div className="flex justify-end gap-4">
              <Link to="/dashboard">
                <Button variant="outline" size="lg" className="border-slate-300 text-slate-700">
                  Back to Dashboard
                </Button>
              </Link>
              <Link to={`/payment/${violation.id}`}>
                <Button size="lg" className="bg-[#312E81] hover:bg-[#4338CA] text-white">
                  Proceed to Payment
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
