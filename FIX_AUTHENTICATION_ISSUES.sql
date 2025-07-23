-- Fix Authentication Issues - Create Admin User and Fix Policies
-- Created: 2025-07-23
-- Purpose: Fix website authentication and ensure admin access works

-- 1. CHECK CURRENT AUTHENTICATION STATE
-- See what users exist in the system
SELECT 
  u.id,
  u.email,
  u.created_at,
  p.role,
  p.full_name
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- 2. CREATE ADMIN USER PROFILE (if missing)
-- Replace 'your-email@example.com' with your actual email
-- This will create a profile for any existing auth user without one

INSERT INTO public.profiles (id, email, role, full_name, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  'admin',
  COALESCE(u.raw_user_meta_data->>'full_name', 'Admin User'),
  NOW(),
  NOW()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  updated_at = NOW();

-- 3. ENSURE ADMIN ROLE FOR SPECIFIC EMAIL
-- Replace 'your-email@example.com' with your actual email address
UPDATE public.profiles 
SET role = 'admin', updated_at = NOW()
WHERE email = 'your-email@example.com';

-- If you don't know your email, update the first user to be admin:
UPDATE public.profiles 
SET role = 'admin', updated_at = NOW()
WHERE id = (
  SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
);

-- 4. FIX PROFILES TABLE POLICIES
-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile (except role)" ON public.profiles;
DROP POLICY IF EXISTS "Users can create own profile during signup" ON public.profiles;

-- Create comprehensive profile policies
-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow users to update their own profile (admins can update roles)
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND (
    -- Allow role changes only if user is admin OR role is not being changed
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' OR 
    OLD.role = NEW.role
  )
);

-- Allow profile creation during signup
CREATE POLICY "Users can create profile during signup"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 5. FIX GET_USER_ROLE FUNCTION
-- Ensure the function exists and works correctly
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM public.profiles 
    WHERE id = user_id
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO anon;

-- 6. TEST AUTHENTICATION SETUP
-- Check if admin user exists
SELECT 
  'Admin user check:' as test,
  COUNT(*) as admin_count
FROM public.profiles 
WHERE role = 'admin';

-- Check if get_user_role function works
SELECT 
  'Function test:' as test,
  public.get_user_role(id) as user_role,
  email
FROM public.profiles 
WHERE role = 'admin'
LIMIT 1;

-- 7. RESET PASSWORD INSTRUCTIONS
-- If you can't login, you may need to reset your password
-- Go to: https://supabase.com/dashboard/project/ngucthauvvjajdjcdrvl/auth/users
-- Find your user and click "Send password reset email"

-- 8. CREATE TEST USER (OPTIONAL)
-- Uncomment and modify if you need a new test admin user
/*
-- First, you need to create the user in Supabase Auth UI, then run:
INSERT INTO public.profiles (id, email, role, full_name)
VALUES (
  'USER_ID_FROM_AUTH_USERS_TABLE',
  'test-admin@example.com',
  'admin',
  'Test Admin'
);
*/

-- SUCCESS MESSAGE
SELECT 'Authentication setup complete! Check the results above and try logging in.' as status;
