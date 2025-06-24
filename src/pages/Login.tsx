
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log('Attempting login for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error('Login error:', error);
        throw error;
      }

      if (!data.user) {
        throw new Error('No user returned from login');
      }

      console.log('Login successful for:', data.user.email);

      toast({
        title: "Success!",
        description: "Logged in successfully",
      });

      // Wait a moment for auth state to update, then redirect
      setTimeout(() => {
        // Get user role to determine redirect
        supabase
          .from('users')
          .select('role')
          .eq('auth_id', data.user.id)
          .single()
          .then(({ data: userData }) => {
            const userRole = userData?.role;
            console.log('Redirecting user with role:', userRole);

            if (userRole === 'founder') {
              navigate('/founder-dashboard');
            } else if (userRole === 'advisor') {
              navigate('/advisor-dashboard');
            } else if (userRole === 'admin') {
              navigate('/admin-dashboard');
            } else {
              navigate('/');
            }
          })
          .catch(() => {
            // If role fetch fails, redirect to home
            navigate('/');
          });
      }, 1000);

    } catch (error: any) {
      console.error('Login failed:', error);
      
      let errorMessage = "Login failed. Please try again.";
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = "Invalid email or password. Please check your credentials.";
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = "Please check your email and confirm your account before signing in.";
      } else if (error.message?.includes('Too many requests')) {
        errorMessage = "Too many login attempts. Please wait a moment and try again.";
      }
      
      toast({
        title: "Login Failed",
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
          <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your CoPilot dashboard</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
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
                  autoComplete="email"
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
                  autoComplete="current-password"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                  Sign up here
                </Link>
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Want to apply?{' '}
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
    </div>
  );
};

export default Login;
