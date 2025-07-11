
import React, { useState } from 'react';
import { useAdminApplications, useApplicationActions } from '@/hooks/useAdminApplications';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Clock, User, Building, MapPin, Globe } from 'lucide-react';
import { toast } from 'sonner';

const ApplicationReview = () => {
  const { data: applications, isLoading } = useAdminApplications();
  const { approveApplication, rejectApplication } = useApplicationActions();
  const { user } = useAuth();
  const [rejectionReason, setRejectionReason] = useState<{[key: string]: string}>({});

  const handleApprove = async (applicationId: string) => {
    if (!user?.id) return;
    
    try {
      await approveApplication.mutateAsync({ 
        applicationId, 
        reviewerId: user.id 
      });
      toast.success('Application approved successfully!');
    } catch (error) {
      toast.error('Failed to approve application');
    }
  };

  const handleReject = async (applicationId: string) => {
    if (!user?.id || !rejectionReason[applicationId]) return;
    
    try {
      await rejectApplication.mutateAsync({
        applicationId,
        reviewerId: user.id,
        reason: rejectionReason[applicationId]
      });
      toast.success('Application rejected');
      setRejectionReason(prev => ({ ...prev, [applicationId]: '' }));
    } catch (error) {
      toast.error('Failed to reject application');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderFounderApplication = (app: any, details: any) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium flex items-center mb-2">
            <Building className="w-4 h-4 mr-2" />
            Startup Details
          </h4>
          <p><strong>Company:</strong> {details?.startup_name}</p>
          <p><strong>Sector:</strong> {details?.sector}</p>
          <p><strong>Stage:</strong> {details?.stage}</p>
          {details?.website && (
            <p className="flex items-center">
              <Globe className="w-3 h-3 mr-1" />
              <a href={details.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {details.website}
              </a>
            </p>
          )}
        </div>
        <div>
          <h4 className="font-medium mb-2">Challenge & Goals</h4>
          <p><strong>Challenge:</strong> {details?.challenge}</p>
          <p><strong>Win Definition:</strong> {details?.win_definition}</p>
        </div>
      </div>
      {details?.video_link && (
        <div>
          <h4 className="font-medium mb-2">Video Pitch</h4>
          <a href={details.video_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            View Video Pitch
          </a>
        </div>
      )}
      <div>
        <p className="text-sm text-gray-600">
          Case Study Consent: {details?.case_study_consent ? '✅ Yes' : '❌ No'}
        </p>
      </div>
    </div>
  );

  const renderAdvisorApplication = (app: any, details: any) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium mb-2">Professional Background</h4>
          <p><strong>Experience:</strong> {details?.experience_level}</p>
          <p><strong>Timezone:</strong> {details?.timezone}</p>
          <p><strong>LinkedIn:</strong> 
            <a href={details?.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
              View Profile
            </a>
          </p>
        </div>
        <div>
          <h4 className="font-medium mb-2">Expertise & Preferences</h4>
          <p><strong>Expertise:</strong> {details?.expertise?.join(', ')}</p>
          <p><strong>Challenge Preference:</strong> {details?.challenge_preference}</p>
        </div>
      </div>
      <div>
        <p className="text-sm text-gray-600">
          Public Profile Consent: {details?.public_profile_consent ? '✅ Yes' : '❌ No'}
        </p>
      </div>
    </div>
  );

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading applications...</div>;
  }

  const pendingApps = applications?.filter(app => app.status === 'pending') || [];
  const reviewedApps = applications?.filter(app => app.status !== 'pending') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Application Review</h2>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {pendingApps.length} Pending Review
        </Badge>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pendingApps.length})</TabsTrigger>
          <TabsTrigger value="reviewed">Reviewed ({reviewedApps.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingApps.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">No pending applications to review</p>
              </CardContent>
            </Card>
          ) : (
            pendingApps.map((app) => (
              <Card key={app.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      {app.name}
                      <Badge variant="outline" className="ml-2">
                        {app.type === 'founder' ? 'Founder' : 'Advisor'}
                      </Badge>
                    </CardTitle>
                    {getStatusBadge(app.status)}
                  </div>
                  <div className="flex items-center text-gray-600 gap-4">
                    <span>{app.email}</span>
                    <span className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {app.location}
                    </span>
                    <span className="text-sm">
                      Applied {new Date(app.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {app.type === 'founder' 
                    ? renderFounderApplication(app, app.founder_details?.[0])
                    : renderAdvisorApplication(app, app.advisor_details?.[0])
                  }
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleApprove(app.id)}
                        disabled={approveApplication.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                    </div>
                    <div className="flex gap-2 items-end">
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Rejection reason..."
                          value={rejectionReason[app.id] || ''}
                          onChange={(e) => setRejectionReason(prev => ({ 
                            ...prev, 
                            [app.id]: e.target.value 
                          }))}
                          className="w-64 h-20"
                        />
                        <Button 
                          variant="destructive" 
                          onClick={() => handleReject(app.id)}
                          disabled={rejectApplication.isPending || !rejectionReason[app.id]}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="reviewed" className="space-y-4">
          {reviewedApps.map((app) => (
            <Card key={app.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    {app.name}
                    <Badge variant="outline" className="ml-2">
                      {app.type === 'founder' ? 'Founder' : 'Advisor'}
                    </Badge>
                  </CardTitle>
                  {getStatusBadge(app.status)}
                </div>
                <div className="flex items-center text-gray-600 gap-4">
                  <span>{app.email}</span>
                  <span className="flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    {app.location}
                  </span>
                  <span className="text-sm">
                    Reviewed {new Date(app.reviewed_at || app.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardHeader>
              {app.status === 'rejected' && app.rejection_reason && (
                <CardContent>
                  <div className="bg-red-50 p-3 rounded">
                    <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                    <p className="text-sm text-red-700">{app.rejection_reason}</p>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApplicationReview;
