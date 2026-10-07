// ほかのアプリ一覧（apps.html で表示）
// ▼ アプリを追加するときは、下の一覧に1行（{ ... },）足すだけ。削除は行を消すだけ。
//   name: アプリ名 / url: トップページのURL / cat: 分類（同じ分類名どうしでまとまって表示）
//   desc: ひとこと説明 / thumb: 自前のサムネ画像（例 'assets/apps/haccp.png'）。空なら自動でトップページを撮影して表示
window.APPS = [
  { name:'FoodLabel Pro',           url:'https://foodlabel.lucke.jp/', cat:'飲食店・食品事業者向け', desc:'レシピ登録から、アレルゲン判定・栄養成分計算・食品表示ラベルの印刷までまとめて管理。', thumb:'' },
  { name:'HACCP管理システム',        url:'https://haccp.lucke.jp/',     cat:'飲食店・食品事業者向け', desc:'飲食店・菓子店・パン屋向けの衛生管理（HACCP）記録システム。', thumb:'' },
  { name:'テイクアウト予約',          url:'https://reserve.lucke.jp/',   cat:'飲食店・食品事業者向け', desc:'店頭払いのテイクアウト予約ページを、かんたんな設定で自店専用に公開。', thumb:'' },
  { name:'Lucke Inventory',         url:'https://inventory.lucke.jp/', cat:'飲食店・食品事業者向け', desc:'在庫管理と棚卸しをスマートに。店舗・事業所の在庫を一元管理。', thumb:'' },
  { name:'複式簿記 記録ツール',       url:'https://boki.lucke.jp/',      cat:'経理・事務',            desc:'複式簿記の記帳をサポートするツール。', thumb:'' },
  { name:'たすけてグリーン',          url:'https://sosgreen.lucke.jp/',  cat:'くらし',                desc:'写真や環境データから、AIが植物の健康状態を診断。観葉植物から家庭菜園まで。', thumb:'' },
  { name:'NekoMap',                 url:'https://nekomap.lucke.jp/',   cat:'くらし',                desc:'地域猫のナワバリ・目撃情報・TNR記録を地図でみんなと共有。', thumb:'' }
];
