import { useEffect, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { User, Mail, Car, Calendar } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { getVehicles, ApiVehicle } from '../api/tolls';
import { toast } from 'sonner';

export default function Profile() {
  const { user } = useAuth();
  const uiRole = user?.role === 'official' || user?.role === 'admin' ? 'official' : 'driver';
  const [vehicles, setVehicles] = useState<ApiVehicle[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getVehicles();
        setVehicles(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load vehicles.';
        toast.error(message);
      }
    };
    load();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar role={uiRole} />

      <div className="flex-1 ml-64 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Profile</h1>
            <p className="text-slate-600">Manage your account information and registered vehicles</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#0F172A]">
                    <User className="w-5 h-5 text-[#312E81]" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>Your account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      defaultValue={`${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim()}
                      className="bg-white border-slate-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue={user?.email ?? ''}
                      className="bg-white border-slate-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Account Type</Label>
                    <Input
                      id="role"
                      defaultValue={user?.role === 'official' ? 'Official' : 'Driver'}
                      className="bg-white border-slate-300"
                      disabled
                    />
                  </div>

                  <Button className="bg-[#312E81] hover:bg-[#4338CA] text-white">
                    Save Changes
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#0F172A]">
                    <Car className="w-5 h-5 text-[#312E81]" />
                    Registered Vehicles
                  </CardTitle>
                  <CardDescription>Your vehicles monitored by the system</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {vehicles.map((vehicle) => (
                    <div key={vehicle.license_plate} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-[#312E81] rounded-lg flex items-center justify-center">
                            <Car className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-lg text-[#0F172A]">{vehicle.license_plate}</p>
                            <p className="text-sm text-slate-600">{user?.email ?? ''}</p>
                          </div>
                        </div>
                        <Badge className="bg-[#16A34A] text-white hover:bg-[#16A34A]">{vehicle.is_active ? 'Active' : 'Inactive'}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4" />
                        <span>Registered: {vehicle.registration_expires_at ? new Date(vehicle.registration_expires_at).toLocaleDateString() : '—'}</span>
                      </div>
                    </div>
                  ))}

                  <Button variant="outline" className="w-full border-[#6366F1] text-[#6366F1] hover:bg-[#6366F1] hover:text-white">
                    Add New Vehicle
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Account Summary */}
            <div>
              <Card className="shadow-lg border-0 sticky top-8">
                <CardHeader>
                  <CardTitle className="text-[#0F172A]">Account Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center p-6 bg-gradient-to-br from-[#312E81] to-[#6366F1] rounded-lg text-white">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-xl mb-1">{`${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() || user?.email}</h3>
                    <p className="text-indigo-200 text-sm">{user?.email}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <Mail className="w-5 h-5 text-[#312E81]" />
                      <div>
                        <p className="text-xs text-slate-600">Email</p>
                        <p className="font-semibold text-sm text-[#0F172A]">{user?.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <Car className="w-5 h-5 text-[#312E81]" />
                      <div>
                        <p className="text-xs text-slate-600">Vehicles</p>
                        <p className="font-semibold text-sm text-[#0F172A]">{vehicles.length} Registered</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <User className="w-5 h-5 text-[#312E81]" />
                      <div>
                        <p className="text-xs text-slate-600">Account Type</p>
                        <p className="font-semibold text-sm text-[#0F172A]">
                          {user?.role === 'official' ? 'Official' : 'Driver'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full border-[#DC2626] text-[#DC2626] hover:bg-[#DC2626] hover:text-white">
                    Change Password
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
