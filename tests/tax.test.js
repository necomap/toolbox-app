// node tests/tax.test.js で実行（国税庁・総務省の計算方法にもとづく検算。期待値は手計算）
const T = require('../assets/tax.js');
let ok = 0, ng = 0;
function eq(name, a, b){ if (a === b) ok++; else { ng++; console.log('NG', name, 'got', a, 'expected', b); } }

// ===== 消費税 =====
let r = T.shohi({s10:11000000, p10:3300000, kubun:5, year:2026});
eq('課税標準額', r.base, 10000000);
eq('売上の消費税額(国税7.8%)', r.saleTax, 780000);
eq('原則 国税', r.gensoku.kokuzei, 546000);
eq('原則 地方', r.gensoku.chiho, 154000);
eq('原則 合計=(売上-仕入)×10%', r.gensoku.total, 700000);
eq('簡易 第5種 合計', r.kani.total, 500000);
eq('2割特例 名称', r.tokurei.name, '2割特例');
eq('2割特例 合計=売上×10%×20%', r.tokurei.total, 200000);
eq('2割特例 地方', r.tokurei.chiho, 44000);
r = T.shohi({s10:11000000, p10:3300000, kubun:5, year:2027});
eq('3割特例 名称(2027)', r.tokurei.name, '3割特例');
eq('3割特例 合計', r.tokurei.total, 300000);
eq('3割特例 2028', T.tokurei(2028).rate, 0.3);
eq('特例なし 2029', T.shohi({s10:1100000, year:2029}).tokurei, undefined);
eq('2割特例 2026', T.tokurei(2026).rate, 0.2);
eq('課税標準 千円未満切捨', T.shohi({s10:5500500, year:2026}).base, 5000000);
r = T.shohi({s10:1100000, s8:1080000, kubun:3, year:2026});
eq('8%+10% 売上税額', r.saleTax, 140400);
eq('簡易 第3種 国税 百円未満切捨', r.kani.kokuzei, 42100);
eq('簡易 第3種 地方', r.kani.chiho, 11800);
r = T.shohi({s10:1100000, p10:2200000, year:2026});
eq('還付 国税', r.gensoku.kokuzei, -78000);
eq('還付 合計', r.gensoku.total, -100000);
eq('第1種 90%', T.KANI[1], 0.9); eq('第6種 40%', T.KANI[6], 0.4);

// ===== 減価償却 =====
[[2,0.5],[3,0.334],[4,0.25],[5,0.2],[6,0.167],[7,0.143],[8,0.125],[9,0.112],[10,0.1],[15,0.067],[22,0.046],[47,0.022],[50,0.02]]
  .forEach(([n,v]) => eq('定額法償却率 '+n+'年', T.teigakuRate(n), v));
let s = T.teigaku(1000000, 10, 2026, 1).rows;
eq('国税庁例 年数', s.length, 10);
eq('国税庁例 1年目', s[0].dep, 100000);
eq('国税庁例 10年目', s[9].dep, 99999);
eq('国税庁例 備忘価額', s[9].book, 1);
s = T.teigaku(200000, 4, 2026, 10, 0.6).rows;
eq('年途中 1年目 3か月', s[0].dep, 12500);
eq('年途中 事業割合60%', s[0].expense, 7500);
eq('年途中 2年目', s[1].dep, 50000);
eq('年途中 最終年', s[4].dep, 37499);
eq('年途中 最終年の年', s[4].year, 2030);
eq('償却合計=取得価額-1', s.reduce((a,x)=>a+x.dep,0), 199999);
eq('中古 6年・4年経過', T.usedLife(6, 48), 2);
eq('中古 6年・3年6か月経過', T.usedLife(6, 42), 3);
eq('中古 6年・全部経過(最低2年)', T.usedLife(6, 72), 2);
eq('中古 22年・20年経過', T.usedLife(22, 240), 6);
eq('中古 22年・全部経過', T.usedLife(22, 300), 4);
s = T.ikkatsu(100001, 2026).rows;
eq('一括償却 1年目', s[0].dep, 33333);
eq('一括償却 3年目(端数)', s[2].dep, 33335);
eq('一括償却 残高0', s[2].book, 0);
eq('少額特例 2026年3月は30万', T.shogakuLimit(2026, 3), 300000);
eq('少額特例 2026年4月から40万', T.shogakuLimit(2026, 4), 400000);
eq('少額特例 2029年3月まで', T.shogakuLimit(2029, 3), 400000);
eq('少額特例 2029年4月以降なし', T.shogakuLimit(2029, 4), 0);
eq('35万 青色 2026/5 → 少額特例可', T.genkaOptions(350000, true, 2026, 5).join(), 'shogaku,teigaku');
eq('35万 青色 2026/3 → 不可', T.genkaOptions(350000, true, 2026, 3).join(), 'teigaku');
eq('35万 白色 → 不可', T.genkaOptions(350000, false, 2026, 5).join(), 'teigaku');
eq('40万ちょうど → 不可', T.genkaOptions(400000, true, 2026, 5).join(), 'teigaku');
eq('99,999 → 全部', T.genkaOptions(99999, true, 2026, 5).join(), 'shomo,ikkatsu,shogaku,teigaku');
eq('15万 白色', T.genkaOptions(150000, false, 2026, 5).join(), 'ikkatsu,teigaku');

// ===== 収入印紙 =====
const I = (k, a, o) => T.inshi(k, a, o).tax;
eq('領収書 49,999', I('ryoshu', 49999), 0);
eq('領収書 50,000', I('ryoshu', 50000), 200);
eq('領収書 100万', I('ryoshu', 1000000), 200);
eq('領収書 100万1円', I('ryoshu', 1000001), 400);
eq('領収書 300万', I('ryoshu', 3000000), 600);
eq('領収書 1億', I('ryoshu', 100000000), 20000);
eq('領収書 10億超', I('ryoshu', 1000000001), 200000);
eq('領収書 金額なし', I('ryoshu', null), 200);
eq('領収書 営業外', I('ryoshu', 500000, {nonBusiness:true}), 0);
eq('領収書 電子', I('ryoshu', 500000, {electronic:true}), 0);
eq('請負 9,999', I('ukeoi', 9999), 0);
eq('請負 1万', I('ukeoi', 10000), 200);
eq('請負 300万', I('ukeoi', 3000000), 1000);
eq('請負 300万1円', I('ukeoi', 3000001), 2000);
eq('請負 1000万', I('ukeoi', 10000000), 10000);
eq('請負 50億超', I('ukeoi', 5000000001), 600000);
eq('建設 150万(軽減)', I('kensetsu', 1500000), 200);
eq('建設 300万(軽減)', I('kensetsu', 3000000), 500);
eq('建設 1000万(軽減)', I('kensetsu', 10000000), 5000);
eq('建設 1億(軽減)', I('kensetsu', 100000000), 30000);
eq('建設 1000万(2027/4以降=本則)', I('kensetsu', 10000000, {after2027:true}), 10000);
eq('基本契約 7号', I('kihon', null), 4000);
eq('請求書等', I('other', 5000000), 0);

// ===== ふるさと納税 =====
let f = T.furusato({sales:5000000, expenses:1350000, aoiro:650000, shakai:500000, year:2026});
eq('事業所得', f.jigyo, 3000000);
eq('所得税 課税所得(基礎控除104万)', f.taxableIT, 1460000);
eq('所得税率 5%', f.rate, 0.05);
eq('住民税 課税所得', f.taxableJT, 2070000);
eq('住民税所得割(調整控除2,500)', f.shotokuwari, 204500);
eq('上限 単身300万', f.limit, Math.floor(40900 / (0.9 - 0.05 * 1.021)) + 2000);
f = T.furusato({sales:8000000, expenses:2000000, aoiro:650000, shakai:800000, spouse:true, fuyoTokutei:1, year:2026});
eq('基礎控除67万帯', T.kisoIT(5350000, 2026), 670000);
eq('配偶者+特定扶養 所得税課税所得', f.taxableIT, 2870000);
eq('配偶者+特定扶養 所得割', f.shotokuwari, 331500);
eq('配偶者+特定扶養 上限', f.limit, Math.floor(66300 / (0.9 - 0.1 * 1.021)) + 2000);
f = T.furusato({sales:1000000, year:2026});
eq('所得税0円でも住民税あり 所得割', f.shotokuwari, 54500);
eq('所得税0円 上限', f.limit, Math.floor(10900 / 0.9) + 2000);
eq('所得なし 上限0', T.furusato({sales:1500000, expenses:300000, aoiro:650000, shakai:200000, year:2026}).limit, 0);
eq('青色控除は所得まで', T.furusato({sales:500000, aoiro:650000}).jigyo, 0);
f = T.furusato({sales:30000000, expenses:5000000, aoiro:650000, shakai:1000000, year:2026});
eq('高所得 基礎控除32万', T.kisoIT(f.gokei, 2026), 320000);
eq('高所得 所得割', f.shotokuwari, 2303500);
eq('高所得 上限', f.limit, Math.floor(460700 / (0.9 - 0.4 * 1.021)) + 2000);
eq('2026年寄附 上限なし', T.furusato({sales:120000000, expenses:20000000, year:2026}).limit, Math.floor(2000000 / (0.9 - 0.45 * 1.021)) + 2000);
eq('2027年寄附 193万上限', T.furusato({sales:120000000, expenses:20000000, year:2027}).limit, Math.floor(1930000 / (0.9 - 0.45 * 1.021)) + 2000);
eq('2028年分 基礎控除62万', T.kisoIT(3000000, 2028), 620000);

console.log(`OK ${ok} / NG ${ng}`); process.exit(ng ? 1 : 0);
