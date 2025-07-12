
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSecurity } from '@/hooks/useSecurityContext';
import { LoadingState } from '@/components/ui/loading-state';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { userRole, loading: roleLoading } = useSecurity();

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user) {
        navigate('/login');
        return;
      }

      // Redirect to appropriate dashboard based on role
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
  }, [user, userRole, authLoading, roleLoading, navigate]);

  if (authLoading || roleLoading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  return null;
};

export default Dashboard;
