# ブラウザ動作テスト（要: pip install playwright && playwright install chromium）
# 使い方: このフォルダの親で  python -m http.server 8766  を起動してから  python tests/e2e.py
import re, sys
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8766'
ok, ng = 0, []
def check(name, cond, detail=''):
    global ok
    if cond: ok += 1
    else: ng.append(f'{name} {detail}')
def yen(s): return int(re.sub(r'[^\d-]', '', s) or 0)

with sync_playwright() as p:
    b = p.chromium.launch()
    for scheme in ['light', 'dark']:
        ctx = b.new_context(viewport={'width': 390, 'height': 800}, color_scheme=scheme)
        pg = ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        for n in ['index', 'gensen', 'invoice', 'nouzei', 'anbun', 'jikyu', 'shohizei', 'genka', 'inshi', 'furusato', 'privacy', '404']:
            pg.goto(f'{BASE}/{n}.html'); pg.wait_for_timeout(100)
            sw = pg.evaluate('document.documentElement.scrollWidth')
            check(f'[{scheme}] {n} 横スクロールなし', sw <= 391, f'scrollWidth={sw}')
        check(f'[{scheme}] JSエラーなし', not errs, str(errs))
        ctx.close()

    ctx = b.new_context(viewport={'width': 1200, 'height': 900}); pg = ctx.new_page()
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))

    # --- 源泉徴収 ---
    pg.goto(f'{BASE}/gensen.html')
    pg.check('input[value=rev]'); pg.select_option('#rate', '0'); pg.fill('#amt', '897900')
    check('逆算 境界（端数切捨で999,999円が最小）', '999,999円' in pg.inner_text('#out .big'), pg.inner_text('#out .big'))
    pg.check('input[value=fwd]'); pg.select_option('#rate', '0.1'); pg.fill('#amt', '2000000')
    t = pg.inner_text('#out')
    check('順算 200万 源泉306,300', '306,300' in t, t)
    check('順算 200万 振込1,893,700', '1,893,700' in t, t)
    pg.reload()
    check('源泉 入力の保存復元', pg.input_value('#amt') == '2000000' and pg.is_checked('input[value=fwd]'))
    pg.fill('#amt', '1,234,567円')
    check('カンマ・円付き入力を解釈', yen(pg.inner_text('#out .big')) > 0)

    # --- 請求書 ---
    pg.goto(f'{BASE}/invoice.html'); pg.evaluate('localStorage.clear()'); pg.reload()
    pg.fill('#toName', '<b>テスト</b>'); pg.fill('#fromName', '山田デザイン'); pg.fill('#regNo', 'T1234567890123')
    pg.fill('[data-i="0"][data-k=name]', 'デザイン'); pg.fill('[data-i="0"][data-k=qty]', '2'); pg.fill('[data-i="0"][data-k=price]', '50000')
    pg.click('#addRow')
    pg.fill('[data-i="1"][data-k=name]', '菓子'); pg.fill('[data-i="1"][data-k=price]', '1001'); pg.select_option('[data-i="1"][data-k=rate]', '0.08')
    s = pg.inner_text('table.sum')
    check('10%消費税 10,000', '10,000円' in s, s)
    check('8%消費税 80（切捨）', '80円' in s, s)
    check('合計 111,081', '111,081円' in s, s)
    check('HTMLエスケープ', '<b>テスト</b>' in pg.inner_text('#inv'))
    check('登録番号あり→警告非表示', pg.is_hidden('#regWarn'))
    pg.select_option('#wh', '1')
    check('源泉 税抜合計で計算 10,312', '10,312円' in pg.inner_text('table.sum'), pg.inner_text('table.sum'))
    pg.reload()
    check('請求書 明細の保存復元', pg.input_value('[data-i="1"][data-k=name]') == '菓子')
    pg.click('[data-del="1"]')
    check('行削除', pg.locator('#rows tr').count() == 1)
    pg.emulate_media(media='print')
    check('印刷時 入力欄を隠す', pg.is_hidden('.editor >> nth=0'))
    pg.emulate_media(media='screen')
    pg.fill('#bank', 'テスト銀行')
    pg.select_option('#docType', 'est')
    iv = pg.inner_text('#inv')
    check('見積書 タイトル', '御見積書' in iv and 'お見積金額' in iv, iv[:80])
    check('見積書 振込先を出さない', 'テスト銀行' not in iv)
    check('見積書 期限ラベル', pg.inner_text('#lDue') == '有効期限')
    pg.select_option('#docType', 'dlv')
    check('納品書 期限欄を隠す', pg.is_hidden('#dueBox') and '納品書' in pg.inner_text('#inv'))
    pg.reload()
    check('書類種別の保存復元', pg.input_value('#docType') == 'dlv')
    pg.select_option('#docType', 'inv')
    check('請求書に戻すと振込先表示', 'テスト銀行' in pg.inner_text('#inv'))

    # --- 納税積立 ---
    pg.goto(f'{BASE}/nouzei.html'); pg.evaluate('localStorage.clear()'); pg.reload()
    pg.fill('#itPrev', '100000'); pg.fill('#jumin', '150001'); pg.fill('#kokuho', '300007'); pg.select_option('#kokuhoN', '12')
    cal = pg.inner_text('#cal')
    check('15万円未満は予定納税なし', '予定納税' not in cal)
    check('国保12回 全期表示', all(f'国民健康保険 {i}期' in cal for i in range(1, 13)), cal)
    check('年額合計一致', '550,008円' in pg.inner_text('#out'), pg.inner_text('#out'))
    bals = [yen(r.split('\t')[-1]) for r in cal.strip().split('\n')[1:] if '月' in r]
    check('積立残高が一度もマイナスにならない', all(x >= 0 for x in bals), str(bals))
    pg.fill('#itPrev', '150000')
    check('15万円以上で予定納税', '予定納税1期：50,000円' in pg.inner_text('#cal'))

    # --- 家事按分 ---
    pg.goto(f'{BASE}/anbun.html'); pg.evaluate('localStorage.clear()'); pg.reload()
    pg.fill('#aBiz', '10'); pg.fill('#aAll', '40')
    check('面積按分 25%', '25.0%' in pg.inner_text('#areaOut'))
    pg.fill('[data-i="0"][data-k=amount]', '1200000'); pg.fill('[data-i="0"][data-k=rate]', '150')
    check('按分率100%上限', '1,200,000円' in pg.inner_text('#out .big'), pg.inner_text('#out .big'))
    with pg.expect_download() as d: pg.click('#csv')
    check('CSV出力', d.value.suggested_filename.endswith('.csv'))

    # --- 時給 ---
    pg.goto(f'{BASE}/jikyu.html'); pg.evaluate('localStorage.clear()'); pg.reload()
    pg.fill('#goal', '3000'); pg.fill('[data-k=fee]', '10000'); pg.fill('[data-k=cost]', '20000'); pg.fill('[data-k=hours]', '5')
    check('赤字案件の時給はマイナス表示', '-2,000円' in pg.inner_text('#out'), pg.inner_text('#out'))
    pg.click('#addRow'); pg.fill('[data-i="1"][data-k=fee]', '50000')
    check('時間未入力の行は集計外', pg.inner_text('#out').count('円') >= 1)

    # --- 消費税 比較 ---
    pg.goto(f'{BASE}/shohizei.html'); pg.evaluate('localStorage.clear()'); pg.reload()
    pg.fill('#s10', '11000000'); pg.fill('#p10', '3300000'); pg.fill('#kijun', '5000000')
    t = pg.inner_text('#out')
    check('消費税 2割特例が最安', '2割特例：200,000円' in pg.inner_text('#out .big'), pg.inner_text('#out .big'))
    check('消費税 原則700,000', '700,000円' in t, t)
    check('消費税 簡易500,000', '500,000円' in t, t)
    pg.select_option('#year', '2027')
    check('消費税 2027は3割特例', '3割特例：300,000円' in pg.inner_text('#out .big'), pg.inner_text('#out .big'))
    pg.fill('#kijun', '12000000')
    check('消費税 1000万超は特例不可→簡易', '簡易課税：500,000円' in pg.inner_text('#out .big'), pg.inner_text('#out .big'))
    pg.fill('#p10', '9900000')
    check('消費税 経費多いと原則', '原則課税' in pg.inner_text('#out .big'), pg.inner_text('#out .big'))
    pg.reload()
    check('消費税 保存復元', pg.input_value('#year') == '2027' and pg.input_value('#p10') == '9900000')

    # --- 減価償却 ---
    pg.goto(f'{BASE}/genka.html'); pg.evaluate('localStorage.clear()'); pg.reload()
    pg.fill('#cost', '200000'); pg.fill('#sy', '2026'); pg.select_option('#sm', '10'); pg.select_option('#blue', '0')
    t = pg.inner_text('#out')
    check('減価償却 定額法 1年目12,500', '12,500円' in pg.inner_text('#out .big'), t)
    check('減価償却 最終年37,499', '37,499円' in t, t)
    pg.select_option('#blue', '1'); pg.fill('#cost', '350000')
    check('減価償却 35万 青色 少額特例', '350,000円' in pg.inner_text('#out .big'), pg.inner_text('#out'))
    pg.select_option('#sm', '3')
    check('減価償却 2026/3は少額特例不可', '350,000円' not in pg.inner_text('#out .big'), pg.inner_text('#out .big'))
    pg.select_option('#kind', index=5); pg.check('input[name=used][value="1"]'); pg.fill('#ey', '4'); pg.fill('#cost', '1200000'); pg.select_option('#sm', '1')
    t = pg.inner_text('#out')
    check('減価償却 中古車4年落ち→2年', '2年' in t and '600,000円' in pg.inner_text('#out .big'), t)
    pg.fill('#ratio', '50')
    check('減価償却 事業割合50%', '300,000円' in pg.inner_text('#out .big'), pg.inner_text('#out .big'))
    pg.reload()
    check('減価償却 保存復元', pg.input_value('#ratio') == '50' and pg.is_checked('input[name=used][value="1"]'))

    # --- 収入印紙 ---
    pg.goto(f'{BASE}/inshi.html'); pg.evaluate('localStorage.clear()'); pg.reload()
    pg.fill('#amt', '54000')
    check('印紙 税込54,000 税抜判定で不要', pg.inner_text('#out .big') == '不要', pg.inner_text('#out'))
    pg.uncheck('#sep')
    check('印紙 税込判定で200円', pg.inner_text('#out .big') == '200円', pg.inner_text('#out'))
    pg.check('#elec')
    check('印紙 電子なら不要', pg.inner_text('#out .big') == '不要')
    pg.uncheck('#elec'); pg.select_option('#kind', 'kensetsu'); pg.check('#sep'); pg.fill('#amt', '11000000'); pg.fill('#made', '2026-10-06')
    check('印紙 建設1000万 軽減5,000', pg.inner_text('#out .big') == '5,000円', pg.inner_text('#out'))
    pg.fill('#made', '2027-04-01')
    check('印紙 建設 2027/4以降 本則10,000', pg.inner_text('#out .big') == '10,000円', pg.inner_text('#out'))
    pg.select_option('#kind', 'other')
    check('印紙 請求書 不要・金額欄なし', pg.inner_text('#out .big') == '不要' and pg.is_hidden('#amtBox'))

    # --- ふるさと納税 ---
    pg.goto(f'{BASE}/furusato.html'); pg.evaluate('localStorage.clear()'); pg.reload()
    pg.select_option('#year', '2026')
    pg.fill('#sales', '5000000'); pg.fill('#expenses', '1350000'); pg.fill('#shakai', '500000')
    check('ふるさと 単身 50,177', '50,177円' in pg.inner_text('#out .big'), pg.inner_text('#out'))
    pg.fill('#sales', '1500000'); pg.fill('#shakai', '200000')
    check('ふるさと 所得割なし→0円', '0円' == pg.inner_text('#out .big'), pg.inner_text('#out'))
    pg.reload()
    check('ふるさと 保存復元', pg.input_value('#sales') == '1500000')

    check('JSエラーなし（操作中）', not errs, str(errs))
    b.close()

print(f'OK {ok} / NG {len(ng)}')
for x in ng: print('  NG:', x)
sys.exit(1 if ng else 0)
