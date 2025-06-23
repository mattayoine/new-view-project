
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Search, Filter, RefreshCw, Wifi, Bell } from "lucide-react";
import { usePaginatedSessions } from "@/hooks/usePaginatedQuery";
import { useRealTimeSubscription } from "@/hooks/useRealTimeSubscription";
import { Pagination } from "@/components/ui/pagination";
import { EnhancedLoadingState } from "@/components/ui/enhanced-loading";
import { EnhancedErrorBoundary } from "@/components/ui/enhanced-error-boundary";
import { useOptimizedQuery } from "@/hooks/useOptimizedQuery";
import { format } from "date-fns";
import { toast } from 'sonner';

const EnhancedSessionTracker = () => {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  const {
    data: sessions,
    isLoading,
    error,
    currentPage,
    totalPages,
    goToPage,
    refetch
  } = usePaginatedSessions(undefined, statusFilter || undefined);

  // Subscribe to real-time session updates
  useRealTimeSubscription({
    table: 'sessions',
    queryKey: ['paginated-sessions', '', statusFilter || ''],
    event: '*'
  });

  // Monitor real-time updates
  useEffect(() => {
    if (isRealTimeEnabled) {
      const interval = setInterval(() => {
        setLastUpdateTime(new Date());
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isRealTimeEnabled]);

  // Auto-refresh data every 2 minutes when real-time is disabled
  useEffect(() => {
    if (!isRealTimeEnabled) {
      const interval = setInterval(() => {
        refetch();
        setLastUpdateTime(new Date());
      }, 120000);

      return () => clearInterval(interval);
    }
  }, [isRealTimeEnabled, refetch]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredSessions = sessions?.filter(session =>
    session.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    toast.info(`Filtered by status: ${value || 'All'}`);
  };

  const handleRealTimeToggle = () => {
    setIsRealTimeEnabled(!isRealTimeEnabled);
    toast.success(`Real-time updates ${!isRealTimeEnabled ? 'enabled' : 'disabled'}`);
  };

  if (error) {
    return (
      <EnhancedErrorBoundary 
        enableReporting 
        showDetails
        onError={(error, errorInfo) => {
          console.error('Session tracker error:', { error, errorInfo });
        }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              Failed to load sessions. Please try again.
              <Button onClick={() => refetch()} className="ml-2" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </EnhancedErrorBoundary>
    );
  }

  return (
    <EnhancedErrorBoundary enableReporting>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Enhanced Session Tracker
              {isRealTimeEnabled && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <Wifi className="w-3 h-3 mr-1" />
                  Live
                </Badge>
              )}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Last update: {format(lastUpdateTime, 'HH:mm:ss')}
              </span>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRealTimeToggle}
              >
                {isRealTimeEnabled ? (
                  <>
                    <Wifi className="w-4 h-4 mr-2" />
                    Real-time
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4 mr-2" />
                    Manual
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()}
                className="ml-auto"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Enhanced Filters */}
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sessions List */}
          {isLoading ? (
            <EnhancedLoadingState 
              type="table" 
              message="Loading sessions..." 
              rows={5}
              columns={4}
            />
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {sessions?.length === 0 ? 'No sessions found' : 'No sessions match your search criteria'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSessions.map((session) => (
                <div key={session.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium">{session.title}</h4>
                      {session.description && (
                        <p className="text-sm text-muted-foreground">{session.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(session.scheduled_at), 'MMM dd, yyyy')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {format(new Date(session.scheduled_at), 'h:mm a')}
                        </div>
                      </div>
                    </div>
                    <Badge className={getStatusColor(session.status)}>
                      {session.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={goToPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </EnhancedErrorBoundary>
  );
};

export default EnhancedSessionTracker;
