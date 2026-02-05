-- Add is_pinned column to memories table
ALTER TABLE public.memories ADD COLUMN is_pinned BOOLEAN NOT NULL DEFAULT false;
