# Phase 1 デプロイ・動作確認手順

## ✅ 完了した実装

### フロントエンド
- `useLiffAuth` フック（LIFF認証の共通ロジック）
- トップページ（`/liff`）
- オーディション詳細ページ（`/liff/auditions/[id]`）
- 共通コンポーネント（LoadingScreen, ErrorScreen）

### Workers API
- `GET /api/v1/users/me/profile-status` - プロフィール完了判定
- `POST /api/v1/users/me/history` - 閲覧履歴保存
- `GET /api/v1/users/me/recent-auditions` - 最近見たオーディション取得

### データベース
- `applicant_profiles` テーブル（マイグレーション作成済み）
- `viewing_history` テーブル（マイグレーション作成済み）

---

## 🚀 デプロイ手順

### 1. データベースマイグレーション適用

```bash
cd /Users/taichiumeki/dev/services/casto

# Supabaseにログイン
supabase login

# プロジェクトにリンク（既にリンク済みの場合はスキップ）
# supabase link --project-ref <PROJECT_REF>

# マイグレーション適用
supabase db push --linked
```

**確認:**
```bash
# テーブルが作成されたか確認
supabase db pull --linked --schema public
```

### 2. Workers デプロイ（開発環境）

```bash
cd apps/workers

# 開発環境へデプロイ
npm run deploy:dev
# または
npx wrangler deploy --env dev
```

**確認:**
```bash
# ヘルスチェック
curl https://casto-workers-dev.casto-api.workers.dev/api/v1/health

# プロフィールステータスAPI（認証必要）
curl -H "Cookie: auth_token=<your_token>" \
  https://casto-workers-dev.casto-api.workers.dev/api/v1/users/me/profile-status
```

### 3. Web デプロイ（Docker）

```bash
cd /Users/taichiumeki/dev

# コンテナ再起動
docker compose restart casto

# ログ確認
docker logs -f casto
```

**確認:**
- ブラウザで `https://casto.sb2024.xyz` にアクセス
- `/liff` ページが表示されるか確認

---

## 🧪 動作確認手順

### 1. LIFF認証テスト

1. LINE Developers Consoleで LIFF URLを設定
   - Endpoint URL: `https://casto.sb2024.xyz/liff`
   
2. LINE公式アカウントのメニューから起動
   
3. 認証が自動で実行されることを確認
   - ローディング画面 → ホーム画面への遷移
   - デバッグ情報でユーザー情報が表示される

### 2. プロフィール判定API テスト

```bash
# 1. LINE認証してCookieを取得（ブラウザのDevToolsから）
# 2. APIを呼び出し
curl -H "Cookie: auth_token=<your_token>" \
  https://casto-workers-dev.casto-api.workers.dev/api/v1/users/me/profile-status

# 期待されるレスポンス:
# {
#   "isComplete": false,
#   "missingFields": ["nickname", "birthdate"],
#   "completionRate": 0,
#   "profile": null
# }
```

### 3. 閲覧履歴テスト

```bash
# 履歴保存
curl -X POST \
  -H "Cookie: auth_token=<your_token>" \
  -H "Content-Type: application/json" \
  -d '{"auditionId":"test-audition-123","action":"view"}' \
  https://casto-workers-dev.casto-api.workers.dev/api/v1/users/me/history

# 履歴取得
curl -H "Cookie: auth_token=<your_token>" \
  https://casto-workers-dev.casto-api.workers.dev/api/v1/users/me/recent-auditions
```

### 4. オーディション詳細ページ（404リダイレクト）

1. 存在しないオーディションIDでアクセス
   - `https://casto.sb2024.xyz/liff/auditions/non-existent-id`
   
2. エラー画面が表示され、2秒後に `/liff` へリダイレクトされることを確認

---

## 🔧 環境変数の確認

### Web (.env.local)

```bash
# 必須
NEXT_PUBLIC_LINE_LIFF_ID="your-liff-id"
NEXT_PUBLIC_API_BASE_URL="https://casto-workers-dev.casto-api.workers.dev"
NEXT_PUBLIC_WEB_BASE_URL="https://casto.sb2024.xyz"
```

### Workers (wrangler.toml または secrets)

```bash
# wrangler secret put で設定
wrangler secret put JWT_SECRET --env dev
wrangler secret put DATABASE_URL --env dev
wrangler secret put SUPABASE_URL --env dev
wrangler secret put SUPABASE_SERVICE_ROLE_KEY --env dev
wrangler secret put LINE_CHANNEL_ID --env dev
wrangler secret put LINE_CHANNEL_SECRET --env dev
```

**確認:**
```bash
# 設定済みのsecretsを確認
wrangler secret list --env dev
```

---

## ⚠️ トラブルシューティング

### 問題: マイグレーションが適用されない

```bash
# マイグレーションファイルの確認
ls -la supabase/migrations/

# 手動でSQLを実行（Supabase Dashboard → SQL Editor）
# 内容をコピペして実行
```

### 問題: Workers APIが404を返す

```bash
# デプロイ状況確認
wrangler deployments list --env dev

# ログ確認
wrangler tail --env dev
```

### 問題: LIFF認証が失敗する

1. LIFF IDが正しく設定されているか確認
   ```bash
   echo $NEXT_PUBLIC_LINE_LIFF_ID
   ```

2. LINE Developers ConsoleでLIFF URLが正しいか確認
   - `https://casto.sb2024.xyz/liff`

3. ブラウザのConsoleでエラーを確認

### 問題: RLSエラーが発生する

```sql
-- Supabase Dashboard → SQL Editor で実行
-- RLSポリシーの確認
SELECT * FROM pg_policies WHERE tablename IN ('applicant_profiles', 'viewing_history');

-- 一時的にRLSを無効化（開発環境のみ）
ALTER TABLE applicant_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE viewing_history DISABLE ROW LEVEL SECURITY;
```

---

## 📊 次のステップ（Phase 2）

Phase 1が正常に動作したら、Phase 2に進みます：

1. プロフィール作成ページ（`/liff/profile/new`）
2. プロフィール促進バナー
3. 応募ページのプロフィール必須チェック

---

## 📝 チェックリスト

- [ ] マイグレーション適用完了
- [ ] Workers デプロイ完了（dev環境）
- [ ] Web デプロイ完了（Docker）
- [ ] LIFF認証が正常に動作
- [ ] プロフィール判定APIが正常に動作
- [ ] 閲覧履歴APIが正常に動作
- [ ] 404リダイレクトが正常に動作
- [ ] 環境変数がすべて設定済み

すべてチェックが完了したら Phase 1 は完了です！ 🎉
