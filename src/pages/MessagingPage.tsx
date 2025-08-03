
import React from 'react';
import { PageWrapper } from '@/components/common/PageWrapper';
import MessagingCenter from '@/components/messaging/MessagingCenter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const MessagingPage: React.FC = () => {
  const { userProfile } = useAuth();

  return (
    <PageWrapper>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
          <p className="text-gray-600">
            Communicate with your {userProfile?.role === 'founder' ? 'advisor' : 'founders'} and collaborate effectively
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Active Conversations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MessagingCenter />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
};

export default MessagingPage;
