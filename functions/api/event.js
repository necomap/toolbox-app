// 道具箱の匿名の利用記録を受け取る（ページ名・操作・ランダム番号のみ。入力内容やIPは保存しない）
import {db, jstDay} from '../../server/db.js';

const PAGES = new Set(['index','gensen','invoice','nouzei','anbun','jikyu','shohizei','genka','inshi','furusato','apps','backup','privacy','404']);
const EVENTS = /^(view|use|print|csv|backup|restore|amazon|app:[a-z0-9-]{1,20})$/;

export async function onRequestPost({request, env}){
  const origin = request.headers.get('Origin') || request.headers.get('Referer') || '';
  const host = new URL(request.url).host;
  if (origin && !origin.includes(host)) return new Response(null, {status: 204}); // 他サイトからの送信は無視
  let b;
  try { b = JSON.parse(await request.text()); } catch(e){ return new Response(null, {status: 400}); }
  if (!b || !PAGES.has(b.t) || !EVENTS.test(b.e || '') || !/^[0-9a-f]{16}$/.test(b.v || '')) return new Response(null, {status: 400});
  try {
    await (await db(env)).prepare('INSERT OR IGNORE INTO ev (day, tool, ev, vid) VALUES (?, ?, ?, ?)').bind(jstDay(), b.t, b.e, b.v).run();
  } catch(e){ return new Response(null, {status: 503}); }
  return new Response(null, {status: 204});
}
export function onRequestGet(){ return new Response('Method Not Allowed', {status: 405}); }
