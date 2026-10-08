-- 이유식 설정을 아이별로. 비어 있으면(null) 다이어리(households)의 값을 그대로 쓴다.
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 실행하세요. (여러 번 실행해도 안전)

alter table public.babies add column if not exists feeding_style text;
alter table public.babies add column if not exists test_interval_days int;
alter table public.babies add column if not exists known_ingredients text[];

alter table public.babies drop constraint if exists babies_feeding_style_check;
alter table public.babies
  add constraint babies_feeding_style_check check (feeding_style is null or feeding_style in ('topping', 'porridge'));

alter table public.babies drop constraint if exists babies_test_interval_days_check;
alter table public.babies
  add constraint babies_test_interval_days_check check (test_interval_days is null or test_interval_days between 1 and 14);
