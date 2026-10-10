// 管理画面で集計するアプリの一覧
// ▼ アプリを追加するときは、ここに1つ足して、必要な秘密情報を Cloudflare の環境変数に登録する
//
// Firebase のアプリ：
//   secret … サービスアカウントの鍵（JSONファイルの中身まるごと）を入れた環境変数の名前
//   counts … 件数を数える Firestore のコレクション。group:true でサブコレクションもまとめて数える。
//            where:['項目名', 値] で条件付きにできる（例：有料プランの人数）
//   users  … Firebase Authentication を使わず独自ログインのアプリだけ指定。
//            {collection:'users', created:'createdAt', exclude:['項目名', 除く値]} でコレクションから人数を数える
// Supabase のアプリ：
//   url / key … プロジェクトのURLと公開キー（anon キー。公開されても問題ないもの。
//               sb_publishable_ 形式は Authorization ヘッダーに使えないため anon を使う）
//   secret    … 集計専用の合言葉を入れた環境変数の名前（データベースの admin_app_stats 関数が照合する）
export const APPS = [
  { id:'foodlabel', name:'FoodLabel Pro', site:'https://foodlabel.lucke.jp', type:'supabase',
    url:'https://vpemskdkaxeugjolsutg.supabase.co',
    key:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwZW1za2RrYXhldWdqb2xzdXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNTEzMzQsImV4cCI6MjA4OTcyNzMzNH0.izgcmdSk7cVltv-ENBlchjfcpNzYB51Pl1lOt0FRvO0',
    secret:'SB_FOODLABEL_TOKEN' },
  { id:'nekomap', name:'NekoMap', site:'https://nekomap.lucke.jp', type:'supabase',
    url:'https://amzfsmdezceuauskkghd.supabase.co',
    key:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtemZzbWRlemNldWF1c2trZ2hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2OTM4ODMsImV4cCI6MjA4OTI2OTg4M30.hG0TT_0DIZf5FrC-qDXYkDGypHMGZ0NtF8zWeMcqsC8',
    secret:'SB_NEKOMAP_TOKEN' },
  { id:'inventory', name:'Lucke Inventory', site:'https://inventory.lucke.jp', type:'firebase', secret:'FB_INVENTORY',
    counts:[
      {label:'商品', collection:'items'},
      {label:'入出庫の記録', collection:'transactions'},
      {label:'仕入先', collection:'suppliers'},
      {label:'棚卸し', collection:'stocktakeSessions'},
      {label:'有料（プレミアム）', collection:'users', where:['plan', 'premium']},
      {label:'有料（プロ）', collection:'users', where:['plan', 'pro']}
    ] },
  { id:'haccp', name:'HACCP管理システム', site:'https://haccp.lucke.jp', type:'firebase', secret:'FB_HACCP',
    users:{collection:'users', created:'createdAt', exclude:['storeCode', 'DEMO001'], note:'独自ログイン（users コレクション）のため「利用」した人数は取れません。デモ店舗は除外'},
    counts:[
      {label:'店舗', collection:'stores'},
      {label:'有料（プレミアム）', collection:'stores', where:['plan', 'premium']},
      {label:'温度記録', collection:'temperature'},
      {label:'衛生チェック', collection:'sanitation'},
      {label:'製造記録', collection:'production'},
      {label:'健康チェック', collection:'healthcheck'},
      {label:'検品・受入', collection:'deliveries'}
    ] },
  { id:'reserve', name:'テイクアウト予約', site:'https://reserve.lucke.jp', type:'firebase', secret:'FB_RESERVE',
    counts:[
      {label:'店舗', collection:'stores'},
      {label:'有料（スタンダード）', collection:'billing', where:['plan', 'standard']},
      {label:'有料（プロ）', collection:'billing', where:['plan', 'pro']},
      {label:'メニュー', collection:'menuItems', group:true},
      {label:'注文', collection:'orders', group:true},
      {label:'整理券', collection:'tickets', group:true}
    ] },
  { id:'boki', name:'複式簿記 記録ツール', site:'https://boki.lucke.jp', type:'firebase', secret:'FB_BOKI',
    counts:[
      {label:'クラウド同期しているユーザー', collection:'snapshots'},
      {label:'同期の履歴', collection:'history', group:true}
    ] },
  { id:'sosgreen', name:'たすけてグリーン', site:'https://sosgreen.lucke.jp', type:'firebase', secret:'FB_SOSGREEN',
    counts:[
      {label:'有料（プロ）', collection:'profiles', where:['plan', 'pro']},
      {label:'診断', collection:'diagnoses'},
      {label:'植物', collection:'plants'}
    ] }
];
