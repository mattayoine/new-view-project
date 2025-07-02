
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, ...params } = await req.json();

    let result;

    switch (action) {
      case 'check':
        const { data: checkData } = await supabaseAdmin
          .from('user_oauth_tokens')
          .select('id')
          .eq('user_id', params.user_id)
          .eq('provider', params.provider)
          .single();
        result = { exists: !!checkData };
        break;

      case 'store':
        const { error: storeError } = await supabaseAdmin
          .from('user_oauth_tokens')
          .upsert({
            user_id: params.user_id,
            provider: params.provider,
            access_token: params.access_token,
            refresh_token: params.refresh_token,
            expires_at: params.expires_at
          });
        if (storeError) throw storeError;
        result = { success: true };
        break;

      case 'get':
        const { data: getData, error: getError } = await supabaseAdmin
          .from('user_oauth_tokens')
          .select('access_token, refresh_token, expires_at')
          .eq('user_id', params.user_id)
          .eq('provider', params.provider)
          .single();
        if (getError) throw getError;
        result = getData;
        break;

      case 'delete':
        const { error: deleteError } = await supabaseAdmin
          .from('user_oauth_tokens')
          .delete()
          .eq('user_id', params.user_id)
          .eq('provider', params.provider);
        if (deleteError) throw deleteError;
        result = { success: true };
        break;

      default:
        throw new Error('Invalid action');
    }

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('OAuth token helper error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
