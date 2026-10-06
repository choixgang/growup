-- 이유식 다이어리 Supabase 스키마
-- Supabase 대시보드 > SQL Editor 에 통째로 붙여넣고 실행하세요.

-- ─── 테이블 ────────────────────────────────────────────────

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null unique default upper(substr(md5(random()::text), 1, 6)),
  test_interval_days int not null default 3 check (test_interval_days between 1 and 14),
  known_ingredients text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

-- 아기는 여러 명을 받을 수 있게 둔다 (UI는 현재 한 명만 사용)
create table if not exists public.babies (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  birth_date date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references public.babies(id) on delete cascade,
  date date not null,
  slot int not null default 1,
  items jsonb not null default '[]',
  log jsonb,
  updated_at timestamptz not null default now()
);
create index if not exists meals_baby_date on public.meals (baby_id, date);

create table if not exists public.month_notes (
  baby_id uuid not null references public.babies(id) on delete cascade,
  month text not null, -- yyyy-MM
  stage text not null default 'early' check (stage in ('early', 'middle', 'late')),
  caution text not null default '',
  goal text not null default '',
  primary key (baby_id, month)
);

create table if not exists public.week_notes (
  baby_id uuid not null references public.babies(id) on delete cascade,
  week_start date not null,
  memo text not null default '',
  checklist jsonb not null default '[]',
  primary key (baby_id, week_start)
);

-- ─── 권한 확인 함수 ────────────────────────────────────────

create or replace function public.is_household_member(hid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from household_members where household_id = hid and user_id = auth.uid());
$$;

create or replace function public.can_access_baby(bid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from babies b join household_members m on m.household_id = b.household_id
    where b.id = bid and m.user_id = auth.uid()
  );
$$;

-- ─── RLS ──────────────────────────────────────────────────

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.babies enable row level security;
alter table public.meals enable row level security;
alter table public.month_notes enable row level security;
alter table public.week_notes enable row level security;

drop policy if exists "members read household" on public.households;
create policy "members read household" on public.households
  for select using (public.is_household_member(id));
drop policy if exists "members update household" on public.households;
create policy "members update household" on public.households
  for update using (public.is_household_member(id));

drop policy if exists "members read membership" on public.household_members;
create policy "members read membership" on public.household_members
  for select using (public.is_household_member(household_id));

drop policy if exists "members manage babies" on public.babies;
create policy "members manage babies" on public.babies
  for all using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));

drop policy if exists "members manage meals" on public.meals;
create policy "members manage meals" on public.meals
  for all using (public.can_access_baby(baby_id)) with check (public.can_access_baby(baby_id));

drop policy if exists "members manage month notes" on public.month_notes;
create policy "members manage month notes" on public.month_notes
  for all using (public.can_access_baby(baby_id)) with check (public.can_access_baby(baby_id));

drop policy if exists "members manage week notes" on public.week_notes;
create policy "members manage week notes" on public.week_notes
  for all using (public.can_access_baby(baby_id)) with check (public.can_access_baby(baby_id));

-- ─── 가정 만들기 / 참여 ────────────────────────────────────

create or replace function public.create_household(baby_name text, baby_birth_date date)
returns uuid language plpgsql security definer set search_path = public as $$
declare hid uuid;
begin
  if auth.uid() is null then raise exception '로그인이 필요해요'; end if;
  insert into households default values returning id into hid;
  insert into household_members (household_id, user_id) values (hid, auth.uid());
  insert into babies (household_id, name, birth_date) values (hid, baby_name, baby_birth_date);
  return hid;
end;
$$;

create or replace function public.join_household(code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare hid uuid;
begin
  if auth.uid() is null then raise exception '로그인이 필요해요'; end if;
  select id into hid from households where invite_code = upper(trim(code));
  if hid is null then raise exception '초대 코드를 찾을 수 없어요'; end if;
  insert into household_members (household_id, user_id) values (hid, auth.uid())
    on conflict do nothing;
  return hid;
end;
$$;

grant execute on function public.create_household(text, date) to authenticated;
grant execute on function public.join_household(text) to authenticated;

-- ─── 실시간 공유 ──────────────────────────────────────────

do $$
begin
  begin alter publication supabase_realtime add table public.meals; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.month_notes; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.week_notes; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.households; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.babies; exception when duplicate_object then null; end;
end $$;

-- ─── 사진 저장소 ──────────────────────────────────────────
-- 공개 버킷이지만 경로가 추측 불가능한 UUID라 링크를 아는 사람만 볼 수 있다.
-- 업로드·삭제는 해당 아기의 가정 구성원만 가능.

insert into storage.buckets (id, name, public)
values ('meal-photos', 'meal-photos', true)
on conflict (id) do nothing;

drop policy if exists "members upload meal photos" on storage.objects;
create policy "members upload meal photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'meal-photos' and public.can_access_baby(((storage.foldername(name))[1])::uuid));

drop policy if exists "members delete meal photos" on storage.objects;
create policy "members delete meal photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'meal-photos' and public.can_access_baby(((storage.foldername(name))[1])::uuid));
