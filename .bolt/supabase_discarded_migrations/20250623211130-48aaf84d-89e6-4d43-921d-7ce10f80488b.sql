
-- BATCH 5: Security & Data Integrity - RLS Policies and Data Validation

-- First, let's create a function to get the current user's role securely
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.users WHERE auth_id = auth.uid() AND deleted_at IS NULL;
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() 
    AND role = 'admin' 
    AND deleted_at IS NULL
    AND status = 'active'
  );
$$;

-- Create function to check if user is advisor
CREATE OR REPLACE FUNCTION public.is_advisor()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() 
    AND role = 'advisor' 
    AND deleted_at IS NULL
    AND status = 'active'
  );
$$;

-- Create function to check if user is founder
CREATE OR REPLACE FUNCTION public.is_founder()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() 
    AND role = 'founder' 
    AND deleted_at IS NULL
    AND status = 'active'
  );
$$;

-- Create function to get current user id
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM public.users WHERE auth_id = auth.uid() AND deleted_at IS NULL;
$$;

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.notifications;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.sessions;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.goals;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.advisor_founder_assignments;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.messages;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.base_applications;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

CREATE POLICY "Admins can update any user" ON public.users
  FOR UPDATE USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Only system can insert users" ON public.users
  FOR INSERT WITH CHECK (false); -- Users created via triggers only

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT USING (
    user_id = public.get_current_user_id() OR public.is_admin()
  );

CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (user_id = public.get_current_user_id())
  WITH CHECK (user_id = public.get_current_user_id());

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (user_id = public.get_current_user_id());

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (user_id = public.get_current_user_id());

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (user_id = public.get_current_user_id())
  WITH CHECK (user_id = public.get_current_user_id());

CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true); -- System notifications

-- Sessions policies
CREATE POLICY "Users can view their sessions" ON public.sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.advisor_founder_assignments afa
      JOIN public.users u ON (u.id = afa.advisor_id OR u.id = afa.founder_id)
      WHERE afa.id = sessions.assignment_id
      AND u.auth_id = auth.uid()
    ) OR public.is_admin()
  );

CREATE POLICY "Assigned users can update sessions" ON public.sessions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.advisor_founder_assignments afa
      JOIN public.users u ON (u.id = afa.advisor_id OR u.id = afa.founder_id)
      WHERE afa.id = sessions.assignment_id
      AND u.auth_id = auth.uid()
    ) OR public.is_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.advisor_founder_assignments afa
      JOIN public.users u ON (u.id = afa.advisor_id OR u.id = afa.founder_id)
      WHERE afa.id = sessions.assignment_id
      AND u.auth_id = auth.uid()
    ) OR public.is_admin()
  );

CREATE POLICY "Assigned users can create sessions" ON public.sessions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.advisor_founder_assignments afa
      JOIN public.users u ON (u.id = afa.advisor_id OR u.id = afa.founder_id)
      WHERE afa.id = sessions.assignment_id
      AND u.auth_id = auth.uid()
    ) OR public.is_admin()
  );

-- Goals policies
CREATE POLICY "Founders can view their own goals" ON public.goals
  FOR SELECT USING (
    founder_id = public.get_current_user_id() OR
    EXISTS (
      SELECT 1 FROM public.advisor_founder_assignments afa
      JOIN public.users u ON u.id = afa.advisor_id
      WHERE afa.founder_id = goals.founder_id
      AND u.auth_id = auth.uid()
    ) OR public.is_admin()
  );

CREATE POLICY "Founders can manage their own goals" ON public.goals
  FOR ALL USING (founder_id = public.get_current_user_id())
  WITH CHECK (founder_id = public.get_current_user_id());

-- Advisor founder assignments policies
CREATE POLICY "Users can view their assignments" ON public.advisor_founder_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE (u.id = advisor_founder_assignments.advisor_id OR u.id = advisor_founder_assignments.founder_id)
      AND u.auth_id = auth.uid()
    ) OR public.is_admin()
  );

CREATE POLICY "Admins can manage assignments" ON public.advisor_founder_assignments
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Messages policies
CREATE POLICY "Users can view their messages" ON public.messages
  FOR SELECT USING (
    from_user_id = public.get_current_user_id() OR
    to_user_id = public.get_current_user_id() OR
    public.is_admin()
  );

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (from_user_id = public.get_current_user_id());

CREATE POLICY "Users can update their sent messages" ON public.messages
  FOR UPDATE USING (from_user_id = public.get_current_user_id())
  WITH CHECK (from_user_id = public.get_current_user_id());

-- Applications policies
CREATE POLICY "Admins can view all applications" ON public.base_applications
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update applications" ON public.base_applications
  FOR UPDATE USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Anyone can submit applications" ON public.base_applications
  FOR INSERT WITH CHECK (true);

-- Add audit logging trigger for sensitive operations
CREATE OR REPLACE FUNCTION public.audit_sensitive_operations()
RETURNS TRIGGER AS $$
BEGIN
  -- Log assignment changes
  IF TG_TABLE_NAME = 'advisor_founder_assignments' THEN
    INSERT INTO public.admin_activity_log (
      admin_id, action_type, target_type, target_id,
      action_description, old_values, new_values
    ) VALUES (
      public.get_current_user_id(),
      CASE TG_OP
        WHEN 'INSERT' THEN 'assignment_create'
        WHEN 'UPDATE' THEN 'assignment_update'
        WHEN 'DELETE' THEN 'assignment_delete'
      END,
      'assignment',
      COALESCE(NEW.id, OLD.id),
      format('Assignment %s by user %s', TG_OP, auth.uid()),
      CASE WHEN OLD IS NOT NULL THEN row_to_json(OLD) ELSE NULL END,
      CASE WHEN NEW IS NOT NULL THEN row_to_json(NEW) ELSE NULL END
    );
  END IF;

  -- Log application status changes
  IF TG_TABLE_NAME = 'base_applications' AND TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO public.admin_activity_log (
      admin_id, action_type, target_type, target_id,
      action_description, old_values, new_values
    ) VALUES (
      public.get_current_user_id(),
      'application_review',
      'application',
      NEW.id,
      format('Application status changed from %s to %s', OLD.status, NEW.status),
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status, 'reviewed_by', NEW.reviewed_by)
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers
CREATE TRIGGER audit_assignments
  AFTER INSERT OR UPDATE OR DELETE ON public.advisor_founder_assignments
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_operations();

CREATE TRIGGER audit_applications
  AFTER UPDATE ON public.base_applications
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_operations();

-- Add data validation triggers
CREATE OR REPLACE FUNCTION public.validate_application_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate email format
  IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;

  -- Validate name is not empty
  IF trim(NEW.name) = '' THEN
    RAISE EXCEPTION 'Name cannot be empty';
  END IF;

  -- Validate location is not empty
  IF trim(NEW.location) = '' THEN
    RAISE EXCEPTION 'Location cannot be empty';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_application_trigger
  BEFORE INSERT OR UPDATE ON public.base_applications
  FOR EACH ROW EXECUTE FUNCTION public.validate_application_data();

-- Add session validation
CREATE OR REPLACE FUNCTION public.validate_session_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate title is not empty
  IF trim(NEW.title) = '' THEN
    RAISE EXCEPTION 'Session title cannot be empty';
  END IF;

  -- Validate scheduled_at is in the future for new sessions
  IF TG_OP = 'INSERT' AND NEW.scheduled_at <= now() THEN
    RAISE EXCEPTION 'Session must be scheduled in the future';
  END IF;

  -- Validate duration is reasonable
  IF NEW.duration_minutes IS NOT NULL AND (NEW.duration_minutes < 15 OR NEW.duration_minutes > 180) THEN
    RAISE EXCEPTION 'Session duration must be between 15 and 180 minutes';
  END IF;

  -- Validate ratings are within range
  IF NEW.founder_rating IS NOT NULL AND (NEW.founder_rating < 1 OR NEW.founder_rating > 5) THEN
    RAISE EXCEPTION 'Founder rating must be between 1 and 5';
  END IF;

  IF NEW.advisor_rating IS NOT NULL AND (NEW.advisor_rating < 1 OR NEW.advisor_rating > 5) THEN
    RAISE EXCEPTION 'Advisor rating must be between 1 and 5';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_session_trigger
  BEFORE INSERT OR UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.validate_session_data();

-- Add goal validation
CREATE OR REPLACE FUNCTION public.validate_goal_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate title is not empty
  IF trim(NEW.title) = '' THEN
    RAISE EXCEPTION 'Goal title cannot be empty';
  END IF;

  -- Validate progress percentage
  IF NEW.progress_percentage IS NOT NULL AND (NEW.progress_percentage < 0 OR NEW.progress_percentage > 100) THEN
    RAISE EXCEPTION 'Progress percentage must be between 0 and 100';
  END IF;

  -- Validate target date is not in the past for new goals
  IF TG_OP = 'INSERT' AND NEW.target_date IS NOT NULL AND NEW.target_date < current_date THEN
    RAISE EXCEPTION 'Target date cannot be in the past';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_goal_trigger
  BEFORE INSERT OR UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.validate_goal_data();

-- Add user validation
CREATE OR REPLACE FUNCTION public.validate_user_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate email format
  IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;

  -- Validate role
  IF NEW.role NOT IN ('admin', 'advisor', 'founder') THEN
    RAISE EXCEPTION 'Invalid role. Must be admin, advisor, or founder';
  END IF;

  -- Validate status
  IF NEW.status NOT IN ('pending_activation', 'active', 'inactive', 'suspended') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_user_trigger
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.validate_user_data();

-- Add message validation
CREATE OR REPLACE FUNCTION public.validate_message_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate content is not empty
  IF trim(NEW.content) = '' THEN
    RAISE EXCEPTION 'Message content cannot be empty';
  END IF;

  -- Validate from_user_id and to_user_id are different
  IF NEW.from_user_id = NEW.to_user_id THEN
    RAISE EXCEPTION 'Cannot send message to yourself';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_message_trigger
  BEFORE INSERT OR UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.validate_message_data();

-- Add data consistency triggers
CREATE OR REPLACE FUNCTION public.maintain_assignment_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update assignment metrics when sessions change
  IF TG_TABLE_NAME = 'sessions' THEN
    UPDATE public.advisor_founder_assignments 
    SET 
      total_sessions = (
        SELECT COUNT(*) FROM public.sessions 
        WHERE assignment_id = COALESCE(NEW.assignment_id, OLD.assignment_id)
        AND deleted_at IS NULL
      ),
      completed_sessions = (
        SELECT COUNT(*) FROM public.sessions 
        WHERE assignment_id = COALESCE(NEW.assignment_id, OLD.assignment_id)
        AND status = 'completed'
        AND deleted_at IS NULL
      ),
      avg_rating = (
        SELECT AVG((COALESCE(founder_rating, 0) + COALESCE(advisor_rating, 0)) / 2.0)
        FROM public.sessions 
        WHERE assignment_id = COALESCE(NEW.assignment_id, OLD.assignment_id)
        AND status = 'completed'
        AND (founder_rating IS NOT NULL OR advisor_rating IS NOT NULL)
        AND deleted_at IS NULL
      ),
      updated_at = now()
    WHERE id = COALESCE(NEW.assignment_id, OLD.assignment_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER maintain_metrics_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.maintain_assignment_metrics();

-- Add soft delete consistency
CREATE OR REPLACE FUNCTION public.cascade_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- When an assignment is soft deleted, soft delete related sessions
  IF TG_TABLE_NAME = 'advisor_founder_assignments' AND OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    UPDATE public.sessions 
    SET deleted_at = NEW.deleted_at 
    WHERE assignment_id = NEW.id AND deleted_at IS NULL;
  END IF;

  -- When a user is soft deleted, soft delete their profiles and notifications
  IF TG_TABLE_NAME = 'users' AND OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    UPDATE public.user_profiles 
    SET deleted_at = NEW.deleted_at 
    WHERE user_id = NEW.id AND deleted_at IS NULL;
    
    UPDATE public.notifications 
    SET deleted_at = NEW.deleted_at 
    WHERE user_id = NEW.id AND deleted_at IS NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cascade_assignment_delete
  AFTER UPDATE ON public.advisor_founder_assignments
  FOR EACH ROW EXECUTE FUNCTION public.cascade_soft_delete();

CREATE TRIGGER cascade_user_delete
  AFTER UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.cascade_soft_delete();
