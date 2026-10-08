-- 죽/토핑 이유식 방식.
-- households.feeding_style: 새 끼니를 적을 때 먼저 보일 방식 (설정에서 변경)
-- meals.style / title / total_ml: 끼니별 방식, 죽 이름, 죽 전체 용량(ml)
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 실행하세요. (여러 번 실행해도 안전)

alter table public.households
  add column if not exists feeding_style text not null default 'topping';

alter table public.households drop constraint if exists households_feeding_style_check;
alter table public.households
  add constraint households_feeding_style_check check (feeding_style in ('topping', 'porridge'));

alter table public.meals add column if not exists style text;
alter table public.meals add column if not exists title text;
alter table public.meals add column if not exists total_ml numeric;
