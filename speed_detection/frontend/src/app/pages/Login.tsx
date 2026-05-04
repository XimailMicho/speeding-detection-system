import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Shield } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('driver');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'official') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] to-[#E0E7FF] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-12 h-12 text-[#312E81]" />
            <h1 className="text-3xl font-bold text-[#0F172A]">RoadEye</h1>
          </div>
          <p className="text-slate-600">AI-Powered Traffic Monitoring System</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-2xl text-[#0F172A]">Login</CardTitle>
            <CardDescription>Access your account to view violations and payments</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white border-slate-300"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white border-slate-300"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Login As</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger id="role" className="bg-white border-slate-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="driver">Driver</SelectItem>
                    <SelectItem value="official">Official</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-[#312E81] hover:bg-[#4338CA] text-white"
              >
                Login
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-[#6366F1] hover:text-[#312E81] font-semibold">
                  Register here
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
