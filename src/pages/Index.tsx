
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { CheckCircle, Clock, Users, Target, Shield, Calendar, Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSecurity } from "@/hooks/useSecurityContext";
import FounderForm from "@/components/onboarding/FounderForm";
import AdvisorForm from "@/components/onboarding/AdvisorForm";
import tseerLogoTransparent from "@/assets/tseer-logo-transparent.png";
import tseerLogoWhiteBg from "@/assets/tseer-logo-white-bg.png";
const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const {
    userRole
  } = useSecurity();
  const [selectedRole, setSelectedRole] = useState<'founder' | 'advisor' | null>(null);

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (user && userRole) {
      switch (userRole) {
        case 'founder':
          navigate('/founder-dashboard');
          break;
        case 'advisor':
          navigate('/advisor-dashboard');
          break;
        case 'admin':
          navigate('/admin-dashboard');
          break;
      }
    }
  }, [user, userRole, navigate]);

  // Handle role selection from location state (from login page links)
  useEffect(() => {
    if (location.state?.selectedRole) {
      setSelectedRole(location.state.selectedRole);
    }
  }, [location.state]);

  // If a role is selected, show the appropriate form
  if (selectedRole === 'founder') {
    return <FounderForm onBack={() => setSelectedRole(null)} />;
  }
  if (selectedRole === 'advisor') {
    return <AdvisorForm onBack={() => setSelectedRole(null)} />;
  }
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                <span className="font-bold text-xl text-slate-50">T</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">Tseer</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="outline" size="sm">Login</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-6 bg-green-100 text-green-800 hover:bg-green-100">
            Pilot Program Registration
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Join the 
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent"> Tseer Pilot Program</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">A 3-month advisory pilot connecting African founders with Diaspora experts</p>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Who This Is For</h2>
          
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="border-2 border-blue-100">
              <CardHeader>
                <CardTitle className="text-2xl text-blue-600 flex items-center">
                  <Users className="h-8 w-8 mr-3" />
                  Founders (Africa-based)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">You've launched your startup and are building traction</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">You're coachable and ready for outside perspective</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">You need help with strategy, pricing, product, or growth</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-100">
              <CardHeader>
                <CardTitle className="text-2xl text-green-600 flex items-center">
                  <Target className="h-8 w-8 mr-3" />
                  Diaspora Advisors (Worldwide)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">You're experienced in product, marketing, ops, finance, or growth</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">You've helped early-stage companies scale or raise</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">You can give 2–3 hours to directly help 1–2 founders</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* What You'll Get */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-green-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">What You'll Get</h2>
          
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-blue-600">For Founders</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">3 advisory sessions from curated Diaspora experts</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Access to 2 micro-masterclasses</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">A written growth plan & feature in final case deck</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-green-600">For Advisors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">A chance to shape promising African startups</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Exposure as part of a public impact pilot</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Private founder briefings to prep you for each session</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Timeline Summary</h2>
          
          <Card>
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Applications Close</span>
                    <span className="text-gray-600">[Insert Date]</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4">
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Matching + Orientation</span>
                    <span className="text-gray-600">[Insert Date]</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                    <Target className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1 flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Advisory Begins</span>
                    <span className="text-gray-600">[Insert Date]</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                    <Clock className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="flex-1 flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Masterclasses</span>
                    <span className="text-gray-600">[Insert Date Range]</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center mr-4">
                    <CheckCircle className="h-4 w-4 text-teal-600" />
                  </div>
                  <div className="flex-1 flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Case Study Launch</span>
                    <span className="text-gray-600">[Insert Date]</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Ready to Join?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Choose your role and start your application today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
            <Button size="lg" className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => setSelectedRole('founder')}>
              Apply as Founder
            </Button>
            <Button size="lg" variant="outline" className="flex-1 border-green-600 text-green-600 hover:bg-green-50" onClick={() => setSelectedRole('advisor')}>
              Apply as Advisor
            </Button>
          </div>
        </div>
      </section>

      {/* Quotes */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <blockquote className="text-xl italic text-gray-700">
              "We don't need more funding first—we need smarter decisions first."
            </blockquote>
            <blockquote className="text-xl italic text-gray-700">
              "Diaspora wisdom, applied surgically, can unlock stuck African ventures."
            </blockquote>
          </div>
        </div>
      </section>

      {/* Logo Downloads */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Download Tseer Logo</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="text-xl text-center">Transparent Background</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <div className="w-[400px] h-[400px] bg-gray-100 rounded-lg flex items-center justify-center p-8">
                  <img 
                    src={tseerLogoTransparent} 
                    alt="Tseer Logo - Transparent Background" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <a 
                  href={tseerLogoTransparent} 
                  download="tseer-logo-transparent.png"
                  className="w-full"
                >
                  <Button className="w-full" variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download PNG (1024x1024)
                  </Button>
                </a>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="text-xl text-center">White Background</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <div className="w-[400px] h-[400px] bg-white border border-gray-200 rounded-lg flex items-center justify-center p-8">
                  <img 
                    src={tseerLogoWhiteBg} 
                    alt="Tseer Logo - White Background" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <a 
                  href={tseerLogoWhiteBg} 
                  download="tseer-logo-white-bg.png"
                  className="w-full"
                >
                  <Button className="w-full" variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download PNG (1024x1024)
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer Trust Signals */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">T
              </span>
              </div>
              <span className="text-2xl font-bold">Tseer</span>
            </div>
            <div className="flex items-center justify-center mb-6">
              <Shield className="h-5 w-5 text-gray-400 mr-2" />
              <p className="text-gray-400">Trust Signals</p>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              <span>Confidentiality respected</span>
              <span>•</span>
              <span>No sales, no spam, no funding asks</span>
              <span>•</span>
              <span>Designed by an African founder, for African-led startups</span>
            </div>
          </div>
        </div>
      </footer>
    </div>;
};
export default Index;
