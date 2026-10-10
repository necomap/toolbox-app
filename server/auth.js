// 管理画面のログイン（パスワードは Cloudflare の環境変数 ADMIN_PASSWORD。コードには書かない）
const enc = new TextEncoder();
const COOKIE = 'tb_admin';
const MAX_AGE = 7 * 86400; // 7日

async function hmac(key, msg){
  const k = await crypto.subtle.importKey('raw', enc.encode(key), {name: 'HMAC', hash: 'SHA-256'}, false, ['sign']);
  return [...new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(msg)))].map(b => b.toString(16).padStart(2, '0')).join('');
}
export async function sha256(s){
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s)))].map(b => b.toString(16).padStart(2, '0')).join('');
}
function same(a, b){ // 長さが同じなら時間差の出にくい比較
  if (a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
export async function checkPassword(env, input){
  if (!env.ADMIN_PASSWORD || env.ADMIN_PASSWORD.length < 8) return false;
  return same(await sha256('pw:' + input), await sha256('pw:' + env.ADMIN_PASSWORD));
}
export async function makeCookie(env){
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const v = exp + '.' + await hmac(env.ADMIN_PASSWORD, 'admin:' + exp);
  return `${COOKIE}=${v}; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=${MAX_AGE}`;
}
export function clearCookie(){
  return `${COOKIE}=; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}
export async function isAdmin(request, env){
  if (!env.ADMIN_PASSWORD) return false;
  const m = (request.headers.get('Cookie') || '').match(new RegExp(COOKIE + '=(\\d+)\\.([0-9a-f]{64})'));
  if (!m || +m[1] < Date.now() / 1000) return false;
  return same(m[2], await hmac(env.ADMIN_PASSWORD, 'admin:' + m[1]));
}
