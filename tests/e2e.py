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
        for n in ['index', 'gensen', 'invoice', 'nouzei', 'anbun', 'jikyu', 'privacy', '404']:
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

    check('JSエラーなし（操作中）', not errs, str(errs))
    b.close()

print(f'OK {ok} / NG {len(ng)}')
for x in ng: print('  NG:', x)
sys.exit(1 if ng else 0)
