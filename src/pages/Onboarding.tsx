
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Users, Target, TrendingUp, CheckCircle } from "lucide-react";
import NewFounderForm from "@/components/onboarding/NewFounderForm";
import NewAdvisorForm from "@/components/onboarding/NewAdvisorForm";

const Onboarding = () => {
  const [selectedType, setSelectedType] = useState<'founder' | 'advisor' | null>(null);

  const handleReset = () => {
    setSelectedType(null);
  };

  if (selectedType === 'founder') {
    return <NewFounderForm onBack={handleReset} />;
  }

  if (selectedType === 'advisor') {
    return <NewAdvisorForm onBack={handleReset} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50">
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
              <Button variant="outline" size="sm">Login</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-6 bg-gradient-to-r from-blue-100 to-green-100 text-gray-800 hover:from-blue-200 hover:to-green-200">
            Join the CoPilot Community
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Bridge African Innovation with 
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Global Expertise
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Whether you're a founder scaling your startup or a diaspora professional ready to give back, 
            join our community where growth meets impact.
          </p>
        </div>
      </section>

      {/* Selection Cards */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Founder Card */}
            <Card className="border-2 border-blue-100 hover:border-blue-300 transition-all duration-300 hover:shadow-xl cursor-pointer group">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl text-blue-600 mb-2">I'm a Founder</CardTitle>
                <p className="text-gray-600">Scale your African startup with proven diaspora expertise</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Get matched with experienced advisors</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Access to global markets and networks</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Success-based payment model</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">90-day free trial period</span>
                  </div>
                </div>
                <Button 
                  onClick={() => setSelectedType('founder')}
                  className="w-full bg-blue-600 hover:bg-blue-700 mt-6"
                >
                  Apply as Founder
                </Button>
              </CardContent>
            </Card>

            {/* Advisor Card */}
            <Card className="border-2 border-green-100 hover:border-green-300 transition-all duration-300 hover:shadow-xl cursor-pointer group">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl text-green-600 mb-2">I'm an Advisor</CardTitle>
                <p className="text-gray-600">Share your expertise and earn from African startup success</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">4 hours/month time commitment</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Revenue share or equity options</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Flexible virtual collaboration</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Recognition and impact badges</span>
                  </div>
                </div>
                <Button 
                  onClick={() => setSelectedType('advisor')}
                  className="w-full bg-green-600 hover:bg-green-700 mt-6"
                >
                  Apply as Advisor
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 bg-white/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Trusted by Leading Organizations</h2>
          <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-600">
            <span className="flex items-center">
              <Target className="h-4 w-4 mr-2 text-blue-600" />
              PwC-certified auditors
            </span>
            <span className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              Licensed Mauritius escrow
            </span>
            <span className="flex items-center">
              <Users className="h-4 w-4 mr-2 text-purple-600" />
              GDPR-compliant
            </span>
            <span className="flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-orange-600" />
              ISO-27001 infrastructure
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Onboarding;
