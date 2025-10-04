-- Drop the existing policy
DROP POLICY IF EXISTS "Admins can manage test questions" ON public.test_questions;

-- Create separate policies for better control
CREATE POLICY "Authenticated users can insert test questions"
ON public.test_questions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update test questions"
ON public.test_questions
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete test questions"
ON public.test_questions
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);