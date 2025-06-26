
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

    if (application.status === 'approved') {
      console.log('Application already approved, skipping');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Application already approved',
          tempPassword: 'Already approved - check existing credentials'
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log('Application fetched:', application.email, application.type);

    // Check if user already exists in auth
    const { data: existingAuthUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      throw new Error(`Failed to check existing users: ${listError.message}`);
    }

    const existingAuthUser = existingAuthUsers.users.find(user => user.email === application.email);
    let authUser;
    let tempPassword = '';

    if (existingAuthUser) {
      console.log('Auth user already exists, using existing user:', existingAuthUser.id);
      authUser = { user: existingAuthUser };
      tempPassword = 'User already exists - password unchanged';
    } else {
      // Generate secure temporary password
      tempPassword = Math.random().toString(36).slice(-12) + 'A1!';
      
      // Create user account using admin API
      const { data: newAuthUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
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

      console.log('Auth user created:', newAuthUser.user.id);
      authUser = newAuthUser;
    }

    // Check if user record already exists in users table
    const { data: existingUser, error: userCheckError } = await supabaseAdmin
      .from('users')
      .select('id, role, status')
      .eq('auth_id', authUser.user.id)
      .maybeSingle();

    if (userCheckError) {
      console.error('Error checking existing user:', userCheckError);
      throw new Error(`Failed to check existing user record: ${userCheckError.message}`);
    }

    let userId;
    
    if (existingUser) {
      console.log('User record already exists, updating:', existingUser.id);
      // Update existing user record
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          role: application.type,
          status: 'active',
          profile_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id)
        .select()
        .single();

      if (updateError) {
        console.error('User record update failed:', updateError);
        throw new Error(`Failed to update user record: ${updateError.message}`);
      }

      userId = updatedUser.id;
      console.log('User record updated:', userId);
    } else {
      // Create new user record
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
        throw new Error(`Failed to create user record: ${userError.message}`);
      }

      userId = newUser.id;
      console.log('User record created:', userId);
    }

    // Create or update user profile
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

    // Check if profile already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingProfile) {
      // Update existing profile
      const { error: profileUpdateError } = await supabaseAdmin
        .from('user_profiles')
        .update({
          profile_type: application.type,
          profile_data: profileData,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (profileUpdateError) {
        console.error('Profile update error:', profileUpdateError);
      } else {
        console.log('Profile updated successfully');
      }
    } else {
      // Create new profile
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          user_id: userId,
          profile_type: application.type,
          profile_data: profileData
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
      } else {
        console.log('Profile created successfully');
      }
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
        userId: userId, 
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
