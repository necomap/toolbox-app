// 管理画面で集計するアプリの一覧
// ▼ アプリを追加するときは、ここに1つ足して、必要な秘密情報を Cloudflare の環境変数に登録する
//
// Firebase のアプリ：
//   secret … サービスアカウントの鍵（JSONファイルの中身まるごと）を入れた環境変数の名前
//   counts … 件数を数える Firestore のコレクション。group:true でサブコレクションもまとめて数える。
//            where:['項目名', 値] で条件付きにできる（例：有料プランの人数）
// Supabase のアプリ：
//   url / key … プロジェクトのURLと公開キー（publishable / anon。公開されても問題ないもの）
//   secret    … 集計専用の合言葉を入れた環境変数の名前（データベースの admin_app_stats 関数が照合する）
export const APPS = [
  { id:'foodlabel', name:'FoodLabel Pro', site:'https://foodlabel.lucke.jp', type:'supabase',
    url:'', key:'', secret:'SB_FOODLABEL_TOKEN' },
  { id:'nekomap', name:'NekoMap', site:'https://nekomap.lucke.jp', type:'supabase',
    url:'', key:'', secret:'SB_NEKOMAP_TOKEN' },
  { id:'inventory', name:'Lucke Inventory', site:'https://inventory.lucke.jp', type:'firebase', secret:'FB_INVENTORY',
    counts:[
      {label:'商品', collection:'items'},
      {label:'入出庫の記録', collection:'transactions'},
      {label:'仕入先', collection:'suppliers'},
      {label:'棚卸し', collection:'stocktakeSessions'},
      {label:'有料（プレミアム）', collection:'users', where:['plan', 'premium']},
      {label:'有料（プロ）', collection:'users', where:['plan', 'pro']}
    ] },
  { id:'haccp', name:'HACCP管理システム', site:'https://haccp.lucke.jp', type:'firebase', secret:'FB_HACCP', counts:[] },
  { id:'reserve', name:'テイクアウト予約', site:'https://reserve.lucke.jp', type:'firebase', secret:'FB_RESERVE', counts:[] },
  { id:'boki', name:'複式簿記 記録ツール', site:'https://boki.lucke.jp', type:'firebase', secret:'FB_BOKI', counts:[] },
  { id:'sosgreen', name:'たすけてグリーン', site:'https://sosgreen.lucke.jp', type:'firebase', secret:'FB_SOSGREEN', counts:[] }
];
