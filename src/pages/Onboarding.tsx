
import { ArrowRight, Users, Target, MessageSquare, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSecurity } from "@/hooks/useSecurityContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Onboarding = () => {
  const { user, loading: authLoading } = useAuth();
  const { userRole, loading: roleLoading } = useSecurity();
  const navigate = useNavigate();

  // Redirect authenticated users to their dashboards
  useEffect(() => {
    if (!authLoading && !roleLoading && user && userRole) {
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
        default:
          // User exists but no role - redirect to pending approval
          navigate('/pending-approval');
      }
    }
  }, [user, userRole, authLoading, roleLoading, navigate]);

  // Show loading while checking auth state
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: Users,
      title: "Expert Matching",
      description: "Get paired with seasoned advisors who understand your industry and challenges."
    },
    {
      icon: Target,
      title: "Goal Setting",
      description: "Define clear objectives and track your progress with structured milestones."
    },
    {
      icon: Calendar,
      title: "Flexible Sessions",
      description: "Schedule 1-on-1 sessions that fit your timeline and business needs."
    },
    {
      icon: MessageSquare,
      title: "Ongoing Support",
      description: "Stay connected with your advisor through our integrated messaging system."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="text-xl font-bold text-gray-900">CoPilot</span>
          </div>
          <div className="space-x-4">
            <Link to="/login">
              <Button variant="outline">Sign In</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="px-6 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Navigate Your Startup Journey with
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent"> Expert Guidance</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Connect with experienced advisors who've been where you are. Get personalized mentorship, 
            strategic insights, and practical guidance to accelerate your startup's growth.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/apply-copilot">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg">
                Apply as Founder
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/apply-sme">
              <Button size="lg" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 px-8 py-3 text-lg">
                Become an Advisor
              </Button>
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
            <p className="text-gray-600 mb-6">
              Join our community of successful founders and expert advisors. 
              Applications are reviewed within 24-48 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/apply-copilot">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Start Your Application
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline">
                  Already Have an Account?
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Onboarding;
