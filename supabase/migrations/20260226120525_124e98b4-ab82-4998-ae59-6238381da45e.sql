
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  interests TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Create user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'organizer', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  venue TEXT NOT NULL,
  total_seats INT NOT NULL DEFAULT 100,
  available_seats INT NOT NULL DEFAULT 100,
  image_url TEXT,
  organizer_id UUID REFERENCES auth.users(id),
  tags TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Organizers can create events" ON public.events FOR INSERT WITH CHECK (
  public.has_role(auth.uid(), 'organizer') OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Organizers can update own events" ON public.events FOR UPDATE USING (
  organizer_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
);

-- Create registrations table
CREATE TABLE public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'waitlisted', 'cancelled')),
  qr_code TEXT,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_id)
);

ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own registrations" ON public.registrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can register" ON public.registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can cancel own" ON public.registrations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Organizers can view event registrations" ON public.registrations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.events WHERE events.id = event_id AND (events.organizer_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "Admins can view all registrations" ON public.registrations FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Function to handle registration with seat management
CREATE OR REPLACE FUNCTION public.register_for_event(p_event_id UUID, p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_available INT;
  v_status TEXT;
  v_reg_id UUID;
  v_qr TEXT;
  v_existing UUID;
BEGIN
  -- Check existing registration
  SELECT id INTO v_existing FROM registrations WHERE user_id = p_user_id AND event_id = p_event_id AND status != 'cancelled';
  IF v_existing IS NOT NULL THEN
    RETURN json_build_object('error', 'Already registered for this event');
  END IF;

  -- Lock and check seats
  SELECT available_seats INTO v_available FROM events WHERE id = p_event_id FOR UPDATE;
  
  IF v_available IS NULL THEN
    RETURN json_build_object('error', 'Event not found');
  END IF;

  IF v_available > 0 THEN
    v_status := 'confirmed';
    UPDATE events SET available_seats = available_seats - 1 WHERE id = p_event_id;
  ELSE
    v_status := 'waitlisted';
  END IF;

  v_qr := encode(gen_random_uuid()::text::bytea, 'hex');

  INSERT INTO registrations (user_id, event_id, status, qr_code)
  VALUES (p_user_id, p_event_id, v_status, v_qr)
  RETURNING id INTO v_reg_id;

  RETURN json_build_object('id', v_reg_id, 'status', v_status, 'qr_code', v_qr);
END;
$$;

-- Function to cancel registration and promote waitlisted
CREATE OR REPLACE FUNCTION public.cancel_registration(p_reg_id UUID, p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
  v_status TEXT;
  v_next_id UUID;
BEGIN
  SELECT event_id, status INTO v_event_id, v_status FROM registrations WHERE id = p_reg_id AND user_id = p_user_id;
  
  IF v_event_id IS NULL THEN
    RETURN json_build_object('error', 'Registration not found');
  END IF;

  UPDATE registrations SET status = 'cancelled' WHERE id = p_reg_id;

  IF v_status = 'confirmed' THEN
    -- Promote next waitlisted user
    SELECT id INTO v_next_id FROM registrations 
    WHERE event_id = v_event_id AND status = 'waitlisted' 
    ORDER BY registered_at ASC LIMIT 1;

    IF v_next_id IS NOT NULL THEN
      UPDATE registrations SET status = 'confirmed' WHERE id = v_next_id;
    ELSE
      UPDATE events SET available_seats = available_seats + 1 WHERE id = v_event_id;
    END IF;
  END IF;

  RETURN json_build_object('success', true);
END;
$$;

-- Trigger for auto-creating profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for registrations and events
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.registrations;
