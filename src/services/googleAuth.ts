
import { supabase } from '@/integrations/supabase/client';

export interface GoogleAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
}

export class GoogleAuthService {
  private static readonly SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ].join(' ');

  static getAuthUrl(redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: '40551930831-4tmrb9hlkl1vd31iq99avnjrmrfgqqso.apps.googleusercontent.com',
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: this.SCOPES,
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  static async exchangeCodeForTokens(code: string, redirectUri: string): Promise<GoogleAuthTokens> {
    const { data, error } = await supabase.functions.invoke('google-oauth-exchange', {
      body: {
        code,
        redirect_uri: redirectUri
      }
    });

    if (error || !data.success) {
      throw new Error(data?.error || 'Failed to exchange code for tokens');
    }

    return data.tokens;
  }

  static async refreshAccessToken(refreshToken: string): Promise<GoogleAuthTokens> {
    const { data, error } = await supabase.functions.invoke('google-oauth-refresh', {
      body: {
        refresh_token: refreshToken
      }
    });

    if (error || !data.success) {
      throw new Error(data?.error || 'Failed to refresh access token');
    }

    return data.tokens;
  }

  static async revokeTokens(accessToken: string): Promise<void> {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
      method: 'POST'
    });
  }
}
