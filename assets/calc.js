// 計算ロジック（ブラウザ・Node両対応。テストは tests/calc.test.js）
(function(root){
  // 報酬・料金の源泉徴収税額（所得税＋復興特別所得税）
  // 100万円以下：10.21%、100万円超の部分：20.42%。1円未満切り捨て
  function withholding(base){
    base = Math.floor(base);
    if (base <= 0) return 0;
    if (base <= 1000000) return Math.floor(base * 0.1021);
    return Math.floor(102100 + (base - 1000000) * 0.2042);
  }
  // 請求額（税抜）→ 内訳
  function forward(amount, taxRate, withholdOn){
    amount = Math.floor(amount);
    var tax = Math.floor(amount * taxRate);
    var w = withholdOn ? withholding(amount) : 0;
    return {amount:amount, tax:tax, gross:amount+tax, withholding:w, net:amount+tax-w};
  }
  // 手取り（振込額）目標 → 必要な税抜請求額（条件を満たす最小の整数）
  function reverse(targetNet, taxRate, withholdOn){
    targetNet = Math.ceil(targetNet);
    if (targetNet <= 0) return forward(0, taxRate, withholdOn);
    var lo = 0, hi = targetNet * 3 + 10;
    while (lo < hi){
      var mid = Math.floor((lo + hi) / 2);
      if (forward(mid, taxRate, withholdOn).net >= targetNet) hi = mid; else lo = mid + 1;
    }
    return forward(lo, taxRate, withholdOn);
  }
  var api = {withholding:withholding, forward:forward, reverse:reverse};
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Calc = api;
})(this);
