-- ==========================================
-- SUPABASE SCHEMA FOR APP MOTOS (Idempotent)
-- ==========================================

-- 1. PROFILES TABLE (Motociclistas)
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  name text,
  bike_model text,
  avatar_url text,
  latitude double precision,
  longitude double precision,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);

drop policy if exists "Users can insert their own profile." on public.profiles;
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile." on public.profiles;
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- Trigger to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, bike_model)
  values (new.id, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'bike_model')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. TRIPS TABLE (Destinos en Común)
create table if not exists public.trips (
  id uuid default gen_random_uuid() primary key,
  destination text not null,
  date text not null,
  organizer_id uuid references public.profiles(id) not null,
  members_count integer default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.trips enable row level security;
drop policy if exists "Trips are viewable by everyone." on public.trips;
create policy "Trips are viewable by everyone." on public.trips for select using (true);

drop policy if exists "Authenticated users can create trips." on public.trips;
create policy "Authenticated users can create trips." on public.trips for insert with check (auth.role() = 'authenticated');


-- 3. MESSAGES TABLE (Chat en Tiempo Real)
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.messages enable row level security;
drop policy if exists "Messages are viewable by everyone." on public.messages;
create policy "Messages are viewable by everyone." on public.messages for select using (true);

drop policy if exists "Authenticated users can send messages." on public.messages;
create policy "Authenticated users can send messages." on public.messages for insert with check (auth.role() = 'authenticated');


-- 4. MEETING PLACES TABLE (Lugares Promocionados)
create table if not exists public.meeting_places (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  latitude double precision not null,
  longitude double precision not null,
  photo_url text,
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.meeting_places enable row level security;
drop policy if exists "Meeting places are viewable by everyone." on public.meeting_places;
create policy "Meeting places are viewable by everyone." on public.meeting_places for select using (true);

drop policy if exists "Authenticated users can add meeting places." on public.meeting_places;
create policy "Authenticated users can add meeting places." on public.meeting_places for insert with check (auth.role() = 'authenticated');


-- ==========================================
-- ENABLE REALTIME FOR CHAT & GPS TRACKING
-- ==========================================
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.profiles;
exception when duplicate_object then null;
end $$;
