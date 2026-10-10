// 管理画面の集計データ（ログインしているときだけ返す）
import {db, json, jstDay} from '../../../server/db.js';
import {isAdmin} from '../../../server/auth.js';
import {APPS} from '../../../server/apps.js';
import {firebaseStats} from '../../../server/firebase.js';
import {supabaseStats} from '../../../server/supabase.js';

function withTimeout(p, ms){ return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('時間切れ（' + ms / 1000 + '秒）')), ms))]); }

async function appStats(env){
  return Promise.all(APPS.map(async a => {
    const base = {id: a.id, name: a.name, site: a.site, type: a.type};
    const secret = env[a.secret];
    if (!secret) return {...base, status: 'unset', message: 'Cloudflare の環境変数 ' + a.secret + ' が未設定です'};
    try {
      const s = await withTimeout(a.type === 'firebase' ? firebaseStats(a, secret) : supabaseStats(a, secret), 20000);
      if (a.type === 'firebase' && !(a.counts || []).length) s.note = 'データ件数を数えるコレクションは未設定です（server/apps.js）';
      return {...base, status: 'ok', ...s};
    } catch(e){ return {...base, status: 'error', message: String(e.message || e)}; }
  }));
}

export async function onRequestGet({request, env, waitUntil}){
  if (!(await isAdmin(request, env))) return json({error: 'login'}, 401);
  const url = new URL(request.url);
  const days = Math.min(365, Math.max(1, parseInt(url.searchParams.get('days') || '30', 10) || 30));
  const from = jstDay(days - 1);
  const d = await db(env);
  const [byTool, daily, total] = await Promise.all([
    d.prepare('SELECT tool, ev, COUNT(DISTINCT vid) AS n FROM ev WHERE day >= ? GROUP BY tool, ev').bind(from).all(),
    d.prepare("SELECT day, ev, COUNT(DISTINCT vid) AS n FROM ev WHERE day >= ? AND ev IN ('view','use') GROUP BY day, ev ORDER BY day").bind(from).all(),
    d.prepare("SELECT ev, COUNT(DISTINCT vid) AS n FROM ev WHERE day >= ? AND ev IN ('view','use') GROUP BY ev").bind(from).all()
  ]);
  // アプリの集計は外部に問い合わせるので10分キャッシュ（?refresh=1 で取り直し）
  const cache = caches.default, key = new Request(url.origin + '/__admin_apps_cache');
  let apps = null;
  if (url.searchParams.get('refresh') !== '1'){ const c = await cache.match(key); if (c) apps = await c.json(); }
  if (!apps){
    apps = {at: new Date().toISOString(), list: await appStats(env)};
    waitUntil(cache.put(key, new Response(JSON.stringify(apps), {headers: {'Cache-Control': 'max-age=600'}})));
  }
  return json({days, from, to: jstDay(), toolbox: {byTool: byTool.results, daily: daily.results, total: total.results}, apps});
}
