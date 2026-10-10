import {db, json} from '../../../server/db.js';
import {checkPassword, makeCookie, sha256} from '../../../server/auth.js';

const LIMIT = 10, WINDOW = 3600; // 1時間に10回まで失敗できる

export async function onRequestPost({request, env}){
  if (!env.ADMIN_PASSWORD || env.ADMIN_PASSWORD.length < 8) return json({error: '管理パスワード（ADMIN_PASSWORD）が未設定か、8文字未満です。Cloudflare の設定を確認してください。'}, 503);
  const d = await db(env), now = Math.floor(Date.now() / 1000);
  const who = (await sha256('ip:' + (request.headers.get('CF-Connecting-IP') || 'local'))).slice(0, 16);
  await d.prepare('DELETE FROM login_fail WHERE ts < ?').bind(now - WINDOW).run();
  const {n} = await d.prepare('SELECT COUNT(*) AS n FROM login_fail WHERE who = ?').bind(who).first();
  if (n >= LIMIT) return json({error: 'ログインの失敗が続いたため、1時間ほど待ってからお試しください。'}, 429);
  let pw = '';
  try { pw = String((await request.json()).password || ''); } catch(e){}
  if (!(await checkPassword(env, pw))){
    await d.prepare('INSERT INTO login_fail (who, ts) VALUES (?, ?)').bind(who, now).run();
    await new Promise(r => setTimeout(r, 800));
    return json({error: 'パスワードが違います。'}, 401);
  }
  await d.prepare('DELETE FROM login_fail WHERE who = ?').bind(who).run();
  return json({ok: true}, 200, {'Set-Cookie': await makeCookie(env)});
}
