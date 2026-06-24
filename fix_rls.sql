-- Fix infinite recursion in Supabase RLS policies

-- 1. Create helper functions that bypass RLS (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_group_member(check_group_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = check_group_id
    AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_creator(check_group_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM shared_groups
    WHERE id = check_group_id
    AND created_by = auth.uid()
  );
$$;

-- 2. Drop the recursive policies
DROP POLICY IF EXISTS "Users can view groups they created or are members of" ON public.shared_groups;
DROP POLICY IF EXISTS "Users can view members of their groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can leave groups (delete their membership)" ON public.group_members;
DROP POLICY IF EXISTS "Users can view expenses in their groups" ON public.group_expenses;
DROP POLICY IF EXISTS "Users can add expenses to their groups" ON public.group_expenses;

-- 3. Recreate policies using the helper functions
-- Shared Groups
CREATE POLICY "Users can view groups they created or are members of"
  ON public.shared_groups FOR SELECT
  USING (created_by = auth.uid() OR public.is_group_member(id));

-- Group Members
CREATE POLICY "Users can view members of their groups"
  ON public.group_members FOR SELECT
  USING (user_id = auth.uid() OR public.is_group_member(group_id) OR public.is_group_creator(group_id));

CREATE POLICY "Users can leave groups (delete their membership)"
  ON public.group_members FOR DELETE
  USING (user_id = auth.uid() OR public.is_group_creator(group_id));

-- Group Expenses
CREATE POLICY "Users can view expenses in their groups"
  ON public.group_expenses FOR SELECT
  USING (public.is_group_member(group_id) OR public.is_group_creator(group_id));

CREATE POLICY "Users can add expenses to their groups"
  ON public.group_expenses FOR INSERT
  WITH CHECK (paid_by = auth.uid() AND (public.is_group_member(group_id) OR public.is_group_creator(group_id)));
