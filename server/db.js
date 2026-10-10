// D1（Cloudflare のデータベース）の準備と共通処理
let ready = false;
export async function db(env){
  if (!env.DB) throw new Error('D1 データベース（変数名 DB）がバインドされていません');
  if (!ready){
    await env.DB.batch([
      env.DB.prepare('CREATE TABLE IF NOT EXISTS ev (day TEXT NOT NULL, tool TEXT NOT NULL, ev TEXT NOT NULL, vid TEXT NOT NULL, PRIMARY KEY (day, tool, ev, vid)) WITHOUT ROWID'),
      env.DB.prepare('CREATE TABLE IF NOT EXISTS login_fail (who TEXT NOT NULL, ts INTEGER NOT NULL)')
    ]);
    ready = true;
  }
  return env.DB;
}
// 日本時間の日付 YYYY-MM-DD（offsetDays 日前）
export function jstDay(offsetDays = 0){
  return new Date(Date.now() + 9 * 3600e3 - offsetDays * 86400e3).toISOString().slice(0, 10);
}
export function json(data, status = 200, headers = {}){
  return new Response(JSON.stringify(data), {status, headers: {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers}});
}
