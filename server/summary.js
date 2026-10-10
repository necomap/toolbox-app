// ユーザーの登録日・最終利用日の一覧から、管理画面の共通形式の数字を作る
// 共通形式：{ users, active7, active30, new7, new30, monthly:[{m:'2026-10', n}], counts:[{label, n}] }
export function summarize(list, now = Date.now()){
  const d7 = now - 7 * 864e5, d30 = now - 30 * 864e5;
  const months = [];
  const t = new Date(now + 9 * 3600e3);
  for (let i = 11; i >= 0; i--){
    const d = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() - i, 1));
    months.push({m: d.toISOString().slice(0, 7), n: 0});
  }
  const idx = new Map(months.map((x, i) => [x.m, i]));
  const r = {users: list.length, active7: 0, active30: 0, new7: 0, new30: 0, monthly: months, counts: []};
  for (const u of list){
    if (u.last && u.last >= d7) r.active7++;
    if (u.last && u.last >= d30) r.active30++;
    if (u.created >= d7) r.new7++;
    if (u.created >= d30) r.new30++;
    const k = new Date(u.created + 9 * 3600e3).toISOString().slice(0, 7);
    if (idx.has(k)) months[idx.get(k)].n++;
  }
  return r;
}
