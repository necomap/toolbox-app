# 個人事業主の道具箱（tools.lucke.jp）

登録不要・ビルド不要の静的サイトです。HTML/CSS/JSのみで動き、入力データはブラウザ内（localStorage）にだけ保存されます。

## 収録ツール（v0.1）
| ファイル | 内容 |
|---|---|
| index.html | トップ（ツール一覧） |
| gensen.html | 源泉徴収 逆算（手取り⇄請求額） |
| invoice.html | 請求書作成（インボイス・源泉対応、PDF保存） |
| nouzei.html | 納税積立カレンダー（支払月と毎月の積立額） |
| anbun.html | 家事按分（按分率計算・根拠記録・CSV） |
| jikyu.html | 案件別 実質時給 |
| privacy.html | プライバシーポリシー（AdSense審査用） |

## 公開手順（Vercel・ユーザー作業）
1. Vercelで新規プロジェクトを作成し、このフォルダをアップロード（GitHub経由 or `npx vercel` で公開）。Framework は「Other」、ビルドコマンドなし。
2. Vercelのプロジェクト設定 → Domains で `tools.lucke.jp` を追加。
3. lucke.jp のDNS管理画面で、表示された CNAME（`tools` → `cname.vercel-dns.com` 等）を登録。
4. 数分〜数時間でHTTPS付きで公開されます。

## 公開後に差し替える箇所
- `assets/common.js` の `feedbackUrl`（Googleフォーム等）、`tipUrl`（投げ銭リンク）
- 各ページの `<div class="ad-slot">` → AdSense の広告コード
- 各ページの `<div class="aff">` → アフィリエイトリンク（A8.net・もしもアフィリエイト等）
- Google Search Console に `sitemap.xml` を登録

## テスト
`node tests/calc.test.js` … 源泉徴収の計算（国税庁の計算方法）と逆算の最小性を検証。

## 修正履歴
- v0.1（2026-10-06）初版：5ツール＋トップ＋プライバシーポリシー
