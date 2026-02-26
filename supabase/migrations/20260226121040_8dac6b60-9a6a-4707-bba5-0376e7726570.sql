
-- Allow organizers/admins to view profiles for participant lists
CREATE POLICY "Organizers can view profiles" ON public.profiles
FOR SELECT USING (
  public.has_role(auth.uid(), 'organizer') OR public.has_role(auth.uid(), 'admin')
);
