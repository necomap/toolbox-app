// Firebase（Authentication と Firestore）を REST で読む。鍵はサービスアカウントの JSON
import {summarize} from './summary.js';

const tokenCache = new Map();
async function readJson(r){ const t = await r.text(); try { return JSON.parse(t); } catch(e){ return {error: {message: 'HTTP ' + r.status + '：' + t.slice(0, 80)}}; } }
function b64url(buf){
  const s = typeof buf === 'string' ? btoa(unescape(encodeURIComponent(buf))) : btoa(String.fromCharCode(...new Uint8Array(buf)));
  return s.replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}
function pemToDer(pem){
  const b = atob(pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, ''));
  const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
  return u.buffer;
}
export async function signJwt(sa, scope, now = Math.floor(Date.now() / 1000)){
  const head = b64url(JSON.stringify({alg: 'RS256', typ: 'JWT', kid: sa.private_key_id}));
  const body = b64url(JSON.stringify({iss: sa.client_email, scope, aud: sa.token_uri || 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600}));
  const key = await crypto.subtle.importKey('pkcs8', pemToDer(sa.private_key), {name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256'}, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(head + '.' + body));
  return head + '.' + body + '.' + b64url(sig);
}
async function accessToken(sa, fetchFn){
  const c = tokenCache.get(sa.client_email);
  if (c && c.exp > Date.now() + 60e3) return c.token;
  const jwt = await signJwt(sa, 'https://www.googleapis.com/auth/identitytoolkit https://www.googleapis.com/auth/datastore');
  const r = await fetchFn(sa.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + jwt
  });
  const j = await readJson(r);
  if (!j.access_token) throw new Error('Google の認証に失敗しました（' + (j.error_description || (j.error && j.error.message) || j.error || r.status) + '）');
  tokenCache.set(sa.client_email, {token: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000});
  return j.access_token;
}
function value(v){
  if (typeof v === 'boolean') return {booleanValue: v};
  if (typeof v === 'number') return Number.isInteger(v) ? {integerValue: String(v)} : {doubleValue: v};
  return {stringValue: String(v)};
}
export async function firebaseStats(app, secretJson, fetchFn = fetch){
  const sa = JSON.parse(secretJson);
  const p = sa.project_id, tok = await accessToken(sa, fetchFn), auth = {Authorization: 'Bearer ' + tok};
  // 1. Authentication のユーザー（1000件ずつ）
  const list = []; let next = '';
  for (let page = 0; page < 50; page++){
    const r = await fetchFn(`https://identitytoolkit.googleapis.com/v1/projects/${p}/accounts:batchGet?maxResults=1000` + (next ? '&nextPageToken=' + encodeURIComponent(next) : ''), {headers: auth});
    const j = await readJson(r);
    if (!r.ok) throw new Error('ユーザー一覧を読めません（' + ((j.error && j.error.message) || r.status) + '）');
    for (const u of j.users || []){
      const last = Math.max(+u.lastLoginAt || 0, u.lastRefreshAt ? Date.parse(u.lastRefreshAt) : 0);
      list.push({created: +u.createdAt || 0, last});
    }
    next = j.nextPageToken; if (!next) break;
  }
  const r = summarize(list);
  // 2. Firestore の件数（集計クエリなので中身は読まない）
  r.counts = await Promise.all((app.counts || []).map(async c => {
    const q = {from: [{collectionId: c.collection, allDescendants: !!c.group}]};
    if (c.where) q.where = {fieldFilter: {field: {fieldPath: c.where[0]}, op: 'EQUAL', value: value(c.where[1])}};
    const res = await fetchFn(`https://firestore.googleapis.com/v1/projects/${p}/databases/(default)/documents:runAggregationQuery`, {
      method: 'POST', headers: {...auth, 'Content-Type': 'application/json'},
      body: JSON.stringify({structuredAggregationQuery: {structuredQuery: q, aggregations: [{alias: 'n', count: {}}]}})
    });
    const j = await readJson(res);
    if (!res.ok) return {label: c.label, n: null, error: (j[0] && j[0].error && j[0].error.message) || (j.error && j.error.message) || String(res.status)};
    const row = Array.isArray(j) ? j.find(x => x.result) : null;
    return {label: c.label, n: row ? +row.result.aggregateFields.n.integerValue : 0};
  }));
  return r;
}
