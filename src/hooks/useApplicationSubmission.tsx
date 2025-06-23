
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FounderApplicationData {
  name: string;
  email: string;
  location: string;
  startup_name: string;
  website?: string;
  stage: string;
  sector: string;
  challenge: string;
  win_definition: string;
  video_link?: string;
  case_study_consent: boolean;
  availability_schedule?: any;
}

interface AdvisorApplicationData {
  name: string;
  email: string;
  location: string;
  linkedin: string;
  expertise: string[];
  experience_level: string;
  timezone: string;
  challenge_preference: string;
  availability_schedule?: any;
  public_profile_consent: boolean;
}

const useFounderApplication = () => {
  return useMutation({
    mutationFn: async (data: FounderApplicationData) => {
      // First create base application
      const { data: application, error: appError } = await supabase
        .from('base_applications')
        .insert({
          type: 'founder',
          email: data.email,
          name: data.name,
          location: data.location,
          status: 'pending'
        })
        .select()
        .single();

      if (appError) throw appError;

      // Then create founder-specific details
      const { error: detailsError } = await supabase
        .from('founder_application_details')
        .insert({
          application_id: application.id,
          startup_name: data.startup_name,
          website: data.website,
          stage: data.stage,
          sector: data.sector,
          challenge: data.challenge,
          win_definition: data.win_definition,
          video_link: data.video_link,
          case_study_consent: data.case_study_consent,
          availability_schedule: data.availability_schedule
        });

      if (detailsError) throw detailsError;

      return application;
    }
  });
};

const useAdvisorApplication = () => {
  return useMutation({
    mutationFn: async (data: AdvisorApplicationData) => {
      // First create base application
      const { data: application, error: appError } = await supabase
        .from('base_applications')
        .insert({
          type: 'advisor',
          email: data.email,
          name: data.name,
          location: data.location,
          status: 'pending'
        })
        .select()
        .single();

      if (appError) throw appError;

      // Then create advisor-specific details
      const { error: detailsError } = await supabase
        .from('advisor_application_details')
        .insert({
          application_id: application.id,
          linkedin: data.linkedin,
          expertise: data.expertise,
          experience_level: data.experience_level,
          timezone: data.timezone,
          challenge_preference: data.challenge_preference,
          availability_schedule: data.availability_schedule,
          public_profile_consent: data.public_profile_consent
        });

      if (detailsError) throw detailsError;

      return application;
    }
  });
};

export { useFounderApplication, useAdvisorApplication };
