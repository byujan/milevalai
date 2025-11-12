-- MilEvalAI Database Schema
-- This file contains the SQL commands to set up your Supabase database

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create evaluations table
create table if not exists public.evaluations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  duty_title text not null,
  evaluation_type text not null check (evaluation_type in ('NCOER', 'OER')),
  evaluation_subtype text not null check (evaluation_subtype in ('Annual', 'Change of Rater', 'Relief for Cause')),
  rank_level text not null check (rank_level in ('O1-O3', 'O4-O5', 'O6', 'E5', 'E6-E8', 'E9')),
  status text not null default 'draft' check (status in ('draft', 'bullets_complete', 'narrative_complete', 'completed')),
  bullets jsonb,
  narrative text,
  form_data jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index on user_id for faster queries
create index if not exists evaluations_user_id_idx on public.evaluations(user_id);

-- Create index on created_at for sorting
create index if not exists evaluations_created_at_idx on public.evaluations(created_at desc);

-- Enable Row Level Security
alter table public.evaluations enable row level security;

-- Create policy to allow users to read their own evaluations
create policy "Users can view their own evaluations"
  on public.evaluations for select
  using (auth.uid() = user_id);

-- Create policy to allow users to insert their own evaluations
create policy "Users can create their own evaluations"
  on public.evaluations for insert
  with check (auth.uid() = user_id);

-- Create policy to allow users to update their own evaluations
create policy "Users can update their own evaluations"
  on public.evaluations for update
  using (auth.uid() = user_id);

-- Create policy to allow users to delete their own evaluations
create policy "Users can delete their own evaluations"
  on public.evaluations for delete
  using (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create trigger to update updated_at on row update
create trigger handle_evaluations_updated_at
  before update on public.evaluations
  for each row
  execute function public.handle_updated_at();

