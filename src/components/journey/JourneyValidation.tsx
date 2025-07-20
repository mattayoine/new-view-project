import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  Database,
  Users,
  FileText,
  Calendar
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ValidationResult {
  step: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  data?: any;
}

export const JourneyValidation: React.FC = () => {
  const { user, userProfile } = useAuth();
  const queryClient = useQueryClient();
  const [isValidating, setIsValidating] = useState(false);

  const { data: validationResults, refetch: revalidate } = useQuery({
    queryKey: ['journey-validation', user?.id],
    queryFn: async (): Promise<ValidationResult[]> => {
      if (!user || !userProfile) {
        return [{
          step: 'authentication',
          status: 'fail',
          message: 'User not authenticated'
        }];
      }

      const results: ValidationResult[] = [];

      try {
        // Check application record
        const { data: application, error: appError } = await supabase
          .from('base_applications')
          .select('*')
          .eq('email', user.email)
          .single();

        if (appError || !application) {
          results.push({
            step: 'application',
            status: 'fail',
            message: 'No application record found',
            data: { error: appError?.message }
          });
        } else {
          results.push({
            step: 'application',
            status: application.status === 'approved' ? 'pass' : 'warning',
            message: `Application status: ${application.status}`,
            data: application
          });
        }

        // Check user profile completeness using the correct property name
        if (!userProfile.profile_completed) {
          results.push({
            step: 'profile',
            status: 'warning',
            message: 'User profile incomplete',
            data: userProfile
          });
        } else {
          results.push({
            step: 'profile',
            status: 'pass',
            message: 'Profile complete',
            data: userProfile
          });
        }

        // Check assignments (for non-admin users) using the correct property name
        if (userProfile.role !== 'admin') {
          const { data: assignments } = await supabase
            .from('advisor_founder_assignments')
            .select('*')
            .or(`advisor_id.eq.${userProfile.id},founder_id.eq.${userProfile.id}`)
            .eq('status', 'active');

          if (!assignments || assignments.length === 0) {
            results.push({
              step: 'assignments',
              status: 'warning',
              message: 'No active assignments found',
              data: { count: 0 }
            });
          } else {
            results.push({
              step: 'assignments',
              status: 'pass',
              message: `${assignments.length} active assignment(s)`,
              data: { count: assignments.length, assignments }
            });

            // Check sessions for assignments
            const assignmentIds = assignments.map(a => a.id);
            const { data: sessions } = await supabase
              .from('sessions')
              .select('*')
              .in('assignment_id', assignmentIds);

            results.push({
              step: 'sessions',
              status: sessions && sessions.length > 0 ? 'pass' : 'warning',
              message: `${sessions?.length || 0} session(s) found`,
              data: { count: sessions?.length || 0, sessions }
            });
          }
        }

        // Check data consistency
        const { data: userRecord } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', user.id)
          .single();

        if (!userRecord) {
          results.push({
            step: 'data_consistency',
            status: 'fail',
            message: 'User record missing in users table'
          });
        } else if (userRecord.email !== user.email) {
          results.push({
            step: 'data_consistency',
            status: 'warning',
            message: 'Email mismatch between auth and user record'
          });
        } else {
          results.push({
            step: 'data_consistency',
            status: 'pass',
            message: 'Data consistency validated'
          });
        }

      } catch (error: any) {
        results.push({
          step: 'validation_error',
          status: 'fail',
          message: `Validation error: ${error.message}`
        });
      }

      return results;
    },
    enabled: !!user && !!userProfile
  });

  const fixDataMutation = useMutation({
    mutationFn: async (step: string) => {
      setIsValidating(true);
      
      switch (step) {
        case 'profile':
          // Attempt to fix profile completeness using the correct property name
          const { error } = await supabase
            .from('users')
            .update({ profile_completed: true })
            .eq('auth_id', user?.id);
          
          if (error) throw error;
          break;

        case 'data_consistency':
          // Sync user data
          const { error: syncError } = await supabase
            .from('users')
            .update({ email: user?.email })
            .eq('auth_id', user?.id);
          
          if (syncError) throw syncError;
          break;

        default:
          throw new Error(`No fix available for step: ${step}`);
      }
    },
    onSuccess: () => {
      toast.success('Data issue fixed successfully');
      queryClient.invalidateQueries({ queryKey: ['journey-validation'] });
      queryClient.invalidateQueries({ queryKey: ['user-journey-flow'] });
      revalidate();
    },
    onError: (error: any) => {
      toast.error(`Failed to fix issue: ${error.message}`);
    },
    onSettled: () => {
      setIsValidating(false);
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'fail': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'fail': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const canFixStep = (step: string) => {
    return ['profile', 'data_consistency'].includes(step);
  };

  if (!validationResults) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const passCount = validationResults.filter(r => r.status === 'pass').length;
  const failCount = validationResults.filter(r => r.status === 'fail').length;
  const warningCount = validationResults.filter(r => r.status === 'warning').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Journey Validation
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => revalidate()}
            disabled={isValidating}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isValidating ? 'animate-spin' : ''}`} />
            Revalidate
          </Button>
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>{passCount} Passed</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span>{warningCount} Warnings</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>{failCount} Failed</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {validationResults.map((result, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border ${getStatusColor(result.status)}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(result.status)}
                <div>
                  <p className="font-medium capitalize">
                    {result.step.replace('_', ' ')}
                  </p>
                  <p className="text-sm text-gray-600">
                    {result.message}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {result.status}
                </Badge>
                {result.status !== 'pass' && canFixStep(result.step) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fixDataMutation.mutate(result.step)}
                    disabled={fixDataMutation.isPending}
                  >
                    Fix
                  </Button>
                )}
              </div>
            </div>
            
            {result.data && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}

        {failCount > 0 && (
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              There are critical issues that need attention. Please contact support if you cannot resolve them.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
