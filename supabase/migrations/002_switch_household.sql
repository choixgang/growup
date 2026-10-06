-- 초대 코드로 참여할 때, 이미 다른 다이어리(예: 실수로 "새로 시작"한 것)에 있으면
-- 그곳에서 나와서 옮겨간다. 아무도 남지 않은 다이어리는 기록과 함께 지운다.
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 실행하세요. (여러 번 실행해도 안전)

create or replace function public.join_household(code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  hid uuid;
  old_ids uuid[];
begin
  if auth.uid() is null then raise exception '로그인이 필요해요'; end if;
  select id into hid from households where invite_code = upper(trim(code));
  if hid is null then raise exception '초대 코드를 찾을 수 없어요'; end if;

  select coalesce(array_agg(household_id), '{}') into old_ids
    from household_members where user_id = auth.uid() and household_id <> hid;

  delete from household_members where user_id = auth.uid() and household_id <> hid;

  delete from households h
    where h.id = any(old_ids)
      and not exists (select 1 from household_members m where m.household_id = h.id);

  insert into household_members (household_id, user_id) values (hid, auth.uid())
    on conflict do nothing;
  return hid;
end;
$$;

grant execute on function public.join_household(text) to authenticated;
