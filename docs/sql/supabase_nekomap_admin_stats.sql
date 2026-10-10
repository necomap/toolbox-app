-- NekoMap：管理画面（toolbox.lucke.jp/admin）向けの集計専用関数
-- 返すのは人数・件数などの「数字だけ」。個人情報は返さない。
-- 呼ぶには合言葉（p_token）が必要。合言葉そのものは保存せず、SHA-256 のハッシュだけを保存する。
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
  counts json;
begin
  if p_token is null or not exists (
    select 1 from private.admin_stats_token where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
  ) then
    return json_build_object('error', '合言葉が違います');
  end if;

  -- データ件数（存在するテーブルだけ数える）
  select coalesce(json_agg(json_build_object('label', t.label, 'n', t.n) order by t.ord), '[]'::json) into counts
  from (
    select v.ord, v.label,
      (xpath('/row/n/text()', query_to_xml(format('select count(*) as n from public.%I', v.tbl), false, true, '')))[1]::text::bigint as n
    from (values
      (1, '猫', 'cats'), (2, '目撃情報', 'sightings'), (3, 'ナワバリ', 'territories'),
      (4, '掲示板の投稿', 'posts'), (5, '迷い猫・保護の報告', 'stray_reports'),
      (6, '困りごとの報告', 'problem_reports'), (7, '譲渡', 'adoptions'), (8, '団体', 'organizations')
    ) as v(ord, label, tbl)
    where to_regclass('public.' || v.tbl) is not null
  ) t;

  select json_build_object(
    'users',    (select count(*) from auth.users),
    'active7',  (select count(*) from auth.users where last_sign_in_at >= now() - interval '7 days'),
    'active30', (select count(*) from auth.users where last_sign_in_at >= now() - interval '30 days'),
    'new7',     (select count(*) from auth.users where created_at >= now() - interval '7 days'),
    'new30',    (select count(*) from auth.users where created_at >= now() - interval '30 days'),
    'monthly',  (
      select json_agg(json_build_object('m', to_char(m, 'YYYY-MM'), 'n',
        (select count(*) from auth.users u where (u.created_at at time zone 'Asia/Tokyo') >= m and (u.created_at at time zone 'Asia/Tokyo') < m + interval '1 month')) order by m)
      from generate_series(date_trunc('month', now() at time zone 'Asia/Tokyo') - interval '11 months', date_trunc('month', now() at time zone 'Asia/Tokyo'), interval '1 month') as m
    ),
    'counts', counts,
    'activeNote', '「利用」は最後にログインした日で判定（ログインしたままの人は数えられません）'
  ) into r;
  return r;
end;
$$;

revoke all on function public.admin_app_stats(text) from public;
grant execute on function public.admin_app_stats(text) to anon, authenticated;
