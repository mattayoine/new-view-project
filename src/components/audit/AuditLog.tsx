
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SecureComponent } from '@/components/security/SecureComponent';
import { Clock, User, Activity } from 'lucide-react';
import { format } from 'date-fns';

interface AuditLogEntry {
  id: string;
  action_type: string;
  target_type: string;
  action_description: string;
  created_at: string;
  admin_id: string;
  old_values?: any;
  new_values?: any;
}

export const AuditLog: React.FC = () => {
  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as AuditLogEntry[];
    }
  });

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'assignment_create': return 'bg-green-100 text-green-800';
      case 'assignment_update': return 'bg-blue-100 text-blue-800';
      case 'assignment_delete': return 'bg-red-100 text-red-800';
      case 'application_review': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <SecureComponent requiredRole="admin">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Audit Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {auditLogs?.map((log) => (
              <div key={log.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge className={getActionColor(log.action_type)}>
                    {log.action_type.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                  </div>
                </div>
                
                <p className="text-sm">{log.action_description}</p>
                
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <User className="h-3 w-3" />
                  Admin ID: {log.admin_id}
                  <span className="text-gray-400">•</span>
                  Target: {log.target_type}
                </div>

                {(log.old_values || log.new_values) && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                      View Changes
                    </summary>
                    <div className="mt-2 p-2 bg-gray-50 rounded space-y-1">
                      {log.old_values && (
                        <div>
                          <strong>Old:</strong> {JSON.stringify(log.old_values, null, 2)}
                        </div>
                      )}
                      {log.new_values && (
                        <div>
                          <strong>New:</strong> {JSON.stringify(log.new_values, null, 2)}
                        </div>
                      )}
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </SecureComponent>
  );
};
