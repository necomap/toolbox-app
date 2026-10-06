// 共通ヘッダー・フッター・保存処理・アフィリエイト枠
(function(){
  var SITE = {
    name: '個人事業主の道具箱',
    feedbackUrl: 'https://forms.gle/REPLACE_ME', // ← Googleフォーム等のURLに差し替え
    tipUrl: '',                                   // ← 投げ銭リンク（OFUSE等）。空なら非表示
    tools: [
      {href:'gensen.html',  name:'源泉徴収 逆算'},
      {href:'invoice.html', name:'請求書・見積書'},
      {href:'nouzei.html',  name:'納税積立カレンダー'},
      {href:'anbun.html',   name:'家事按分'},
      {href:'jikyu.html',   name:'案件別 時給'},
      {href:'shohizei.html',name:'消費税 比較'},
      {href:'genka.html',   name:'減価償却'},
      {href:'inshi.html',   name:'収入印紙'},
      {href:'furusato.html',name:'ふるさと納税 上限'}
    ]
  };
  window.SITE = SITE;
  var here = location.pathname.split('/').pop() || 'index.html';

  var h = document.createElement('header'); h.className='site';
  h.innerHTML = '<div class="wrap"><a class="brand" href="index.html">個人事業主の<span>道具箱</span></a><nav class="tools">' +
    SITE.tools.map(function(t){return '<a href="'+t.href+'"'+(t.href===here?' class="on"':'')+'>'+t.name+'</a>';}).join('') +
    '</nav></div>';
  document.body.insertBefore(h, document.body.firstChild);

  var f = document.createElement('footer'); f.className='site';
  f.innerHTML = '<div class="wrap">' +
    '<p>計算結果はすべて目安です。最終的な税額・手続きは国税庁・自治体の情報、税理士等でご確認ください。入力内容はお使いのブラウザ内にのみ保存され、サーバーには送信されません。</p>' +
    '<p><a href="'+SITE.feedbackUrl+'" target="_blank" rel="noopener">結果がおかしい・要望を送る</a>' +
    (SITE.tipUrl ? ' ・ <a href="'+SITE.tipUrl+'" target="_blank" rel="noopener">開発を応援する（投げ銭）</a>' : '') +
    ' ・ <a href="privacy.html">プライバシーポリシー</a></p>' +
    '<p>&copy; '+new Date().getFullYear()+' lucke.jp</p></div>';
  document.body.appendChild(f);

  // 関連ツール
  var rel = document.getElementById('related');
  if (rel) {
    rel.className='related';
    rel.innerHTML = SITE.tools.filter(function(t){return t.href!==here;})
      .map(function(t){return '<a class="toolcard" href="'+t.href+'"><div class="t">'+t.name+'</div></a>';}).join('');
  }
})();

// ブラウザ保存（失敗しても動作は継続）
var Store = {
  get: function(k, d){ try{ var v = localStorage.getItem('dougubako:'+k); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
  set: function(k, v){ try{ localStorage.setItem('dougubako:'+k, JSON.stringify(v)); }catch(e){} }
};
function yen(n){ return (Math.round(n)||0).toLocaleString('ja-JP') + '円'; }
function num(id){ var v = String(document.getElementById(id).value).replace(/[,，円\s]/g,''); var n = parseFloat(v); return isNaN(n) ? 0 : n; }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
