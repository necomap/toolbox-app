// Supabase：データベースの集計専用関数 admin_app_stats(p_token) を呼ぶ（数字だけが返る）
export async function supabaseStats(app, token, fetchFn = fetch){
  if (!app.url || !app.key) throw new Error('server/apps.js に URL と公開キーが未設定です');
  const r = await fetchFn(app.url.replace(/\/$/, '') + '/rest/v1/rpc/admin_app_stats', {
    method: 'POST',
    headers: {apikey: app.key, Authorization: 'Bearer ' + app.key, 'Content-Type': 'application/json'},
    body: JSON.stringify({p_token: token})
  });
  const t = await r.text(); let j;
  try { j = JSON.parse(t); } catch(e){ throw new Error('HTTP ' + r.status + '：' + t.slice(0, 80)); }
  if (!r.ok) throw new Error('集計関数の呼び出しに失敗しました（' + (j.message || r.status) + '）');
  if (j && j.error) throw new Error(j.error);
  return j;
}
