-- Supabase Schema for Tropical Voyage Splitter
-- Safe to run even if tables already exist

-- 0. Drop existing tables (in reverse dependency order)
DROP TABLE IF EXISTS public.group_expenses CASCADE;
DROP TABLE IF EXISTS public.group_members CASCADE;
DROP TABLE IF EXISTS public.shared_groups CASCADE;
DROP TABLE IF EXISTS public.personal_expenses CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Also drop existing trigger/function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 1. Create the tables
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.personal_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  amount DECIMAL(10,2) CHECK (amount > 0),
  description TEXT NOT NULL,
  category TEXT CHECK (category IN ('Food', 'Transport', 'Entertainment', 'Shopping', 'Utilities', 'Health', 'Other')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.shared_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.shared_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (group_id, user_id)
);

CREATE TABLE public.group_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.shared_groups(id) ON DELETE CASCADE,
  paid_by UUID NOT NULL REFERENCES public.users(id),
  amount DECIMAL(10,2) CHECK (amount > 0),
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_expenses ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies

-- Users
CREATE POLICY "Users can only read and update their own profile"
  ON public.users FOR ALL
  USING (id = auth.uid());

-- Personal Expenses
CREATE POLICY "Users can manage their own personal expenses"
  ON public.personal_expenses FOR ALL
  USING (user_id = auth.uid());

-- Shared Groups
CREATE POLICY "Users can view groups they created or are members of"
  ON public.shared_groups FOR SELECT
  USING (
    created_by = auth.uid() OR
    id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create groups"
  ON public.shared_groups FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Creators can delete their groups"
  ON public.shared_groups FOR DELETE
  USING (created_by = auth.uid());

-- Group Members
CREATE POLICY "Users can view members of their groups"
  ON public.group_members FOR SELECT
  USING (
    group_id IN (SELECT id FROM public.shared_groups WHERE created_by = auth.uid()) OR
    group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can add themselves to groups"
  ON public.group_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave groups (delete their membership)"
  ON public.group_members FOR DELETE
  USING (user_id = auth.uid() OR group_id IN (SELECT id FROM public.shared_groups WHERE created_by = auth.uid()));

-- Group Expenses
CREATE POLICY "Users can view expenses in their groups"
  ON public.group_expenses FOR SELECT
  USING (
    group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()) OR
    group_id IN (SELECT id FROM public.shared_groups WHERE created_by = auth.uid())
  );

CREATE POLICY "Users can add expenses to their groups"
  ON public.group_expenses FOR INSERT
  WITH CHECK (
    paid_by = auth.uid() AND
    (
      group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()) OR
      group_id IN (SELECT id FROM public.shared_groups WHERE created_by = auth.uid())
    )
  );

-- 4. Function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$;

-- 5. Trigger to automatically create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
