
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApprovalRequest {
  applicationId: string;
  reviewerId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { applicationId, reviewerId }: ApprovalRequest = await req.json();
    
    console.log('Starting approval process for application:', applicationId);
    
    // Create admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get application details
    const { data: application, error: fetchError } = await supabaseAdmin
      .from('base_applications')
      .select(`
        *,
        founder_details:founder_application_details(*),
        advisor_details:advisor_application_details(*)
      `)
      .eq('id', applicationId)
      .single();

    if (fetchError || !application) {
      console.error('Failed to fetch application:', fetchError);
      throw new Error('Application not found');
    }

    console.log('Application fetched:', application.email, application.type);

    // Generate secure temporary password
    const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';
    
    // Create user account using admin API
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: application.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        name: application.name,
        role: application.type,
        approved_by: reviewerId
      }
    });

    if (authError) {
      console.error('Auth user creation failed:', authError);
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    console.log('Auth user created:', authUser.user.id);

    // Create user record in users table
    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        auth_id: authUser.user.id,
        email: application.email,
        role: application.type,
        status: 'active',
        profile_completed: true
      })
      .select()
      .single();

    if (userError) {
      console.error('User record creation failed:', userError);
      // Cleanup auth user if user record creation fails
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user:', cleanupError);
      }
      throw new Error(`Failed to create user record: ${userError.message}`);
    }

    console.log('User record created:', newUser.id);

    // Create user profile
    const profileData = application.type === 'founder' 
      ? {
          name: application.name,
          location: application.location,
          startup_name: application.founder_details?.[0]?.startup_name,
          website: application.founder_details?.[0]?.website,
          sector: application.founder_details?.[0]?.sector,
          stage: application.founder_details?.[0]?.stage,
          challenge: application.founder_details?.[0]?.challenge,
          win_definition: application.founder_details?.[0]?.win_definition,
          video_link: application.founder_details?.[0]?.video_link
        }
      : {
          name: application.name,
          location: application.location,
          linkedin: application.advisor_details?.[0]?.linkedin,
          expertise: application.advisor_details?.[0]?.expertise,
          experience_level: application.advisor_details?.[0]?.experience_level,
          timezone: application.advisor_details?.[0]?.timezone,
          challenge_preference: application.advisor_details?.[0]?.challenge_preference
        };

    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        user_id: newUser.id,
        profile_type: application.type,
        profile_data: profileData
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Don't throw here as the main user creation succeeded
    }

    // Update application status
    const { error: updateError } = await supabaseAdmin
      .from('base_applications')
      .update({
        status: 'approved',
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', applicationId);

    if (updateError) {
      console.error('Application update failed:', updateError);
      throw new Error(`Failed to update application: ${updateError.message}`);
    }

    console.log('Application approved successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId: newUser.id, 
        authUserId: authUser.user.id,
        tempPassword 
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in approve-application function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
