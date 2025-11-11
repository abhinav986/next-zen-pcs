-- Add unique constraint to user_progress table for upsert operations
ALTER TABLE public.user_progress 
ADD CONSTRAINT user_progress_unique_constraint 
UNIQUE (user_id, subject_id, chapter_id, topic_id);