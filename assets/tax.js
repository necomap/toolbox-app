// 税金まわりの計算ロジック（ブラウザ・Node両対応。テストは tests/tax.test.js）
// 消費税（原則・簡易・2割/3割特例）／減価償却／収入印紙／ふるさと納税の上限
(function(root){
  function fl(x, unit){ unit = unit || 1; return Math.floor(x / unit + 1e-9) * unit; }

  // ===== 消費税 =====
  // みなし仕入率（簡易課税）
  var KANI = {1:0.9, 2:0.8, 3:0.7, 4:0.6, 5:0.5, 6:0.4};
  // 年分（個人事業者）ごとの小規模事業者向け特例
  function tokurei(year){
    if (year >= 2023 && year <= 2026) return {name:'2割特例', rate:0.2};
    if (year === 2027 || year === 2028) return {name:'3割特例', rate:0.3};
    return null;
  }
  // 国税・地方税への分け方（申告書と同じ順序）
  function finish(saleTax, kojo){
    var sa = saleTax - kojo, tax, chiho;
    if (sa >= 0){ tax = fl(sa, 100); chiho = fl(tax * 22 / 78, 100); }
    else { tax = Math.ceil(sa); chiho = -fl(-tax * 22 / 78); } // 還付（端数処理なし）
    return {kojo:kojo, kokuzei:tax, chiho:chiho, total:tax + chiho};
  }
  // s10/s8：税込の課税売上（10%・8%）、p10/p8：税込の課税仕入
  function shohi(o){
    var s10 = Math.max(0, +o.s10||0), s8 = Math.max(0, +o.s8||0), p10 = Math.max(0, +o.p10||0), p8 = Math.max(0, +o.p8||0);
    var b10 = fl(s10 * 100 / 110, 1000), b8 = fl(s8 * 100 / 108, 1000);
    var saleTax = fl(b10 * 0.078) + fl(b8 * 0.0624);
    var shiire = fl(p10 * 7.8 / 110) + fl(p8 * 6.24 / 108);
    var r = {base:b10 + b8, saleTax:saleTax};
    r.gensoku = finish(saleTax, shiire);
    var k = KANI[o.kubun || 5];
    r.kani = finish(saleTax, fl(saleTax * k)); r.kani.rate = k;
    var t = tokurei(o.year);
    if (t){ r.tokurei = finish(saleTax, fl(saleTax * (1 - t.rate))); r.tokurei.name = t.name; }
    return r;
  }

  // ===== 減価償却 =====
  // 定額法の償却率（耐用年数省令 別表第八：1/耐用年数 を小数第3位に切り上げ）
  function teigakuRate(n){ return Math.ceil(1000 / n - 1e-9) / 1000; }
  // 中古資産の耐用年数（簡便法）。L：法定耐用年数（年）、e：経過月数
  function usedLife(L, e){
    var m = e >= L * 12 ? L * 12 * 0.2 : (L * 12 - e) + e * 0.2;
    return Math.max(2, Math.floor(m / 12 + 1e-9));
  }
  // 定額法の償却スケジュール。y,m：事業に使い始めた年・月、ratio：事業専用割合(0-1)
  function teigaku(cost, life, y, m, ratio){
    cost = Math.floor(cost); ratio = ratio == null ? 1 : ratio;
    var rate = teigakuRate(life), annual = cost * rate, book = cost, rows = [], first = true;
    while (book > 1 && rows.length < 120){
      var months = first ? 13 - m : 12;
      var dep = Math.min(fl(annual * months / 12), book - 1);
      book -= dep; first = false;
      rows.push({year:y + rows.length, dep:dep, expense:fl(dep * ratio), book:book});
    }
    return {rate:rate, rows:rows};
  }
  // 一括償却資産（20万円未満）：3年間で均等に
  function ikkatsu(cost, y, ratio){
    cost = Math.floor(cost); ratio = ratio == null ? 1 : ratio;
    var each = fl(cost / 3), rows = [], book = cost;
    for (var i = 0; i < 3; i++){
      var dep = i < 2 ? each : book;
      book -= dep; rows.push({year:y + i, dep:dep, expense:fl(dep * ratio), book:book});
    }
    return {rows:rows};
  }
  // 少額減価償却資産の特例（青色申告）の取得価額の上限
  function shogakuLimit(y, m){
    var ym = y * 100 + m;
    if (ym > 202903) return 0;            // 適用期限：2029年3月31日まで
    return ym >= 202604 ? 400000 : 300000; // 2026年4月1日以後に使い始めた資産は40万円未満
  }
  // 使える処理方法の判定
  function genkaOptions(cost, blue, y, m){
    var o = [];
    if (cost < 100000) o.push('shomo');
    if (cost < 200000) o.push('ikkatsu');
    var lim = shogakuLimit(y, m);
    if (blue && lim && cost < lim) o.push('shogaku');
    o.push('teigaku');
    return o;
  }

  // ===== 収入印紙 =====
  function table(amount, rows){ for (var i = 0; i < rows.length; i++) if (amount <= rows[i][0]) return rows[i][1]; return rows[rows.length-1][1]; }
  var T17 = [[49999,0],[1e6,200],[2e6,400],[3e6,600],[5e6,1000],[1e7,2000],[2e7,4000],[3e7,6000],[5e7,10000],[1e8,20000],[2e8,40000],[3e8,60000],[5e8,100000],[1e9,150000],[Infinity,200000]];
  var T2  = [[9999,0],[1e6,200],[2e6,400],[3e6,1000],[5e6,2000],[1e7,10000],[5e7,20000],[1e8,60000],[5e8,100000],[1e9,200000],[5e9,400000],[Infinity,600000]];
  // 建設工事の請負契約書の軽減措置（2027年3月31日までに作成されたもの）
  var T2K = [[9999,0],[2e6,200],[3e6,500],[5e6,1000],[1e7,5000],[5e7,10000],[1e8,30000],[5e8,60000],[1e9,160000],[5e9,320000],[Infinity,480000]];
  // kind: ryoshu(17号) / ukeoi(2号) / kensetsu(2号・建設工事) / kihon(7号) / other(請求書など)
  // amount：記載金額（税抜で判定できる場合は税抜）。金額の記載がなければ null
  function inshi(kind, amount, opt){
    opt = opt || {};
    if (opt.electronic) return {tax:0, reason:'電子データ（PDF・メール等）で交付する文書には印紙税はかかりません。'};
    if (kind === 'other') return {tax:0, reason:'請求書・見積書・納品書や、成果物の完成を約束しない業務委託（準委任）の契約書は課税文書ではありません。'};
    if (kind === 'kihon') return {tax:4000, no:'第7号文書', reason:'継続的取引の基本となる契約書は、金額にかかわらず一律4,000円です。'};
    if (kind === 'ryoshu'){
      if (opt.nonBusiness) return {tax:0, no:'第17号文書', reason:'営業に関しない受取書（医師・弁護士・税理士などの業務や、個人の私的な取引）は非課税です。'};
      if (amount == null) return {tax:200, no:'第17号文書', reason:'受取金額の記載がない領収書は200円です。'};
      return {tax:table(amount, T17), no:'第17号文書', reason: amount < 50000 ? '受取金額が5万円未満の領収書は非課税です。' : '売上代金の受取書（領収書）です。'};
    }
    if (kind === 'ukeoi' || kind === 'kensetsu'){
      if (amount == null) return {tax:200, no:'第2号文書', reason:'契約金額の記載がない請負契約書は200円です。'};
      var k = kind === 'kensetsu' && !opt.after2027;
      return {tax:table(amount, k ? T2K : T2), no:'第2号文書', reason: amount < 10000 ? '契約金額が1万円未満の請負契約書は非課税です。' : (k ? '建設工事の請負契約書の軽減税率（2027年3月31日作成分まで）を適用しています。' : '請負に関する契約書です。')};
    }
    return {tax:0, reason:''};
  }

  // ===== ふるさと納税の控除上限（個人事業主向け・概算） =====
  function incomeTaxRate(t){
    var b = [[1949000,0.05,0],[3299000,0.10,97500],[6949000,0.20,427500],[8999000,0.23,636000],[17999000,0.33,1536000],[39999000,0.40,2796000],[Infinity,0.45,4796000]];
    for (var i = 0; i < b.length; i++) if (t <= b[i][0]) return {rate:b[i][1], sub:b[i][2]};
  }
  // 所得税の基礎控除（2026・2027年分は時限的な上乗せあり）
  function kisoIT(g, year){
    if (g > 25000000) return 0;
    if (g > 24500000) return 160000;
    if (g > 24000000) return 320000;
    if (g > 23500000) return 480000;
    if (year === 2026 || year === 2027){ if (g <= 4890000) return 1040000; if (g <= 6550000) return 670000; }
    return 620000;
  }
  function kisoJT(g){ return g > 25000000 ? 0 : g > 24500000 ? 150000 : g > 24000000 ? 290000 : 430000; }
  function furusato(o){
    var year = +o.year || 2026;
    var sales = +o.sales||0, exp = +o.expenses||0;
    var pre = Math.max(0, sales - exp);
    var jigyo = pre - Math.min(+o.aoiro||0, pre);
    var g = jigyo + Math.max(0, +o.other||0);
    // 配偶者控除（本人の合計所得で逓減）
    var spIT = 0, spJT = 0, spDiff = 0;
    if (o.spouse){
      if (g <= 9000000){ spIT = 380000; spJT = 330000; spDiff = 50000; }
      else if (g <= 9500000){ spIT = 260000; spJT = 220000; spDiff = 40000; }
      else if (g <= 10000000){ spIT = 130000; spJT = 110000; spDiff = 20000; }
    }
    var fi = +o.fuyoIppan||0, ft = +o.fuyoTokutei||0, fr = +o.fuyoRojin||0;
    var fuyoIT = fi*380000 + ft*630000 + fr*480000, fuyoJT = fi*330000 + ft*450000 + fr*380000;
    var common = (+o.shakai||0) + (+o.kyosai||0) + (+o.otherDed||0);
    var dedIT = kisoIT(g, year) + spIT + fuyoIT + common + Math.min(120000, +o.seihoIT||0);
    var dedJT = kisoJT(g) + spJT + fuyoJT + common + Math.min(70000, +o.seihoJT||0);
    var tIT = fl(Math.max(0, g - dedIT), 1000), tJT = fl(Math.max(0, g - dedJT), 1000);
    var r = incomeTaxRate(tIT);
    var itax = fl((tIT * r.rate - r.sub) * 1.021);
    // 調整控除
    var diff = 50000 + spDiff + fi*50000 + ft*180000 + fr*100000, adj = 0;
    if (g <= 25000000 && tJT > 0){
      adj = tJT <= 2000000 ? Math.min(diff, tJT) * 0.05 : Math.max(diff - (tJT - 2000000), 50000) * 0.05;
    }
    var wari = Math.max(0, fl(tJT * 0.1 - adj, 100));
    var cap = year >= 2027 ? 1930000 : Infinity; // 2027年以降の寄附は特例控除額の上限193万円
    var rateForFormula = tIT > 0 ? r.rate : 0;
    var limit = wari > 0 ? fl(Math.min(wari * 0.2, cap) / (0.9 - rateForFormula * 1.021)) + 2000 : 0;
    return {jigyo:jigyo, gokei:g, dedIT:dedIT, dedJT:dedJT, taxableIT:tIT, taxableJT:tJT,
            rate:rateForFormula, incomeTax:itax, shotokuwari:wari, limit:limit};
  }

  var api = {shohi:shohi, tokurei:tokurei, KANI:KANI,
    teigakuRate:teigakuRate, usedLife:usedLife, teigaku:teigaku, ikkatsu:ikkatsu, shogakuLimit:shogakuLimit, genkaOptions:genkaOptions,
    inshi:inshi, furusato:furusato, incomeTaxRate:incomeTaxRate, kisoIT:kisoIT};
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Tax = api;
})(this);
