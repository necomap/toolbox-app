# 個人事業主の道具箱（toolbox.lucke.jp）

登録不要・ビルド不要の静的サイトです。HTML/CSS/JSのみで動き、入力データはブラウザ内（localStorage）にだけ保存されます。

## 収録ツール（v0.3）
| ファイル | 内容 |
|---|---|
| index.html | トップ（ツール一覧） |
| gensen.html | 源泉徴収 逆算（手取り⇄請求額） |
| invoice.html | 請求書・見積書・納品書作成（インボイス・源泉対応、PDF保存） |
| nouzei.html | 納税積立カレンダー（支払月と毎月の積立額） |
| anbun.html | 家事按分（按分率計算・根拠記録・CSV） |
| jikyu.html | 案件別 実質時給 |
| shohizei.html | 消費税 納税額比較（原則・簡易課税・2割特例／3割特例） |
| genka.html | 減価償却（定額法・一括償却・少額減価償却資産の特例の判定、中古資産の耐用年数） |
| inshi.html | 収入印紙 判定（領収書・請負契約書・基本契約書など） |
| furusato.html | ふるさと納税 上限額（個人事業主向け） |
| privacy.html | プライバシーポリシー（AdSense審査用） |
| 404.html | ページが見つからない時の案内 |

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
- `node tests/calc.test.js` … 源泉徴収の計算（国税庁の計算方法）と逆算の最小性を検証（78項目）
- `node tests/tax.test.js` … 消費税・減価償却・印紙税・ふるさと納税の計算を手計算の期待値で検証（106項目）
- `python tests/e2e.py` … 全ページのブラウザ動作テスト（80項目：計算値・保存復元・印刷・ダークモード・スマホ幅）。事前に `python -m http.server 8766` をこのフォルダで起動

## 税制の前提（毎年見直す箇所）
`assets/tax.js` に年ごとのルールがまとまっています。税制改正があったらここを直し、`tests/tax.test.js` を更新してください。
- 消費税：2割特例は2026年分まで、3割特例（個人事業者のみ）は2027・2028年分
- 減価償却：少額減価償却資産の特例は2026年4月1日以後の事業供用分から40万円未満（それ以前は30万円未満）、2029年3月31日まで
- 印紙税：建設工事の請負契約書の軽減措置は2027年3月31日作成分まで
- ふるさと納税：所得税の基礎控除は2026・2027年分が104万／67万／62万円の3段階。2027年以降の寄附は特例控除額の上限193万円

## 修正履歴
- v0.4（2026-10-07）Amazonアソシエイト（lucketool-22）のおすすめ枠を各ツールページに追加（`assets/common.js` の `AMAZON` でキーワード管理）／フッターとプライバシーポリシーにアソシエイト表記を追加／リンク未設置のアフィリエイト枠・広告枠を自動で非表示に
- v0.3（2026-10-06）消費税 納税額比較・減価償却・収入印紙 判定・ふるさと納税 上限額の4ツールを追加／金額が折り返さないよう表示を調整／hidden属性が効かない場合がある不具合を修正
- v0.2（2026-10-06）請求書ツールに見積書・納品書の切替を追加／404ページ追加／OGP・canonical・ファビコン追加／時給ツールで全案件が赤字のときグラフ幅が崩れる不具合を修正／ブラウザ自動テスト追加／公開ドメインを toolbox.lucke.jp に確定
- v0.1（2026-10-06）初版：5ツール＋トップ＋プライバシーポリシー
