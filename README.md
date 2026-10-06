# 個人事業主の道具箱（toolbox.lucke.jp）

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

## 公開手順（Cloudflare Pages ＋ お名前.com DNS）
※ Vercel 無料（Hobby）プランは広告・アフィリエイト設置が規約上不可のため、収益化までは Cloudflare Pages で運用。収益が出たら Vercel Pro へ移行予定（DNSのCNAME先を変えるだけ）。
1. Cloudflare → Workers & Pages → Create → Pages → Import an existing Git repository → GitHub連携 → `tool-app` を選択
2. Framework preset: None / Build command: 空欄 / Build output directory: `/` → Save and Deploy
3. プロジェクト → Custom domains → Set up a custom domain → `toolbox.lucke.jp`
4. お名前.com Navi → DNS設定 → lucke.jp → DNSレコード設定に CNAME（ホスト名 `tools` / VALUE `<プロジェクト名>.pages.dev`）を追加
5. GitHub の main に push すると自動で再公開される

## 公開後に差し替える箇所
- `assets/common.js` の `feedbackUrl`（Googleフォーム等）、`tipUrl`（投げ銭リンク）
- 各ページの `<div class="ad-slot">` → AdSense の広告コード
- 各ページの `<div class="aff">` → アフィリエイトリンク（A8.net・もしもアフィリエイト等）
- Google Search Console に `sitemap.xml` を登録

## テスト
`node tests/calc.test.js` … 源泉徴収の計算（国税庁の計算方法）と逆算の最小性を検証。

## 修正履歴
- v0.1（2026-10-06）初版：5ツール＋トップ＋プライバシーポリシー
