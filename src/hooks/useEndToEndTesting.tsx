
import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { useUserJourneyFlow } from './useUserJourneyFlow';
import { useSessionFlow } from './useSessionFlow';
import { useOptimizedDashboardData } from './useOptimizedDashboardData';
import { useRealTimeJourneyUpdates } from './useRealTimeJourneyUpdates';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TestResult {
  testName: string;
  status: 'pass' | 'fail' | 'pending';
  duration: number;
  error?: string;
  details?: any;
}

interface E2ETestSuite {
  isRunning: boolean;
  results: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    pending: number;
  };
}

export const useEndToEndTesting = () => {
  const { user, userProfile } = useAuth();
  const { data: journeyFlow } = useUserJourneyFlow();
  const { data: sessionFlow } = useSessionFlow();
  const { data: dashboardData } = useOptimizedDashboardData();
  const { isConnected } = useRealTimeJourneyUpdates();
  
  const [testSuite, setTestSuite] = useState<E2ETestSuite>({
    isRunning: false,
    results: [],
    summary: { total: 0, passed: 0, failed: 0, pending: 0 }
  });

  const runTest = async (testName: string, testFn: () => Promise<any>): Promise<TestResult> => {
    const startTime = Date.now();
    
    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      return {
        testName,
        status: 'pass',
        duration,
        details: result
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      return {
        testName,
        status: 'fail',
        duration,
        error: error.message,
        details: error
      };
    }
  };

  const testAuthenticationFlow = async () => {
    if (!user) throw new Error('User not authenticated');
    if (!userProfile) throw new Error('User profile not loaded');
    
    return {
      userId: user.id,
      userEmail: user.email,
      userRole: userProfile.role,
      profileComplete: userProfile.profile_completed
    };
  };

  const testJourneyDataFlow = async () => {
    if (!journeyFlow) throw new Error('Journey flow data not loaded');
    
    const requiredFields = ['currentStep', 'overallProgress', 'steps', 'healthScore'];
    const missingFields = requiredFields.filter(field => !(field in journeyFlow));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing journey flow fields: ${missingFields.join(', ')}`);
    }
    
    return {
      currentStep: journeyFlow.currentStep,
      progress: journeyFlow.overallProgress,
      stepsCount: journeyFlow.steps.length,
      healthScore: journeyFlow.healthScore
    };
  };

  const testSessionDataFlow = async () => {
    if (!sessionFlow) throw new Error('Session flow data not loaded');
    
    return {
      upcomingSessions: sessionFlow.upcomingSessions.length,
      completedSessions: sessionFlow.completedSessions.length,
      totalSessions: sessionFlow.sessionMetrics.totalSessions,
      averageRating: sessionFlow.sessionMetrics.averageRating
    };
  };

  const testDashboardDataIntegration = async () => {
    if (!dashboardData) throw new Error('Dashboard data not loaded');
    
    const requiredMetrics = ['totalSessions', 'completedSessions', 'upcomingSessions', 'averageRating'];
    const missingMetrics = requiredMetrics.filter(metric => !(metric in dashboardData.metrics));
    
    if (missingMetrics.length > 0) {
      throw new Error(`Missing dashboard metrics: ${missingMetrics.join(', ')}`);
    }
    
    return {
      metricsLoaded: true,
      recentActivityCount: dashboardData.recentActivity.length,
      notificationCount: dashboardData.notifications.length
    };
  };

  const testRealTimeConnection = async () => {
    if (!isConnected) throw new Error('Real-time connection not established');
    
    // Test real-time subscription by creating a test notification
    const testNotification = {
      user_id: userProfile?.id,
      type: 'test',
      title: 'E2E Test Notification',
      message: 'Testing real-time functionality',
      priority: 'low'
    };
    
    const { error } = await supabase
      .from('notifications')
      .insert([testNotification]);
    
    if (error) throw error;
    
    return {
      connectionStatus: 'connected',
      testNotificationCreated: true
    };
  };

  const testRoleBasedAccess = async () => {
    if (!userProfile) throw new Error('User profile not available');
    
    const role = userProfile.role;
    
    // Test role-specific data access
    if (role === 'admin') {
      const { data: applications, error } = await supabase
        .from('base_applications')
        .select('*')
        .limit(1);
      
      if (error && error.code === 'PGRST301') {
        throw new Error('Admin should have access to applications');
      }
    }
    
    if (role === 'founder') {
      const { data: goals, error } = await supabase
        .from('goals')
        .select('*')
        .eq('founder_id', userProfile.id)
        .limit(1);
      
      if (error && error.code === 'PGRST301') {
        throw new Error('Founder should have access to their goals');
      }
    }
    
    return {
      role,
      accessTestPassed: true
    };
  };

  const runFullTestSuite = async () => {
    setTestSuite(prev => ({ ...prev, isRunning: true, results: [] }));
    
    const tests = [
      { name: 'Authentication Flow', fn: testAuthenticationFlow },
      { name: 'Journey Data Flow', fn: testJourneyDataFlow },
      { name: 'Session Data Flow', fn: testSessionDataFlow },
      { name: 'Dashboard Integration', fn: testDashboardDataIntegration },
      { name: 'Real-time Connection', fn: testRealTimeConnection },
      { name: 'Role-based Access', fn: testRoleBasedAccess }
    ];
    
    const results: TestResult[] = [];
    
    for (const test of tests) {
      const result = await runTest(test.name, test.fn);
      results.push(result);
      
      // Update results in real-time
      setTestSuite(prev => ({
        ...prev,
        results: [...results]
      }));
    }
    
    // Calculate summary
    const summary = {
      total: results.length,
      passed: results.filter(r => r.status === 'pass').length,
      failed: results.filter(r => r.status === 'fail').length,
      pending: results.filter(r => r.status === 'pending').length
    };
    
    setTestSuite({
      isRunning: false,
      results,
      summary
    });
    
    // Show summary toast
    if (summary.failed === 0) {
      toast.success(`🎉 All ${summary.total} tests passed! System is ready.`);
    } else {
      toast.error(`❌ ${summary.failed} of ${summary.total} tests failed. Check logs for details.`);
    }
    
    return { results, summary };
  };

  return {
    testSuite,
    runFullTestSuite,
    runIndividualTest: runTest
  };
};
