-- 함께 쓰는 사람 목록 · 표시 이름 · 내보내기 · 초대 코드 바꾸기
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 실행하세요. (여러 번 실행해도 안전)
-- 다이어리를 만든 사람 = 가장 먼저 들어온 구성원. 그 사람이 나가면 다음으로 먼저 들어온 사람이 넘겨받는다.

alter table public.household_members add column if not exists display_name text;

create or replace function public.household_owner(hid uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select user_id from household_members where household_id = hid order by created_at, user_id limit 1;
$$;

create or replace function public.new_invite_code()
returns text language plpgsql volatile set search_path = public as $$
declare c text;
begin
  loop
    c := upper(substr(md5(random()::text), 1, 6));
    exit when not exists (select 1 from households where invite_code = c);
  end loop;
  return c;
end;
$$;

-- 내 표시 이름 (엄마, 아빠, 할머니…)
create or replace function public.set_display_name(name text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception '로그인이 필요해요'; end if;
  update household_members set display_name = nullif(left(trim(name), 20), '') where user_id = auth.uid();
end;
$$;

-- 같은 다이어리 사람에게는 표시 이름과 일부 가린 이메일(ab***@gmail.com)만 보여준다
create or replace function public.list_household_members(hid uuid)
returns table (user_id uuid, display_name text, masked_email text, joined_at timestamptz, is_owner boolean, is_me boolean)
language sql stable security definer set search_path = public as $$
  select
    m.user_id,
    m.display_name,
    case when u.email is null then null
      else left(split_part(u.email, '@', 1), 2) || '***@' || split_part(u.email, '@', 2) end,
    m.created_at,
    m.user_id = public.household_owner(hid),
    m.user_id = auth.uid()
  from household_members m
  join auth.users u on u.id = m.user_id
  where m.household_id = hid and public.is_household_member(hid)
  order by m.created_at;
$$;

-- 만든 사람만 다른 사람을 내보낼 수 있다. 내보낸 사람이 같은 코드로 다시 못 들어오게 코드도 바꾼다.
create or replace function public.remove_household_member(hid uuid, target uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception '로그인이 필요해요'; end if;
  if public.household_owner(hid) is distinct from auth.uid() then
    raise exception '다이어리를 만든 사람만 내보낼 수 있어요';
  end if;
  if target = auth.uid() then raise exception '나는 내보낼 수 없어요'; end if;
  delete from household_members where household_id = hid and user_id = target;
  update households set invite_code = public.new_invite_code() where id = hid;
end;
$$;

create or replace function public.regenerate_invite_code(hid uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception '로그인이 필요해요'; end if;
  if public.household_owner(hid) is distinct from auth.uid() then
    raise exception '다이어리를 만든 사람만 코드를 바꿀 수 있어요';
  end if;
  update households set invite_code = public.new_invite_code() where id = hid;
end;
$$;

grant execute on function public.set_display_name(text) to authenticated;
grant execute on function public.list_household_members(uuid) to authenticated;
grant execute on function public.remove_household_member(uuid, uuid) to authenticated;
grant execute on function public.regenerate_invite_code(uuid) to authenticated;
revoke execute on function public.new_invite_code() from public, anon, authenticated;

-- 구성원이 들어오고 나가는 걸 바로 반영 (내보내진 사람은 앱이 첫 화면으로 돌아간다)
do $$
begin
  begin alter publication supabase_realtime add table public.household_members; exception when duplicate_object then null; end;
end $$;
