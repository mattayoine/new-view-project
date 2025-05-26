
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, DollarSign, Clock, TrendingUp, Shield } from "lucide-react";

const ApplySME = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">C</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">CoPilot</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-gray-700 hover:text-blue-600 transition-colors">Home</Link>
              <Link to="/apply-copilot" className="text-gray-700 hover:text-blue-600 transition-colors">For CoPilots</Link>
              <Button variant="outline" size="sm">Login</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-6 bg-blue-100 text-blue-800 hover:bg-blue-100">
            For African SMEs
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Unlock a Global Growth Coach—
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Pay Only From Success
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Get matched with proven Diaspora operators who turn expertise into your competitive advantage.
          </p>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">What You Get</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 border-blue-100 hover:border-blue-300 transition-colors">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Strategy that works</h3>
                <p className="text-gray-600">
                  Your CoPilot has scaled the exact playbook and knows what works in your market.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-100 hover:border-green-300 transition-colors">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Foreign-market access</h3>
                <p className="text-gray-600">
                  Doors to buyers, certifications, and funding opportunities you couldn't reach alone.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-100 hover:border-purple-300 transition-colors">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Credibility</h3>
                <p className="text-gray-600">
                  Audited numbers plus a Diaspora adviser on deck when pitching buyers and lenders.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Cost Structure */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-green-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Investment Structure</h2>
          
          <Card className="bg-white shadow-xl">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl text-gray-900">Simple, Success-Based Pricing</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <Clock className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">First 90 days: FREE</h3>
                    <p className="text-gray-600">Prove the fit with no upfront costs. Cancel anytime before day 90.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">After 90 days: Choose your model</h3>
                    <ul className="text-gray-600 space-y-1">
                      <li>• <strong>2–3% revenue share</strong> (12 months)</li>
                      <li>• <strong>OR 3–5% phantom equity</strong></li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <Shield className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Trust subscription: $49/month</h3>
                    <p className="text-gray-600">Covers audits, KPI tracking tools, and escrow services.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Onboarding Process */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Onboarding in 4 Clicks</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center border-2 border-gray-100 hover:border-blue-300 transition-colors">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  1
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Create account & KYC</h3>
                <p className="text-sm text-gray-600">Quick verification to ensure trust and compliance</p>
              </CardContent>
            </Card>

            <Card className="text-center border-2 border-gray-100 hover:border-green-300 transition-colors">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  2
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Upload revenue data</h3>
                <p className="text-sm text-gray-600">Last 12 months or projections if pre-export</p>
              </CardContent>
            </Card>

            <Card className="text-center border-2 border-gray-100 hover:border-purple-300 transition-colors">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  3
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Pick growth KPIs</h3>
                <p className="text-sm text-gray-600">Choose two key metrics to track progress</p>
              </CardContent>
            </Card>

            <Card className="text-center border-2 border-gray-100 hover:border-orange-300 transition-colors">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-orange-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  4
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Get matched & kickoff</h3>
                <p className="text-sm text-gray-600">Meet your CoPilot and schedule first session</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-3">What if we don't click?</h3>
                <p className="text-gray-600">Cancel before day 90—no strings attached. We want perfect matches, not forced relationships.</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Who pays for audits?</h3>
                <p className="text-gray-600">SMEs cover audit costs via the $49/month trust subscription, ensuring transparency for all parties.</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-3">How do I know my CoPilot is qualified?</h3>
                <p className="text-gray-600">All CoPilots go through background checks and must demonstrate relevant sector experience and track records.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-green-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Scale with Expert Guidance?</h2>
          <p className="text-xl text-blue-100 mb-8">Join African businesses already growing with their CoPilots</p>
          <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-12 py-4 rounded-full text-lg font-semibold">
            Start My Application
            <ArrowRight className="ml-3 h-6 w-6" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <Link to="/" className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">C</span>
              </div>
              <span className="text-2xl font-bold">CoPilot</span>
            </Link>
            <p className="text-gray-400 mb-6">The Diaspora–Africa Growth Bridge</p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              <span>Backed by PwC-certified auditors</span>
              <span>•</span>
              <span>Licensed Mauritius escrow</span>
              <span>•</span>
              <span>GDPR-compliant</span>
              <span>•</span>
              <span>ISO-27001 infra</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ApplySME;
