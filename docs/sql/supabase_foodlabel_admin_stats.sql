-- FoodLabel Pro：管理画面（toolbox.lucke.jp/admin）向けの集計専用関数
-- 返すのは人数・件数などの「数字だけ」。個人情報は返さない。
-- ユーザーは public.users（NextAuth・Prisma 管理）。admin プランは集計から除く。
-- 「利用」はレシピの更新・ラベル印刷・Excel入出力のいずれかをした人で判定する。
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.admin_stats_token (token_hash text primary key);
revoke all on private.admin_stats_token from public, anon, authenticated;

create or replace function public.admin_app_stats(p_token text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  r json;
begin
  if p_token is null or not exists (
    select 1 from private.admin_stats_token where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
  ) then
    return json_build_object('error', '合言葉が違います');
  end if;

  with u as (
    select id, "createdAt" as created_at, plan::text as plan from public.users where plan::text <> 'admin'
  ),
  act as (
    select "userId" as uid, "updatedAt" as at from public.recipes
    union all select "userId", "createdAt" from public.label_print_logs
    union all select "userId", "createdAt" from public.data_transfer_logs
  )
  select json_build_object(
    'users',    (select count(*) from u),
    'active7',  (select count(distinct a.uid) from act a join u on u.id = a.uid where a.at >= now() - interval '7 days'),
    'active30', (select count(distinct a.uid) from act a join u on u.id = a.uid where a.at >= now() - interval '30 days'),
    'new7',     (select count(*) from u where created_at >= now() - interval '7 days'),
    'new30',    (select count(*) from u where created_at >= now() - interval '30 days'),
    'monthly',  (
      select json_agg(json_build_object('m', to_char(m, 'YYYY-MM'), 'n',
        (select count(*) from u where (u.created_at at time zone 'Asia/Tokyo') >= m and (u.created_at at time zone 'Asia/Tokyo') < m + interval '1 month')) order by m)
      from generate_series(date_trunc('month', now() at time zone 'Asia/Tokyo') - interval '11 months', date_trunc('month', now() at time zone 'Asia/Tokyo'), interval '1 month') as m
    ),
    'counts', json_build_array(
      json_build_object('label', '有料（プレミアム）', 'n', (select count(*) from u where plan = 'premium')),
      json_build_object('label', '有料（プロ）', 'n', (select count(*) from u where plan = 'pro')),
      json_build_object('label', '店舗', 'n', (select count(*) from public.shops)),
      json_build_object('label', 'レシピ', 'n', (select count(*) from public.recipes)),
      json_build_object('label', '原材料', 'n', (select count(*) from public.ingredients)),
      json_build_object('label', 'ラベル', 'n', (select count(*) from public.labels)),
      json_build_object('label', '30日間のラベル印刷枚数', 'n', (select coalesce(sum("printCount"), 0) from public.label_print_logs where "createdAt" >= now() - interval '30 days'))
    ),
    'activeNote', '「利用」はレシピの更新・ラベル印刷・Excel入出力をした人'
  ) into r;
  return r;
end;
$$;

revoke all on function public.admin_app_stats(text) from public;
grant execute on function public.admin_app_stats(text) to anon, authenticated;
