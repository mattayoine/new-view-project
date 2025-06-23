
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userType, setUserType] = useState<'founder' | 'advisor'>('founder');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Clean up any existing auth state
      await supabase.auth.signOut({ scope: 'global' });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            role: userType
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Create user profile entry
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            role: userType,
            status: 'active'
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Don't throw here as user is already created
        }

        toast({
          title: "Success!",
          description: "Account created successfully. Please check your email to verify your account.",
        });

        // Redirect to login page
        navigate('/login');
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
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center text-gray-600 hover:text-blue-600 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">C</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Join CoPilot</h1>
          <p className="text-gray-600">Create your account to get started</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              {/* User Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  I am a:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUserType('founder')}
                    className={`p-3 text-sm rounded-lg border ${
                      userType === 'founder'
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    Founder
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType('advisor')}
                    className={`p-3 text-sm rounded-lg border ${
                      userType === 'advisor'
                        ? 'bg-green-50 border-green-300 text-green-700'
                        : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    Advisor
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <Input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  minLength={6}
                />
              </div>

              <Button 
                type="submit" 
                className={`w-full ${
                  userType === 'founder' 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
                disabled={loading}
              >
                {loading ? "Creating Account..." : `Sign Up as ${userType === 'founder' ? 'Founder' : 'Advisor'}`}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
