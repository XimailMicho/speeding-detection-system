import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { Sidebar } from '../components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, CreditCard, CheckCircle2, AlertTriangle } from 'lucide-react';
import { mockViolations, mockUser } from '../data/mockData';
import { toast } from 'sonner';

export default function Payment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const violation = mockViolations.find(v => v.id === id);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });

  if (!violation) {
    return (
      <div className="flex min-h-screen bg-[#F8FAFC]">
        <Sidebar role={mockUser.role} />
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentSuccess(true);
    toast.success('Payment processed successfully!');
  };

  if (paymentSuccess) {
    return (
      <div className="flex min-h-screen bg-[#F8FAFC]">
        <Sidebar role={mockUser.role} />
        
        <div className="flex-1 ml-64 p-8">
          <div className="max-w-3xl mx-auto">
            <Card className="shadow-xl border-0 text-center py-12">
              <CardContent>
                <div className="w-20 h-20 bg-[#16A34A] rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-[#0F172A] mb-4">Payment Successful!</h2>
                <p className="text-lg text-slate-600 mb-2">
                  Your payment of <span className="font-bold text-[#F59E0B]">${violation.amount}</span> has been processed.
                </p>
                <p className="text-slate-600 mb-8">
                  Violation ID: <span className="font-semibold">{violation.id}</span>
                </p>
                
                <div className="bg-slate-50 rounded-lg p-6 mb-8 text-left max-w-md mx-auto">
                  <h3 className="font-semibold text-[#0F172A] mb-4">Payment Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Violation ID:</span>
                      <span className="font-semibold text-[#0F172A]">{violation.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Date:</span>
                      <span className="font-semibold text-[#0F172A]">{violation.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Route:</span>
                      <span className="font-semibold text-[#0F172A]">{violation.entryToll} → {violation.exitToll}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-300 pt-2 mt-2">
                      <span className="text-slate-600">Amount Paid:</span>
                      <span className="font-bold text-[#16A34A] text-lg">${violation.amount}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center gap-4">
                  <Button 
                    onClick={() => navigate('/dashboard')} 
                    className="bg-[#312E81] hover:bg-[#4338CA] text-white"
                  >
                    Back to Dashboard
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.print()}
                    className="border-[#6366F1] text-[#6366F1] hover:bg-[#6366F1] hover:text-white"
                  >
                    Print Receipt
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar role={mockUser.role} />
      
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <Link to={`/violation/${violation.id}`}>
              <Button variant="ghost" className="text-[#6366F1] hover:text-[#312E81] -ml-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Evidence
              </Button>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Payment</h1>
            <p className="text-slate-600">Complete your payment for violation {violation.id}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Payment Form */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#0F172A]">
                    <CreditCard className="w-5 h-5 text-[#312E81]" />
                    Payment Information
                  </CardTitle>
                  <CardDescription>Enter your payment details to complete the transaction</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input
                        id="cardNumber"
                        name="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={formData.cardNumber}
                        onChange={handleChange}
                        className="bg-white border-slate-300"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cardName">Cardholder Name</Label>
                      <Input
                        id="cardName"
                        name="cardName"
                        placeholder="John Smith"
                        value={formData.cardName}
                        onChange={handleChange}
                        className="bg-white border-slate-300"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiryDate">Expiry Date</Label>
                        <Input
                          id="expiryDate"
                          name="expiryDate"
                          placeholder="MM/YY"
                          value={formData.expiryDate}
                          onChange={handleChange}
                          className="bg-white border-slate-300"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          name="cvv"
                          placeholder="123"
                          value={formData.cvv}
                          onChange={handleChange}
                          className="bg-white border-slate-300"
                          maxLength={3}
                          required
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-[#312E81] hover:bg-[#4338CA] text-white"
                      size="lg"
                    >
                      Pay ${violation.amount}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="shadow-lg border-0 sticky top-8">
                <CardHeader>
                  <CardTitle className="text-[#0F172A]">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-[#FEF2F2] rounded-lg border border-[#DC2626]">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-[#DC2626]" />
                        <p className="font-semibold text-[#DC2626]">Violation Details</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">ID:</span>
                          <span className="font-semibold text-[#0F172A]">{violation.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Date:</span>
                          <span className="font-semibold text-[#0F172A]">{violation.date}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Plate:</span>
                          <span className="font-semibold text-[#0F172A]">{violation.plateNumber}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Route:</span>
                        <span className="font-semibold text-[#0F172A] text-right">
                          {violation.entryToll} → {violation.exitToll}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Distance:</span>
                        <span className="font-semibold text-[#0F172A]">{violation.distance} km</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Speed:</span>
                        <span className="font-semibold text-[#DC2626]">{violation.averageSpeed} km/h</span>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-600">Fine Amount:</span>
                        <span className="text-2xl font-bold text-[#F59E0B]">${violation.amount}</span>
                      </div>
                      <Badge className="bg-[#DC2626] text-white hover:bg-[#DC2626] w-full justify-center py-2">
                        Payment Required
                      </Badge>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600">
                    <p className="mb-2">
                      <strong>Note:</strong> Payment must be completed within 30 days to avoid additional penalties.
                    </p>
                    <p>
                      All transactions are secure and encrypted.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
