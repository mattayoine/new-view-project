
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const PendingApproval = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Application Under Review
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Thank you for your application! Your submission is currently being reviewed by our team.
          </p>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <Mail className="h-5 w-5 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-blue-800">
              You'll receive an email at <strong>{user?.email}</strong> once your application has been processed.
            </p>
          </div>

          <div className="text-sm text-gray-500">
            <p>This typically takes 1-2 business days.</p>
            <p className="mt-2">Questions? Contact us at support@copilot.com</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingApproval;
