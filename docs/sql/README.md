# 管理画面用の集計関数（Supabase）

各アプリの Supabase に、集計した数字だけを返す関数 `admin_app_stats(p_token)` を追加します。

1. 対象のプロジェクトで、`supabase_アプリ名_admin_stats.sql` の内容を実行する（SQL Editor に貼り付けて Run）
2. 合言葉を登録する（合言葉そのものではなくハッシュを保存）
   ```sql
   insert into private.admin_stats_token (token_hash)
   values (encode(extensions.digest('ここに合言葉', 'sha256'), 'hex'));
   ```
3. 同じ合言葉を、Cloudflare Pages の環境変数（シークレット）`SB_アプリ名_TOKEN` に登録する
4. `server/apps.js` に、そのプロジェクトの URL と公開キー（publishable / anon）を書く
