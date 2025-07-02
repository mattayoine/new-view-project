
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { GoogleAuthService } from '@/services/googleAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const GoogleCalendarSetup = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkConnectionStatus();
    
    // Handle OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state === 'google-calendar-setup') {
      handleOAuthCallback(code);
    }
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_oauth_tokens')
        .select('id')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .single();

      setIsConnected(!!data);
    } catch (error) {
      console.error('Error checking connection status:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleConnect = () => {
    const redirectUri = `${window.location.origin}${window.location.pathname}`;
    const authUrl = GoogleAuthService.getAuthUrl(redirectUri);
    
    // Add state parameter to track this specific flow
    const urlWithState = `${authUrl}&state=google-calendar-setup`;
    window.location.href = urlWithState;
  };

  const handleOAuthCallback = async (code: string) => {
    setIsLoading(true);
    try {
      const redirectUri = `${window.location.origin}${window.location.pathname}`;
      const tokens = await GoogleAuthService.exchangeCodeForTokens(code, redirectUri);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Store tokens in database
      await supabase
        .from('user_oauth_tokens')
        .upsert({
          user_id: user.id,
          provider: 'google',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: tokens.expires_at
        });

      setIsConnected(true);
      toast.success('Google Calendar connected successfully!');
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error: any) {
      console.error('OAuth callback error:', error);
      toast.error(`Failed to connect Google Calendar: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current token to revoke
      const { data: tokenData } = await supabase
        .from('user_oauth_tokens')
        .select('access_token')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .single();

      if (tokenData?.access_token) {
        await GoogleAuthService.revokeTokens(tokenData.access_token);
      }

      // Remove from database
      await supabase
        .from('user_oauth_tokens')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', 'google');

      setIsConnected(false);
      toast.success('Google Calendar disconnected');
    } catch (error: any) {
      console.error('Disconnect error:', error);
      toast.error(`Failed to disconnect: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (checking) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 animate-spin" />
            <span>Checking connection status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Google Calendar Integration
          {isConnected ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          ) : (
            <Badge variant="destructive">
              <AlertCircle className="w-3 h-3 mr-1" />
              Not Connected
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          {isConnected ? (
            <p>Your Google Calendar is connected. Sessions will automatically create calendar events with Google Meet links.</p>
          ) : (
            <p>Connect your Google Calendar to automatically create calendar events and Google Meet links for your sessions.</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isConnected ? (
            <Button 
              variant="outline" 
              onClick={handleDisconnect}
              disabled={isLoading}
            >
              {isLoading ? 'Disconnecting...' : 'Disconnect'}
            </Button>
          ) : (
            <Button 
              onClick={handleConnect}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {isLoading ? 'Connecting...' : 'Connect Google Calendar'}
            </Button>
          )}
        </div>

        {!isConnected && (
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
            <p><strong>What you'll get:</strong></p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>Automatic calendar events for all sessions</li>
              <li>Google Meet links generated automatically</li>
              <li>Email reminders to all participants</li>
              <li>Calendar updates when sessions are rescheduled</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleCalendarSetup;
