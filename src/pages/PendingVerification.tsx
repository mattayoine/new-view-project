
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { Mail, RefreshCw } from 'lucide-react';

const PendingVerification = () => {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const { resendVerification } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const email = location.state?.email || '';
  const userType = location.state?.userType || 'founder';
  const message = location.state?.message || 'Please verify your email address to continue.';

  const handleResendVerification = async () => {
    setResending(true);
    try {
      const { error } = await resendVerification();
      if (error) {
        console.error('Error resending verification:', error);
      } else {
        setResent(true);
      }
    } catch (error) {
      console.error('Error resending verification:', error);
    } finally {
      setResending(false);
    }
  };

  const handleProceedToApplication = () => {
    const applicationRoute = userType === 'founder' ? '/apply-tseer' : '/apply-sme';
    navigate(applicationRoute);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Mail className="text-white h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Check Your Email</h1>
          <p className="text-gray-600">We've sent you a verification link</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Email Verification Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                {message}
              </AlertDescription>
            </Alert>

            {email && (
              <p className="text-sm text-gray-600">
                We've sent a verification email to: <strong>{email}</strong>
              </p>
            )}

            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Please click the verification link in your email to activate your account.
              </p>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleResendVerification}
                  disabled={resending || resent}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${resending ? 'animate-spin' : ''}`} />
                  {resending ? 'Sending...' : resent ? 'Email Sent!' : 'Resend Verification Email'}
                </Button>

                <Button
                  onClick={handleProceedToApplication}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Proceed to Application (Verification Optional)
                </Button>
              </div>
            </div>

            <div className="mt-6 text-center text-sm">
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PendingVerification;
