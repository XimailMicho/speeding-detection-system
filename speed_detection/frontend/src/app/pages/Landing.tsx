import { Link } from 'react-router';
import { Shield, Camera, Clock, MapPin, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] to-[#E0E7FF]">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-[#312E81]" />
            <div>
              <h1 className="text-2xl font-bold text-[#312E81]">RoadEye</h1>
              <p className="text-sm text-slate-600">AI-Powered Traffic Monitoring</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link to="/login">
              <Button variant="outline" className="border-[#312E81] text-[#312E81] hover:bg-[#312E81] hover:text-white">
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button className="bg-[#312E81] hover:bg-[#4338CA] text-white">
                Register
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block px-4 py-2 bg-[#FEF3C7] text-[#92400E] rounded-full mb-4">
              <span className="text-sm font-semibold">Government Authorized System</span>
            </div>
            <h2 className="text-5xl font-bold text-[#0F172A] mb-6 leading-tight">
              Advanced AI Traffic Monitoring System
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              Automated license plate recognition and speed violation detection between toll stations. 
              Ensuring road safety through cutting-edge OCR technology.
            </p>
            <div className="flex gap-4">
              <Link to="/register">
                <Button size="lg" className="bg-[#312E81] hover:bg-[#4338CA] text-white">
                  Get Started
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="border-[#312E81] text-[#312E81] hover:bg-[#312E81] hover:text-white">
                  Official Login
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-[#F8FAFC] rounded-lg">
                  <div className="w-12 h-12 bg-[#312E81] rounded-full flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-[#0F172A]">Entry: North Gateway Toll</p>
                    <p className="text-sm text-slate-600">08:15 AM</p>
                  </div>
                  <CheckCircle className="w-6 h-6 text-[#16A34A]" />
                </div>

                <div className="flex items-center justify-center">
                  <div className="h-16 w-px bg-slate-300"></div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-[#F8FAFC] rounded-lg">
                  <div className="w-12 h-12 bg-[#312E81] rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-[#0F172A]">AI Processing</p>
                    <p className="text-sm text-slate-600">Time & Speed Analysis</p>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <div className="h-16 w-px bg-slate-300"></div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-[#FEF2F2] rounded-lg border-2 border-[#DC2626]">
                  <div className="w-12 h-12 bg-[#DC2626] rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-[#DC2626]">Violation Detected</p>
                    <p className="text-sm text-slate-600">Exit: South Valley Toll - 08:35 AM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-[#0F172A] mb-4">How It Works</h3>
            <p className="text-xl text-slate-600">Advanced AI technology for accurate violation detection</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-[#312E81] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Camera className="w-10 h-10 text-white" />
              </div>
              <h4 className="text-xl font-bold text-[#0F172A] mb-3">OCR License Plate Recognition</h4>
              <p className="text-slate-600">
                AI-powered cameras capture and recognize license plates at entry and exit toll stations with 99.9% accuracy.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-[#6366F1] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Clock className="w-10 h-10 text-white" />
              </div>
              <h4 className="text-xl font-bold text-[#0F172A] mb-3">Time Calculation</h4>
              <p className="text-slate-600">
                System calculates travel time between tolls and compares it with minimum safe travel time based on distance.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-[#F59E0B] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-white" />
              </div>
              <h4 className="text-xl font-bold text-[#0F172A] mb-3">Violation Detection</h4>
              <p className="text-slate-600">
                If travel time is below minimum, system automatically generates violation with evidence and fine amount.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Map Preview */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h3 className="text-4xl font-bold text-[#0F172A] mb-4">Toll Station Network</h3>
          <p className="text-xl text-slate-600">Comprehensive monitoring across all major highways</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <iframe
            src="https://www.openstreetmap.org/export/embed.html?bbox=-74.02%2C40.71%2C-73.94%2C40.78&layer=mapnik"
            className="w-full h-[500px]"
            title="Toll Station Map"
          ></iframe>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#312E81] text-white py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-[#F59E0B]" />
            <h3 className="text-2xl font-bold">TrafficGuard</h3>
          </div>
          <p className="text-indigo-200 mb-2">Government-Level Traffic Monitoring System</p>
          <p className="text-sm text-indigo-300">© 2026 TrafficGuard. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
