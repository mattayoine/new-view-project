
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRealTimeMatching } from '@/hooks/useRealTimeMatching';
import RealTimeDashboard from '@/components/dashboard/RealTimeDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MessageSquare, Target, FileText, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user, userProfile } = useAuth();
  
  // Initialize real-time matching
  useRealTimeMatching();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please sign in to continue</h2>
          <Link to="/auth">
            <Button>Go to Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: 'Schedule Session',
      description: 'Book a new advisory session',
      icon: Calendar,
      href: '/sessions/new',
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200'
    },
    {
      title: 'View Matches',
      description: 'Explore recommended matches',
      icon: Users,
      href: userProfile?.role === 'founder' ? '/matches' : '/founders',
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200'
    },
    {
      title: 'Messages',
      description: 'Check your conversations',
      icon: MessageSquare,
      href: '/messages',
      color: 'bg-green-50 hover:bg-green-100 border-green-200'
    },
    {
      title: 'Resources',
      description: 'Access helpful materials',
      icon: FileText,
      href: '/resources',
      color: 'bg-orange-50 hover:bg-orange-100 border-orange-200'
    }
  ];

  // Add Goals for founders
  if (userProfile?.role === 'founder') {
    quickActions.splice(2, 0, {
      title: 'My Goals',
      description: 'Track your progress',
      icon: Target,
      href: '/goals',
      color: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200'
    });
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back{userProfile?.profile_data?.name ? `, ${userProfile.profile_data.name}` : ''}!
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your {userProfile?.role === 'founder' ? 'startup journey' : 'advisory activities'} today.
        </p>
      </div>

      {/* Real-time Metrics Dashboard */}
      <RealTimeDashboard />

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {quickActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <Link key={action.title} to={action.href}>
                <Card className={`${action.color} transition-colors cursor-pointer h-full`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <IconComponent className="w-4 h-4" />
                      {action.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-gray-600">
                      {action.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Role-specific sections */}
      {userProfile?.role === 'founder' && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Your Startup Journey
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Track your progress, connect with advisors, and achieve your goals.
              </p>
              <div className="flex gap-3">
                <Link to="/matches">
                  <Button variant="outline" size="sm">
                    Find Advisors
                  </Button>
                </Link>
                <Link to="/goals">
                  <Button variant="outline" size="sm">
                    Set Goals
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {userProfile?.role === 'advisor' && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Your Mentoring Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Support founders, share your expertise, and make a difference.
              </p>
              <div className="flex gap-3">
                <Link to="/founders">
                  <Button variant="outline" size="sm">
                    View Founders
                  </Button>
                </Link>
                <Link to="/sessions">
                  <Button variant="outline" size="sm">
                    Manage Sessions
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
