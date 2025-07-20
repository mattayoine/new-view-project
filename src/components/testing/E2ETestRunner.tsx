
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Activity,
  RefreshCw,
  Download,
  Bug
} from 'lucide-react';
import { useEndToEndTesting } from '@/hooks/useEndToEndTesting';
import { useAuth } from '@/hooks/useAuth';

export const E2ETestRunner: React.FC = () => {
  const { userProfile } = useAuth();
  const { testSuite, runFullTestSuite } = useEndToEndTesting();
  const [isExporting, setIsExporting] = useState(false);

  const getStatusIcon = (status: 'pass' | 'fail' | 'pending') => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'fail':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: 'pass' | 'fail' | 'pending') => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 text-green-800';
      case 'fail':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const exportResults = async () => {
    setIsExporting(true);
    
    try {
      const report = {
        timestamp: new Date().toISOString(),
        userInfo: {
          id: userProfile?.id,
          role: userProfile?.role,
          email: userProfile?.email
        },
        summary: testSuite.summary,
        results: testSuite.results,
        environment: {
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString()
        }
      };

      const blob = new Blob([JSON.stringify(report, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `e2e-test-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export results:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const progressPercentage = testSuite.summary.total > 0 
    ? ((testSuite.summary.passed + testSuite.summary.failed) / testSuite.summary.total) * 100 
    : 0;

  // Don't show for non-admin users in production
  if (userProfile?.role !== 'admin' && process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            End-to-End Test Runner
          </div>
          <div className="flex items-center gap-2">
            {testSuite.results.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={exportResults}
                disabled={isExporting}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {isExporting ? 'Exporting...' : 'Export Results'}
              </Button>
            )}
            <Button
              onClick={runFullTestSuite}
              disabled={testSuite.isRunning}
              className="flex items-center gap-2"
            >
              {testSuite.isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run All Tests
                </>
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Summary */}
        {testSuite.summary.total > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Test Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Passed: {testSuite.summary.passed}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Failed: {testSuite.summary.failed}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Pending: {testSuite.summary.pending}</span>
              </div>
            </div>
          </div>
        )}

        {/* Test Results */}
        {testSuite.results.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Test Results</h4>
            <div className="space-y-2">
              {testSuite.results.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <span className="font-medium">{result.testName}</span>
                    <Badge className={getStatusColor(result.status)}>
                      {result.status.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{result.duration}ms</span>
                    {result.error && (
                      <Badge variant="destructive" className="text-xs">
                        <Bug className="w-3 h-3 mr-1" />
                        Error
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Details */}
        {testSuite.results.some(r => r.status === 'fail') && (
          <div className="space-y-3">
            <h4 className="font-medium text-red-600">Failed Tests Details</h4>
            <div className="space-y-2">
              {testSuite.results
                .filter(r => r.status === 'fail')
                .map((result, index) => (
                  <details key={index} className="border rounded-lg">
                    <summary className="p-3 cursor-pointer hover:bg-muted/50">
                      <span className="font-medium">{result.testName}</span>
                    </summary>
                    <div className="p-3 border-t bg-muted/20">
                      <div className="text-sm font-mono text-red-600">
                        {result.error}
                      </div>
                      {result.details && (
                        <pre className="mt-2 text-xs overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  </details>
                ))}
            </div>
          </div>
        )}

        {/* Getting Started */}
        {testSuite.results.length === 0 && !testSuite.isRunning && (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="mb-2">Ready to test your application</p>
            <p className="text-sm">
              Click "Run All Tests" to validate all system components and data flows
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
