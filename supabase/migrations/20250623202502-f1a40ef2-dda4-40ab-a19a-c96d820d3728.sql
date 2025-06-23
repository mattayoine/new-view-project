
-- First, let's create the application workflow tables and update existing ones
-- Store application submissions properly
ALTER TABLE base_applications ADD COLUMN IF NOT EXISTS application_data jsonb;
ALTER TABLE base_applications ADD COLUMN IF NOT EXISTS application_type text;

-- Create a trigger to auto-create user accounts upon application approval
CREATE OR REPLACE FUNCTION create_user_from_approved_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id uuid;
  founder_data jsonb;
  advisor_data jsonb;
BEGIN
  -- Only proceed if status changed to 'approved'
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    
    -- Create user account
    INSERT INTO users (email, role, status, profile_completed)
    VALUES (NEW.email, NEW.type, 'active', true)
    RETURNING id INTO new_user_id;
    
    -- Create user profile based on application type
    IF NEW.type = 'founder' THEN
      -- Get founder application details
      SELECT row_to_json(fad.*) INTO founder_data
      FROM founder_application_details fad
      WHERE fad.application_id = NEW.id;
      
      INSERT INTO user_profiles (user_id, profile_type, profile_data)
      VALUES (new_user_id, 'founder', jsonb_build_object(
        'name', NEW.name,
        'location', NEW.location,
        'startup_name', founder_data->>'startup_name',
        'website', founder_data->>'website',
        'sector', founder_data->>'sector',
        'stage', founder_data->>'stage',
        'challenge', founder_data->>'challenge',
        'win_definition', founder_data->>'win_definition',
        'video_link', founder_data->>'video_link'
      ));
      
    ELSIF NEW.type = 'advisor' THEN
      -- Get advisor application details
      SELECT row_to_json(aad.*) INTO advisor_data
      FROM advisor_application_details aad
      WHERE aad.application_id = NEW.id;
      
      INSERT INTO user_profiles (user_id, profile_type, profile_data)
      VALUES (new_user_id, 'advisor', jsonb_build_object(
        'name', NEW.name,
        'location', NEW.location,
        'linkedin', advisor_data->>'linkedin',
        'expertise', advisor_data->>'expertise',
        'experience_level', advisor_data->>'experience_level',
        'timezone', advisor_data->>'timezone',
        'challenge_preference', advisor_data->>'challenge_preference'
      ));
    END IF;
    
    -- Create notification for the new user
    INSERT INTO notifications (user_id, type, title, message, priority)
    VALUES (new_user_id, 'application_approved', 'Welcome to CoPilot!', 
            'Your application has been approved. Welcome to the platform!', 'high');
            
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_application_approved ON base_applications;
CREATE TRIGGER on_application_approved
  AFTER UPDATE ON base_applications
  FOR EACH ROW
  EXECUTE FUNCTION create_user_from_approved_application();

-- Seed some test data
-- Create admin user first
INSERT INTO users (email, role, status, profile_completed) 
VALUES ('admin@copilot.com', 'admin', 'active', true) 
ON CONFLICT (email) DO NOTHING;

-- Create some test founders
INSERT INTO users (email, role, status, profile_completed) 
VALUES 
  ('founder1@example.com', 'founder', 'active', true),
  ('founder2@example.com', 'founder', 'active', true)
ON CONFLICT (email) DO NOTHING;

-- Create some test advisors
INSERT INTO users (email, role, status, profile_completed) 
VALUES 
  ('advisor1@example.com', 'advisor', 'active', true),
  ('advisor2@example.com', 'advisor', 'active', true)
ON CONFLICT (email) DO NOTHING;

-- Create user profiles for test users
INSERT INTO user_profiles (user_id, profile_type, profile_data)
SELECT u.id, 'founder', jsonb_build_object(
  'name', CASE 
    WHEN u.email = 'founder1@example.com' THEN 'Kwame Asante'
    WHEN u.email = 'founder2@example.com' THEN 'Amina Hassan'
  END,
  'location', CASE 
    WHEN u.email = 'founder1@example.com' THEN 'Accra, Ghana'
    WHEN u.email = 'founder2@example.com' THEN 'Lagos, Nigeria'
  END,
  'startup_name', CASE 
    WHEN u.email = 'founder1@example.com' THEN 'AgriTech Solutions'
    WHEN u.email = 'founder2@example.com' THEN 'FinFlow'
  END,
  'sector', CASE 
    WHEN u.email = 'founder1@example.com' THEN 'Agriculture'
    WHEN u.email = 'founder2@example.com' THEN 'Fintech'
  END,
  'stage', CASE 
    WHEN u.email = 'founder1@example.com' THEN 'MVP launched with 500 active farmers'
    WHEN u.email = 'founder2@example.com' THEN 'Pre-revenue, building initial product'
  END,
  'challenge', CASE 
    WHEN u.email = 'founder1@example.com' THEN 'Need help scaling customer acquisition and building partnerships with agricultural cooperatives'
    WHEN u.email = 'founder2@example.com' THEN 'Struggling with product-market fit and regulatory compliance for financial services'
  END
)
FROM users u 
WHERE u.role = 'founder' AND u.email IN ('founder1@example.com', 'founder2@example.com')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_profiles (user_id, profile_type, profile_data)
SELECT u.id, 'advisor', jsonb_build_object(
  'name', CASE 
    WHEN u.email = 'advisor1@example.com' THEN 'David Okonkwo'
    WHEN u.email = 'advisor2@example.com' THEN 'Sarah Chen'
  END,
  'location', CASE 
    WHEN u.email = 'advisor1@example.com' THEN 'London, UK'
    WHEN u.email = 'advisor2@example.com' THEN 'San Francisco, USA'
  END,
  'expertise', CASE 
    WHEN u.email = 'advisor1@example.com' THEN ARRAY['Marketing', 'Growth', 'Strategy']
    WHEN u.email = 'advisor2@example.com' THEN ARRAY['Product', 'Technology', 'Fundraising']
  END,
  'experience_level', CASE 
    WHEN u.email = 'advisor1@example.com' THEN '10+ years in marketing at Google and Stripe, helped 50+ startups scale'
    WHEN u.email = 'advisor2@example.com' THEN '8 years as VP Product at fintech startups, raised $50M+ across multiple rounds'
  END,
  'timezone', CASE 
    WHEN u.email = 'advisor1@example.com' THEN 'GMT, prefer evenings'
    WHEN u.email = 'advisor2@example.com' THEN 'PST, flexible weekday mornings'
  END
)
FROM users u 
WHERE u.role = 'advisor' AND u.email IN ('advisor1@example.com', 'advisor2@example.com')
ON CONFLICT (user_id) DO NOTHING;

-- Create some assignments
INSERT INTO advisor_founder_assignments (advisor_id, founder_id, status, match_score, assigned_at)
SELECT 
  (SELECT id FROM users WHERE email = 'advisor1@example.com'),
  (SELECT id FROM users WHERE email = 'founder1@example.com'),
  'active', 85, now()
WHERE NOT EXISTS (
  SELECT 1 FROM advisor_founder_assignments 
  WHERE advisor_id = (SELECT id FROM users WHERE email = 'advisor1@example.com')
  AND founder_id = (SELECT id FROM users WHERE email = 'founder1@example.com')
);

INSERT INTO advisor_founder_assignments (advisor_id, founder_id, status, match_score, assigned_at)
SELECT 
  (SELECT id FROM users WHERE email = 'advisor2@example.com'),
  (SELECT id FROM users WHERE email = 'founder2@example.com'),
  'active', 92, now()
WHERE NOT EXISTS (
  SELECT 1 FROM advisor_founder_assignments 
  WHERE advisor_id = (SELECT id FROM users WHERE email = 'advisor2@example.com')
  AND founder_id = (SELECT id FROM users WHERE email = 'founder2@example.com')
);

-- Create some sessions
INSERT INTO sessions (assignment_id, title, description, status, scheduled_at, duration_minutes)
SELECT 
  afa.id,
  'Initial Strategy Session',
  'Getting to know each other and understanding current challenges',
  'completed',
  now() - interval '1 week',
  60
FROM advisor_founder_assignments afa
JOIN users advisor ON afa.advisor_id = advisor.id
JOIN users founder ON afa.founder_id = founder.id
WHERE advisor.email = 'advisor1@example.com' 
AND founder.email = 'founder1@example.com'
AND NOT EXISTS (SELECT 1 FROM sessions s WHERE s.assignment_id = afa.id);

-- Create some goals
INSERT INTO goals (founder_id, title, description, status, priority, category, target_date)
SELECT 
  u.id,
  'Increase Customer Acquisition',
  'Scale from 500 to 2000 active farmers within 6 months',
  'active',
  'high',
  'growth',
  (current_date + interval '6 months')::date
FROM users u 
WHERE u.email = 'founder1@example.com'
AND NOT EXISTS (SELECT 1 FROM goals g WHERE g.founder_id = u.id);

-- Create some testimonials
INSERT INTO testimonials (from_user_id, to_user_id, rating, title, content, is_public)
SELECT 
  founder.id,
  advisor.id,
  5,
  'Exceptional strategic guidance',
  'David helped me completely rethink our go-to-market strategy. His insights from scaling at Google were invaluable.',
  true
FROM users founder, users advisor
WHERE founder.email = 'founder1@example.com' 
AND advisor.email = 'advisor1@example.com'
AND NOT EXISTS (
  SELECT 1 FROM testimonials t 
  WHERE t.from_user_id = founder.id AND t.to_user_id = advisor.id
);

-- Create some notifications
INSERT INTO notifications (user_id, type, title, message, priority)
SELECT 
  u.id,
  'session_reminder',
  'Upcoming Session Reminder',
  'You have a session scheduled for tomorrow at 3:00 PM',
  'normal'
FROM users u 
WHERE u.role IN ('founder', 'advisor')
AND NOT EXISTS (SELECT 1 FROM notifications n WHERE n.user_id = u.id);
