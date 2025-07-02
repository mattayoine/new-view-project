import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userType, setUserType] = useState<'founder' | 'advisor'>('founder');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }
    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      // Clean up any existing auth state
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      await supabase.auth.signOut({
        scope: 'global'
      });

      // Create auth user without role metadata (prevents auto-access)
      const {
        data,
        error
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/pending-approval`
          // Deliberately NOT setting role metadata to prevent auto-access
        }
      });
      if (error) throw error;
      if (data.user) {
        toast({
          title: "Registration Successful!",
          description: "Please check your email to verify your account, then complete your application."
        });

        // Redirect to application form based on user type
        const applicationRoute = userType === 'founder' ? '/apply-copilot' : '/apply-sme';
        navigate(applicationRoute);
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      let errorMessage = "An error occurred during signup";
      if (error.message.includes('already registered')) {
        errorMessage = "An account with this email already exists";
      } else if (error.message.includes('Invalid email')) {
        errorMessage = "Please enter a valid email address";
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({
        title: "Signup Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center text-gray-600 hover:text-blue-600 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">T</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Join Tseer</h1>
          <p className="text-gray-600">Create your account and apply to join</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                After registration, you'll need to complete an application and await approval before accessing the platform.
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSignup} className="space-y-4">
              {/* User Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  I want to apply as a:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setUserType('founder')} className={`p-3 text-sm rounded-lg border ${userType === 'founder' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-300 text-gray-700'}`}>
                    Founder
                  </button>
                  <button type="button" onClick={() => setUserType('advisor')} className={`p-3 text-sm rounded-lg border ${userType === 'advisor' ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-gray-300 text-gray-700'}`}>
                    Advisor
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" disabled={loading} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <Input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" disabled={loading} minLength={6} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <Input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" disabled={loading} minLength={6} />
              </div>

              <Button type="submit" className={`w-full ${userType === 'founder' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`} disabled={loading}>
                {loading ? "Creating Account..." : `Continue as ${userType === 'founder' ? 'Founder' : 'Advisor'}`}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                  Sign in here
                </Link>
              </p>
              <p className="text-gray-600 mt-2">
                Want to apply directly?{' '}
                <Link to="/apply-copilot" className="text-blue-600 hover:text-blue-700 font-medium">
                  Apply as Founder
                </Link>
                {' or '}
                <Link to="/apply-sme" className="text-blue-600 hover:text-blue-700 font-medium">
                  Apply as Advisor
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default Signup;