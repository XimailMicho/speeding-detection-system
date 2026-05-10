import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Shield } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../auth/AuthContext';
import { createVehicle } from '../api/tolls';
import { toast } from 'sonner';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    licensePlate1: '',
    licensePlate2: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setIsSubmitting(true);
    try {
      const [firstName, ...lastNameParts] = formData.name.trim().split(' ');
      await register({
        email: formData.email,
        password: formData.password,
        first_name: firstName || '',
        last_name: lastNameParts.join(' '),
        role: 'driver',
      });

      const plates = [formData.licensePlate1, formData.licensePlate2]
        .map((plate) => plate.trim())
        .filter(Boolean);
      for (const plate of plates) {
        await createVehicle({ license_plate: plate.toUpperCase(), plate_country: 'MK' });
      }

      toast.success('Account created successfully.');
      navigate('/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] to-[#E0E7FF] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-12 h-12 text-[#312E81]" />
            <h1 className="text-3xl font-bold text-[#0F172A]">RoadEye</h1>
          </div>
          <p className="text-slate-600">Create your account to monitor violations</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-2xl text-[#0F172A]">Register</CardTitle>
            <CardDescription>Register your vehicles to receive violation notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="John Smith"
                    value={formData.name}
                    onChange={handleChange}
                    className="bg-white border-slate-300"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="bg-white border-slate-300"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                    className="bg-white border-slate-300"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="bg-white border-slate-300"
                    required
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 mt-6">
                <h4 className="font-semibold text-[#0F172A] mb-4">Register Your Vehicles</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="licensePlate1">License Plate 1</Label>
                    <Input
                      id="licensePlate1"
                      name="licensePlate1"
                      placeholder="ABC-1234"
                      value={formData.licensePlate1}
                      onChange={handleChange}
                      className="bg-white border-slate-300"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="licensePlate2">License Plate 2 (Optional)</Label>
                    <Input
                      id="licensePlate2"
                      name="licensePlate2"
                      placeholder="XYZ-5678"
                      value={formData.licensePlate2}
                      onChange={handleChange}
                      className="bg-white border-slate-300"
                    />
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-[#312E81] hover:bg-[#4338CA] text-white mt-6"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600">
                Already have an account?{' '}
                <Link to="/login" className="text-[#6366F1] hover:text-[#312E81] font-semibold">
                  Login here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link to="/">
            <Button variant="ghost" className="text-slate-600 hover:text-[#312E81]">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
