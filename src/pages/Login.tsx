
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSecurity } from '@/hooks/useSecurityContext';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { user } = useAuth();
  const { userRole } = useSecurity();
  const navigate = useNavigate();

  // Redirect if already logged in
  React.useEffect(() => {
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
        default:
          navigate('/');
      }
    }
  }, [user, userRole, navigate]);

  const cleanupAuthState = () => {
    // Clear all auth-related storage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Clean up any existing auth state
      cleanupAuthState();
      
      // Attempt to sign out any existing session
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
        console.log('Signout cleanup failed, continuing...');
      }

      console.log('Attempting login for:', email);
      
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (loginError) {
        console.error('Login error:', loginError);
        
        // Check if it's a user not found error - redirect to application forms
        if (loginError.message.includes('Invalid login credentials') || 
            loginError.message.includes('User not found')) {
          setError('No account found with these credentials. Please apply below if you\'re new.');
          return;
        }
        
        setError(loginError.message);
        return;
      }

      if (data.user) {
        console.log('Login successful for user:', data.user.email);
        
        // Check if user has a role in the system
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role, status, profile_completed')
          .eq('auth_id', data.user.id)
          .single();

        if (userError || !userData) {
          // User exists in auth but not in our system - redirect to application
          setError('Please complete your application to access the platform.');
          return;
        }

        // ADMIN BYPASS LOGIC: If user is admin, let them in regardless of profile completion
        if (userData.role === 'admin') {
          console.log('Admin user detected, bypassing application flow');
          navigate('/admin-dashboard');
          return;
        }

        // For non-admin users, check status and profile completion
        if (userData.status !== 'active') {
          navigate('/pending-approval');
          return;
        }

        // Redirect to appropriate dashboard based on role
        switch (userData.role) {
          case 'founder':
            navigate('/founder-dashboard');
            break;
          case 'advisor':
            navigate('/advisor-dashboard');
            break;
          default:
            navigate('/');
        }
      }
    } catch (err: any) {
      console.error('Login exception:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
          <p className="text-gray-600 text-center">
            Enter your credentials to access your dashboard
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm">
            <p className="text-gray-600 mb-4">
              Don't have an account? Apply below:
            </p>
            <div className="space-y-2">
              <Link to="/" state={{ selectedRole: 'founder' }} className="block">
                <Button variant="outline" className="w-full">
                  Apply as Founder
                </Button>
              </Link>
              <Link to="/" state={{ selectedRole: 'advisor' }} className="block">
                <Button variant="outline" className="w-full">
                  Apply as Advisor
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
