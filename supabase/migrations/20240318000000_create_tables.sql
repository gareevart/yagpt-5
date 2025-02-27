-- Create profiles table
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  yandex_api_key text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create conversations table
create table conversations (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  messages jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table profiles enable row level security;
alter table conversations enable row level security;

-- Create policies
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on profiles
  for insert with check (auth.uid() = id);

create policy "Users can view own conversations" on conversations
  for select using (auth.uid() = user_id);

create policy "Users can insert own conversations" on conversations
  for insert with check (auth.uid() = user_id);

create policy "Users can update own conversations" on conversations
  for update using (auth.uid() = user_id);

create policy "Users can delete own conversations" on conversations
  for delete using (auth.uid() = user_id); 