// 管理画面のサーバー処理のテスト（Firebase・Supabase の応答はモック）。使い方：node tests/admin.test.mjs
import {generateKeyPairSync, createVerify} from 'node:crypto';
import {signJwt, firebaseStats} from '../server/firebase.js';
import {supabaseStats} from '../server/supabase.js';
import {summarize} from '../server/summary.js';
import {checkPassword, makeCookie, isAdmin} from '../server/auth.js';

let ok = 0, ng = [];
const check = (name, cond, detail = '') => cond ? ok++ : ng.push(name + ' ' + detail);

const {privateKey, publicKey} = generateKeyPairSync('rsa', {modulusLength: 2048});
const sa = {project_id: 'demo', private_key_id: 'k1', client_email: 'stats@demo.iam.gserviceaccount.com',
  private_key: privateKey.export({type: 'pkcs8', format: 'pem'}), token_uri: 'https://oauth2.googleapis.com/token'};

// 1. JWT の署名が公開鍵で検証できる
const jwt = await signJwt(sa, 'scope-a', 1000);
const [h, b, s] = jwt.split('.');
const v = createVerify('RSA-SHA256'); v.update(h + '.' + b);
check('JWT 署名が正しい', v.verify(publicKey, Buffer.from(s, 'base64url')));
const body = JSON.parse(Buffer.from(b, 'base64url'));
check('JWT の中身', body.iss === sa.client_email && body.scope === 'scope-a' && body.exp === 4600, JSON.stringify(body));

// 2. summarize：登録日・最終利用日から人数を数える
const now = Date.parse('2026-10-07T03:00:00Z'), day = 864e5;
const r = summarize([
  {created: now - 2 * day, last: now - day},       // 新規・7日内に利用
  {created: now - 20 * day, last: now - 10 * day}, // 30日内に利用
  {created: now - 400 * day, last: now - 100 * day}
], now);
check('summarize 人数', r.users === 3 && r.active7 === 1 && r.active30 === 2 && r.new7 === 1 && r.new30 === 2, JSON.stringify(r));
check('summarize 月別は12か月', r.monthly.length === 12 && r.monthly[11].m === '2026-10' && r.monthly[11].n === 1 && r.monthly[10].n === 1, JSON.stringify(r.monthly.slice(-2)));

// 3. firebaseStats：ページ送り・件数・条件付き件数・エラー
const calls = [];
const fakeFetch = async (url, opt = {}) => {
  calls.push({url, opt});
  const res = (o, status = 200) => new Response(JSON.stringify(o), {status});
  if (url.startsWith('https://oauth2')) return res({access_token: 'AT', expires_in: 3600});
  if (url.includes('accounts:batchGet')){
    if (!url.includes('nextPageToken')) return res({users: [{createdAt: String(now - day), lastLoginAt: String(now - day)}], nextPageToken: 'p2'});
    return res({users: [{createdAt: String(now - 50 * day), lastLoginAt: String(now - 40 * day), lastRefreshAt: new Date(now - 3 * day).toISOString()}]});
  }
  if (url.includes('runAggregationQuery')){
    const q = JSON.parse(opt.body).structuredAggregationQuery.structuredQuery;
    if (q.from[0].collectionId === 'broken') return res([{error: {message: 'PERMISSION_DENIED'}}], 403);
    const n = q.where ? 2 : (q.from[0].allDescendants ? 7 : 5);
    return res([{result: {aggregateFields: {n: {integerValue: String(n)}}}, readTime: 'x'}]);
  }
  return res({}, 404);
};
const app = {counts: [{label: 'A', collection: 'items'}, {label: 'B', collection: 'logs', group: true}, {label: 'C', collection: 'users', where: ['plan', 'pro']}, {label: 'D', collection: 'broken'}]};
const fs = await firebaseStats(app, JSON.stringify(sa), fakeFetch);
check('Firebase ユーザー数（2ページ分）', fs.users === 2, fs.users);
check('Firebase 最終利用は lastRefreshAt も見る', fs.active7 === 2, fs.active7);
check('Firebase 件数', fs.counts.map(c => c.n).join() === '5,7,2,', JSON.stringify(fs.counts));
check('Firebase 権限エラーは項目だけ失敗', fs.counts[3].error === 'PERMISSION_DENIED', JSON.stringify(fs.counts[3]));
const where = JSON.parse(calls.find(c => c.url.includes('runAggregation') && c.opt.body.includes('plan')).opt.body);
check('Firebase 条件の形式', where.structuredAggregationQuery.structuredQuery.where.fieldFilter.value.stringValue === 'pro');
check('Firebase 認証ヘッダー', calls.find(c => c.url.includes('batchGet')).opt.headers.Authorization === 'Bearer AT');
const badFetch = async () => new Response('Host not allowed', {status: 403});
let msg = ''; try { await firebaseStats(app, JSON.stringify({...sa, client_email: 'other@x'}), badFetch); } catch(e){ msg = e.message; }
check('Firebase 認証失敗は分かるメッセージ', msg.includes('Google の認証に失敗') && msg.includes('403'), msg);

// 4. supabaseStats
const sb = await supabaseStats({url: 'https://x.supabase.co/', key: 'pk'}, 'tok', async (url, opt) => {
  check('Supabase 呼び出し先', url === 'https://x.supabase.co/rest/v1/rpc/admin_app_stats' && JSON.parse(opt.body).p_token === 'tok' && opt.headers.apikey === 'pk', url);
  return new Response(JSON.stringify({users: 9, counts: []}));
});
check('Supabase 応答', sb.users === 9);
msg = ''; try { await supabaseStats({url: 'u', key: 'k'}, 'bad', async () => new Response(JSON.stringify({error: '合言葉が違います'}))); } catch(e){ msg = e.message; }
check('Supabase 合言葉違い', msg === '合言葉が違います', msg);
msg = ''; try { await supabaseStats({url: '', key: ''}, 't'); } catch(e){ msg = e.message; }
check('Supabase 未設定', msg.includes('未設定'), msg);

// 5. ログイン
const env = {ADMIN_PASSWORD: 'correct-horse'};
check('パスワード一致', await checkPassword(env, 'correct-horse'));
check('パスワード不一致', !(await checkPassword(env, 'correct-hors')));
check('短すぎる設定は拒否', !(await checkPassword({ADMIN_PASSWORD: 'abc'}, 'abc')));
const cookie = (await makeCookie(env)).split(';')[0];
const req = c => new Request('https://t/api/admin/stats', {headers: {Cookie: c}});
check('Cookie で管理者と判定', await isAdmin(req(cookie), env));
check('改ざんした Cookie は拒否', !(await isAdmin(req(cookie.replace(/.$/, c => c === 'a' ? 'b' : 'a')), env)));
check('パスワード変更で古い Cookie は無効', !(await isAdmin(req(cookie), {ADMIN_PASSWORD: 'new-password'})));
check('期限切れ Cookie は拒否', !(await isAdmin(req('tb_admin=100.' + 'a'.repeat(64)), env)));

console.log(`OK ${ok} / NG ${ng.length}`);
ng.forEach(x => console.log('  NG:', x));
process.exit(ng.length ? 1 : 0);
