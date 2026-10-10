// 共通ヘッダー・フッター・保存処理・アフィリエイト枠
(function(){
  var SITE = {
    name: '個人事業主の道具箱',
    feedbackUrl: 'https://forms.gle/5NLXXr4iTYYRayZk6', // お問い合わせ（Googleフォーム）
    tipUrl: '',                                   // ← 投げ銭リンク（OFUSE等）。空なら非表示
    amazonTag: 'lucketool-22',                    // Amazonアソシエイト トラッキングID
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
  // Cloudflare Pages は /gensen.html を /gensen に転送するので、拡張子なしでも同じページ名にそろえる
  var here = location.pathname.split('/').pop() || 'index.html';
  if (here.indexOf('.') < 0) here += '.html';
  SITE.page = here.replace('.html', '');

  var h = document.createElement('header'); h.className='site';
  h.innerHTML = '<div class="wrap"><a class="brand" href="index.html">個人事業主の<span>道具箱</span></a><nav class="tools">' +
    SITE.tools.map(function(t){return '<a href="'+t.href+'"'+(t.href===here?' class="on"':'')+'>'+t.name+'</a>';}).join('') +
    '<a href="apps.html"'+(here==='apps.html'?' class="on"':'')+'>ほかのアプリ</a></nav></div>';
  document.body.insertBefore(h, document.body.firstChild);

  var f = document.createElement('footer'); f.className='site';
  f.innerHTML = '<div class="wrap">' +
    '<p>計算結果はすべて目安です。最終的な税額・手続きは国税庁・自治体の情報、税理士等でご確認ください。入力内容はお使いのブラウザ内にのみ保存され、サーバーには送信されません。どのツールが使われたかを知るため、入力内容を含まない匿名の利用回数だけを記録しています（<a href="backup.html">ファイルにバックアップ</a>できます）。</p>' +
    '<p>' + [
      (SITE.feedbackUrl && SITE.feedbackUrl.indexOf('REPLACE_ME') < 0) ? '<a href="'+SITE.feedbackUrl+'" target="_blank" rel="noopener">お問い合わせ（結果がおかしい・要望）</a>' : '',
      SITE.tipUrl ? '<a href="'+SITE.tipUrl+'" target="_blank" rel="noopener">開発を応援する（投げ銭）</a>' : '',
      '<a href="backup.html">データのバックアップ</a>',
      '<a href="apps.html">ほかのアプリ</a>',
      '<a href="privacy.html">プライバシーポリシー</a>'
    ].filter(Boolean).join(' ・ ') + '</p>' +
    (SITE.amazonTag ? '<p>Amazonのアソシエイトとして、当サイトは適格販売により収入を得ています。</p>' : '') +
    '<p>&copy; '+new Date().getFullYear()+' lucke.jp</p></div>';
  document.body.appendChild(f);

  // Amazonアソシエイト枠（ページごとのおすすめ。キーワードを変えるだけで差し替え可）
  var AMAZON = {
    'gensen.html':  [['確定申告の解説本（個人事業主向け）','個人事業主 確定申告 本'],['請求書に押す角印','角印 個人事業主'],['請求書の郵送に窓付き封筒','窓付き封筒 長形3号']],
    'invoice.html': [['請求書に押す角印','角印 個人事業主'],['請求書の郵送に窓付き封筒','窓付き封筒 長形3号'],['インボイス制度の解説本','インボイス制度 本']],
    'nouzei.html':  [['確定申告の解説本（個人事業主向け）','個人事業主 確定申告 本'],['フリーランスの税金・保険の本','フリーランス 税金 本']],
    'anbun.html':   [['電気代の按分根拠に使える電力計','ワットチェッカー'],['領収書・レシートの整理ファイル','領収書 整理 ファイル'],['確定申告の解説本（個人事業主向け）','個人事業主 確定申告 本']],
    'jikyu.html':   [['作業時間を区切るタイマー','ポモドーロ タイマー'],['フリーランスの単価・値決めの本','フリーランス 単価 本']],
    'shohizei.html':[['インボイス・消費税の解説本','インボイス 消費税 本'],['確定申告の解説本（個人事業主向け）','個人事業主 確定申告 本']],
    'genka.html':   [['減価償却・勘定科目がわかる本','勘定科目 本 個人事業主'],['確定申告の解説本（個人事業主向け）','個人事業主 確定申告 本']],
    'inshi.html':   [['複写式の領収書','領収書 複写'],['契約書の書き方がわかる本','契約書 書き方 本']],
    'furusato.html':[['ふるさと納税の解説本','ふるさと納税 本'],['確定申告の解説本（個人事業主向け）','個人事業主 確定申告 本']]
  };
  var relEl = document.getElementById('related');
  if (SITE.amazonTag && AMAZON[here] && relEl) {
    var box = document.createElement('div'); box.className = 'aff amazon';
    box.innerHTML = '<span class="pr">PR</span><b>この作業に役立つ本・グッズ（Amazon）</b><ul>' +
      AMAZON[here].map(function(a){
        return '<li><a href="https://www.amazon.co.jp/s?k='+encodeURIComponent(a[1])+'&tag='+SITE.amazonTag+'" target="_blank" rel="sponsored noopener">'+a[0]+'</a></li>';
      }).join('') + '</ul>';
    var anchor = relEl.previousElementSibling && relEl.previousElementSibling.tagName === 'H2' ? relEl.previousElementSibling : relEl;
    anchor.parentNode.insertBefore(box, anchor);
  }
  // リンク未設置のアフィリエイト枠・広告枠は非表示（コードを入れると自動で表示）
  Array.prototype.forEach.call(document.querySelectorAll('.aff'), function(el){ if (!el.querySelector('a,script,iframe,ins')) el.style.display = 'none'; });
  Array.prototype.forEach.call(document.querySelectorAll('.ad-slot'), function(el){ if (!el.querySelector('script,iframe,ins')) el.style.display = 'none'; });

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

// 匿名の利用記録（入力内容は送らない。送るのはページ名・操作の種類・ランダムな番号だけ）
var Track = (function(){
  var EP = '/api/event', vid = '', local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  function ls(k, v){ try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch(e){ return null; } }
  function off(){ return location.protocol === 'file:' || ls('dougubako-meta:notrack') === '1' || (local && ls('dougubako-meta:trackLocal') !== '1'); }
  function id(){
    if (vid) return vid;
    vid = ls('dougubako-meta:vid');
    if (!vid || !/^[0-9a-f]{16}$/.test(vid)){
      var a = new Uint8Array(8); (window.crypto || window.msCrypto).getRandomValues(a);
      vid = Array.prototype.map.call(a, function(b){ return ('0' + b.toString(16)).slice(-2); }).join('');
      ls('dougubako-meta:vid', vid);
    }
    return vid;
  }
  var sent = {};
  function send(ev){
    if (off() || sent[ev]) return; sent[ev] = 1;
    var body = JSON.stringify({t: SITE.page, e: ev, v: id()});
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(EP, new Blob([body], {type: 'text/plain'}))) return;
      fetch(EP, {method: 'POST', body: body, keepalive: true, headers: {'Content-Type': 'text/plain'}}).catch(function(){});
    } catch(e){}
  }
  var isTool = SITE.tools.some(function(t){ return t.href.replace('.html','') === SITE.page; });
  send('view');
  if (isTool){
    var used = function(ev){ if (ev.target && ev.target.closest && ev.target.closest('main')) { send('use'); document.removeEventListener('input', used, true); document.removeEventListener('change', used, true); } };
    document.addEventListener('input', used, true); document.addEventListener('change', used, true);
    window.addEventListener('beforeprint', function(){ send('print'); });
  }
  document.addEventListener('click', function(ev){
    var b = ev.target && ev.target.closest && ev.target.closest('button,a'); if (!b) return;
    if (b.id === 'csv') send('csv');
    else if (b.id === 'btnExport') send('backup');
    else if (b.id === 'btnImport') send('restore');
    else if (b.classList.contains('appcard')) send('app:' + (b.getAttribute('data-app') || ''));
    else if (b.href && b.href.indexOf('amazon.co.jp') > 0) send('amazon');
  }, true);
  return {send: send};
})();
