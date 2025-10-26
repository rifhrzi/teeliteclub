-- Adds maintenance_notifications table for waitlist signups during maintenance mode
CREATE TABLE public.maintenance_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  notify_at timestamptz,
  notified_at timestamptz,
  admin_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT maintenance_notifications_email_key UNIQUE (email)
);

ALTER TABLE public.maintenance_notifications ENABLE ROW LEVEL SECURITY;

-- Allow anonymous visitors to register their email
CREATE POLICY "Allow inserts for maintenance waitlist" ON public.maintenance_notifications
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow admins to review and manage notifications
CREATE POLICY "Admins manage maintenance waitlist" ON public.maintenance_notifications
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Service role (Edge Functions) can manage notifications without restriction
GRANT ALL ON TABLE public.maintenance_notifications TO service_role;

COMMENT ON TABLE public.maintenance_notifications IS 'Emails collected during maintenance; admins can notify when product launches.';
