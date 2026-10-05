// node tests/calc.test.js で実行（国税庁の計算方法に基づく検算）
const C = require('../assets/calc.js');
let ok=0, ng=0;
function eq(name, a, b){ if(a===b){ok++;} else {ng++; console.log('NG', name, 'got', a, 'expected', b);} }
eq('10万円', C.withholding(100000), 10210);
eq('100万円', C.withholding(1000000), 102100);
eq('150万円', C.withholding(1500000), 204200);
eq('11,000円 切捨', C.withholding(11000), 1123);
eq('0円', C.withholding(0), 0);
const f = C.forward(100000, 0.1, true);
eq('振込額 10万+税', f.net, 110000-10210);
// 逆算：結果が目標以上、かつ1円少ないと目標未満であること
for (const t of [1, 8979, 50000, 99790, 897900, 897901, 1000000, 3333333, 9876543]) {
  for (const rate of [0, 0.1]) for (const w of [true, false]) {
    const r = C.reverse(t, rate, w);
    eq(`逆算>=目標 ${t},${rate},${w}`, r.net >= t, true);
    if (r.amount>0) eq(`最小性 ${t},${rate},${w}`, C.forward(r.amount-1, rate, w).net < t, true);
  }
}
console.log(`OK ${ok} / NG ${ng}`); process.exit(ng?1:0);
