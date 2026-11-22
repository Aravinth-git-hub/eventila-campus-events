-- Supabase Schema for Eventila (No Email Verification Required + Strict RLS)
-- Run this script in the Supabase SQL Editor.
-- Safe to run on an existing database without deleting existing users or records.

-- 1. Profiles Table (Extending Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'faculty', 'hod')),
  college TEXT NOT NULL,
  department TEXT,
  year INTEGER,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unique_idx ON public.profiles (lower(email));

-- 2. Events Table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  time TEXT NOT NULL,
  venue TEXT NOT NULL,
  poster_url TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  college TEXT NOT NULL,
  audience TEXT NOT NULL CHECK (audience IN ('inter', 'outer')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  category TEXT[] DEFAULT '{}',
  organizer_name TEXT NOT NULL,
  organizer_logo TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  location_address TEXT,
  contact_details JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Registrations Table
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  guest_details JSONB, -- { name, college, department, email, phone }
  ticket_status TEXT NOT NULL DEFAULT 'Confirmed' CHECK (ticket_status IN ('Confirmed', 'Pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT registrations_student_or_guest_chk CHECK (
    (user_id IS NOT NULL AND guest_details IS NULL) OR
    (user_id IS NULL AND guest_details IS NOT NULL)
  )
);

-- Prevent duplicate registrations for internal students and external guests
CREATE UNIQUE INDEX IF NOT EXISTS unique_student_event_registration
  ON public.registrations (event_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS unique_guest_event_registration
  ON public.registrations (event_id, lower(guest_details->>'email'))
  WHERE guest_details IS NOT NULL;

-- 4. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Security Helper Functions (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_my_college()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT college FROM public.profiles WHERE id = auth.uid();
$$;

-- Safe lookup for login validation without exposing profile PII
CREATE OR REPLACE FUNCTION public.is_email_registered(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = auth, public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE lower(email) = lower(trim(p_email))
  );
$$;

REVOKE ALL ON FUNCTION public.get_my_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

REVOKE ALL ON FUNCTION public.get_my_college() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_college() TO authenticated;

REVOKE ALL ON FUNCTION public.is_email_registered(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_email_registered(TEXT) TO anon, authenticated;

-- 6. Automatic Profile Creation Trigger on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_name TEXT;
  v_college TEXT;
  v_department TEXT;
  v_year INTEGER;
  v_avatar TEXT;
BEGIN
  v_role := COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'role'), ''), 'student');
  IF v_role NOT IN ('student', 'faculty', 'hod') THEN
    v_role := 'student';
  END IF;

  v_name := COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'name'), ''), split_part(NEW.email, '@', 1));
  v_college := COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'college'), ''), 'Annapoorana Engineering College, Salem');
  v_department := NULLIF(trim(NEW.raw_user_meta_data->>'department'), '');
  v_avatar := NULLIF(trim(NEW.raw_user_meta_data->>'avatar_url'), '');

  BEGIN
    v_year := NULLIF(trim(NEW.raw_user_meta_data->>'year'), '')::INTEGER;
  EXCEPTION WHEN OTHERS THEN
    v_year := NULL;
  END;

  INSERT INTO public.profiles (id, name, email, role, college, department, year, avatar_url)
  VALUES (NEW.id, v_name, lower(NEW.email), v_role, v_college, v_department, v_year, v_avatar)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 7. Confirm any existing unverified users (safe migration, deletes nothing)
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- 8. Prevent Privilege Escalation on Profile Updates
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow service_role / postgres admin to alter role, college, or email
  IF auth.uid() IS NOT NULL THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Unauthorized: You cannot change your own role.';
    END IF;
    IF NEW.college IS DISTINCT FROM OLD.college THEN
      RAISE EXCEPTION 'Unauthorized: You cannot change your college.';
    END IF;
    IF NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'Unauthorized: Email cannot be modified directly.';
    END IF;
    IF NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'Unauthorized: User ID cannot be modified.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_privilege_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- 9. Enforce Event Status & Ownership Rules at Database Level
CREATE OR REPLACE FUNCTION public.enforce_event_mutation_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_college TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  SELECT role, college INTO v_role, v_college
  FROM public.profiles
  WHERE id = auth.uid();

  IF TG_OP = 'INSERT' THEN
    IF v_role <> 'faculty' THEN
      RAISE EXCEPTION 'Only faculty members can create events.';
    END IF;
    NEW.created_by := auth.uid();
    NEW.college := v_college;
    NEW.status := 'pending'; -- Always force initial pending approval status
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.created_by IS DISTINCT FROM OLD.created_by OR NEW.college IS DISTINCT FROM OLD.college THEN
      RAISE EXCEPTION 'Event ownership and college cannot be changed.';
    END IF;

    IF NEW.status IS DISTINCT FROM OLD.status THEN
      -- Only HOD/Management of the SAME college may approve, reject, or complete events
      IF v_role <> 'hod' OR OLD.college <> v_college THEN
        RAISE EXCEPTION 'Unauthorized: Only HOD/Management of this college can change event approval status.';
      END IF;
    ELSE
      IF NOT ((v_role = 'faculty' AND OLD.created_by = auth.uid()) OR (v_role = 'hod' AND OLD.college = v_college)) THEN
        RAISE EXCEPTION 'Unauthorized to modify this event.';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_event_mutation_rules ON public.events;
CREATE TRIGGER trg_enforce_event_mutation_rules
  BEFORE INSERT OR UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_event_mutation_rules();

-- 10. Automatic System Notifications Triggers (Prevents client-side notification spoofing)
CREATE OR REPLACE FUNCTION public.notify_on_event_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'approved' THEN
    INSERT INTO public.notifications (user_id, message, event_id)
    SELECT id,
           'New event published: "' || NEW.title || '" is now open for registration.',
           NEW.id
    FROM public.profiles
    WHERE role = 'student' AND college = NEW.college;
  END IF;

  IF OLD.status = 'approved' AND NEW.status = 'approved' AND (
    OLD.title IS DISTINCT FROM NEW.title OR
    OLD.date IS DISTINCT FROM NEW.date OR
    OLD.time IS DISTINCT FROM NEW.time OR
    OLD.venue IS DISTINCT FROM NEW.venue OR
    OLD.description IS DISTINCT FROM NEW.description
  ) THEN
    INSERT INTO public.notifications (user_id, message, event_id)
    SELECT DISTINCT user_id,
           'Event updated: Details for "' || NEW.title || '" have changed.',
           NEW.id
    FROM public.registrations
    WHERE event_id = NEW.id AND user_id IS NOT NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_event_change ON public.events;
CREATE TRIGGER trg_notify_on_event_change
  AFTER UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_event_change();

CREATE OR REPLACE FUNCTION public.notify_on_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_title TEXT;
  v_creator_id UUID;
  v_registrant_name TEXT;
BEGIN
  SELECT title, created_by INTO v_event_title, v_creator_id
  FROM public.events
  WHERE id = NEW.event_id;

  IF NEW.user_id IS NOT NULL THEN
    SELECT name INTO v_registrant_name FROM public.profiles WHERE id = NEW.user_id;
  ELSE
    v_registrant_name := COALESCE(NEW.guest_details->>'name', 'External Guest');
  END IF;

  IF v_creator_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, message, event_id)
    VALUES (
      v_creator_id,
      COALESCE(v_registrant_name, 'A participant') || ' has registered for your event: "' || COALESCE(v_event_title, 'Event') || '"',
      NEW.event_id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_registration ON public.registrations;
CREATE TRIGGER trg_notify_on_registration
  AFTER INSERT ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_registration();

-- 11. Secure Guest Registration RPC (No Login Required, Strictly Validated)
CREATE OR REPLACE FUNCTION public.register_guest_for_event(
  p_event_id UUID,
  p_name TEXT,
  p_college TEXT,
  p_department TEXT,
  p_email TEXT,
  p_phone TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event RECORD;
  v_clean_email TEXT;
  v_guest JSONB;
  v_reg_id UUID;
BEGIN
  IF trim(COALESCE(p_name, '')) = '' OR
     trim(COALESCE(p_college, '')) = '' OR
     trim(COALESCE(p_department, '')) = '' OR
     trim(COALESCE(p_email, '')) = '' OR
     trim(COALESCE(p_phone, '')) = '' THEN
    RAISE EXCEPTION 'All guest registration fields are required.';
  END IF;

  v_clean_email := lower(trim(p_email));
  IF v_clean_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN
    RAISE EXCEPTION 'Please provide a valid email address.';
  END IF;

  IF length(trim(p_phone)) < 7 OR length(trim(p_phone)) > 20 THEN
    RAISE EXCEPTION 'Please provide a valid phone number.';
  END IF;

  SELECT id, status, audience INTO v_event
  FROM public.events
  WHERE id = p_event_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found.';
  END IF;

  IF v_event.status <> 'approved' THEN
    RAISE EXCEPTION 'Registration is only allowed for approved events.';
  END IF;

  IF v_event.audience <> 'outer' THEN
    RAISE EXCEPTION 'Guests can only register for public inter-college events.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.registrations
    WHERE event_id = p_event_id
      AND guest_details IS NOT NULL
      AND lower(guest_details->>'email') = v_clean_email
  ) THEN
    RAISE EXCEPTION 'You have already registered for this event with this email.';
  END IF;

  v_guest := jsonb_build_object(
    'name', trim(p_name),
    'college', trim(p_college),
    'department', trim(p_department),
    'email', v_clean_email,
    'phone', trim(p_phone)
  );

  INSERT INTO public.registrations (event_id, user_id, guest_details, ticket_status)
  VALUES (p_event_id, NULL, v_guest, 'Confirmed')
  RETURNING id INTO v_reg_id;

  RETURN jsonb_build_object(
    'id', v_reg_id,
    'eventId', p_event_id,
    'guestDetails', v_guest,
    'ticketStatus', 'Confirmed'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.register_guest_for_event(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_guest_for_event(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- 12. Storage Bucket for Event Posters
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-posters',
  'event-posters',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

DROP POLICY IF EXISTS "Posters are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Faculty can upload posters" ON storage.objects;
DROP POLICY IF EXISTS "Faculty can update their own posters" ON storage.objects;
DROP POLICY IF EXISTS "Faculty can delete their own posters" ON storage.objects;

CREATE POLICY "Posters are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-posters');

CREATE POLICY "Faculty can upload posters"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-posters' AND
  auth.uid() IS NOT NULL AND
  public.get_my_role() = 'faculty' AND
  owner = auth.uid()
);

CREATE POLICY "Faculty can update their own posters"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'event-posters' AND
  auth.uid() = owner AND
  public.get_my_role() = 'faculty'
);

CREATE POLICY "Faculty can delete their own posters"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'event-posters' AND
  auth.uid() = owner AND
  public.get_my_role() = 'faculty'
);

-- 13. Row Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own or same-college staff profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.events;
DROP POLICY IF EXISTS "Public and authorized events are viewable" ON public.events;
DROP POLICY IF EXISTS "Faculty can create events" ON public.events;
DROP POLICY IF EXISTS "Faculty can update their own events" ON public.events;
DROP POLICY IF EXISTS "HOD can update any event status" ON public.events;
DROP POLICY IF EXISTS "HOD can update college event status" ON public.events;
DROP POLICY IF EXISTS "Faculty or HOD can delete authorized events" ON public.events;

DROP POLICY IF EXISTS "Users can view their own registrations" ON public.registrations;
DROP POLICY IF EXISTS "Faculty can view registrations for their events" ON public.registrations;
DROP POLICY IF EXISTS "HOD can view all registrations" ON public.registrations;
DROP POLICY IF EXISTS "HOD can view college registrations" ON public.registrations;
DROP POLICY IF EXISTS "Anyone can register" ON public.registrations;
DROP POLICY IF EXISTS "Students can register for eligible approved events" ON public.registrations;
DROP POLICY IF EXISTS "Students can cancel own registrations" ON public.registrations;
DROP POLICY IF EXISTS "Faculty can update registration status for own events" ON public.registrations;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

-- Profiles Policies
CREATE POLICY "Users can view own or same-college staff profiles"
ON public.profiles FOR SELECT
USING (
  auth.uid() = id OR (
    auth.uid() IS NOT NULL AND
    public.get_my_role() IN ('faculty', 'hod') AND
    college = public.get_my_college()
  )
);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (
  auth.uid() = id
);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id AND
  role = public.get_my_role() AND
  college = public.get_my_college()
);

-- Events Policies
CREATE POLICY "Public and authorized events are viewable"
ON public.events FOR SELECT
USING (
  (status = 'approved' AND audience = 'outer')
  OR
  (
    auth.uid() IS NOT NULL AND
    (
      (status IN ('approved', 'completed') AND audience = 'inter' AND college = public.get_my_college())
      OR
      (public.get_my_role() = 'faculty' AND created_by = auth.uid())
      OR
      (public.get_my_role() = 'hod' AND college = public.get_my_college())
    )
  )
);

CREATE POLICY "Faculty can create events"
ON public.events FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  public.get_my_role() = 'faculty' AND
  created_by = auth.uid() AND
  college = public.get_my_college() AND
  status = 'pending'
);

CREATE POLICY "Faculty can update their own events"
ON public.events FOR UPDATE
USING (
  auth.uid() = created_by AND
  public.get_my_role() = 'faculty'
)
WITH CHECK (
  auth.uid() = created_by AND
  college = public.get_my_college() AND
  status IN ('pending', 'rejected')
);

CREATE POLICY "HOD can update college event status"
ON public.events FOR UPDATE
USING (
  public.get_my_role() = 'hod' AND
  college = public.get_my_college()
)
WITH CHECK (
  college = public.get_my_college()
);

CREATE POLICY "Faculty or HOD can delete authorized events"
ON public.events FOR DELETE
USING (
  auth.uid() IS NOT NULL AND (
    (public.get_my_role() = 'faculty' AND created_by = auth.uid()) OR
    (public.get_my_role() = 'hod' AND college = public.get_my_college())
  )
);

-- Registrations Policies
CREATE POLICY "Users can view their own registrations"
ON public.registrations FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  auth.uid() = user_id
);

CREATE POLICY "Faculty can view registrations for their events"
ON public.registrations FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  public.get_my_role() = 'faculty' AND
  EXISTS (
    SELECT 1 FROM public.events
    WHERE id = event_id AND created_by = auth.uid()
  )
);

CREATE POLICY "HOD can view college registrations"
ON public.registrations FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  public.get_my_role() = 'hod' AND
  EXISTS (
    SELECT 1 FROM public.events
    WHERE id = event_id AND college = public.get_my_college()
  )
);

CREATE POLICY "Students can register for eligible approved events"
ON public.registrations FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  public.get_my_role() = 'student' AND
  auth.uid() = user_id AND
  guest_details IS NULL AND
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_id
      AND e.status = 'approved'
      AND (
        e.audience = 'outer' OR
        (e.audience = 'inter' AND e.college = public.get_my_college())
      )
  )
);

CREATE POLICY "Students can cancel own registrations"
ON public.registrations FOR DELETE
USING (
  auth.uid() IS NOT NULL AND
  auth.uid() = user_id
);

CREATE POLICY "Faculty can update registration status for own events"
ON public.registrations FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND
  public.get_my_role() = 'faculty' AND
  EXISTS (
    SELECT 1 FROM public.events
    WHERE id = event_id AND created_by = auth.uid()
  )
);

-- Notifications Policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  auth.uid() = user_id
);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND
  auth.uid() = user_id
);
