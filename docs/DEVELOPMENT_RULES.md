# 開発ルール

## Workers開発環境

### ⚠️ 重要：Workersはローカルで実行しない

**方針**: Cloudflare Workers は Cloudflare の開発環境にのみデプロイして動作確認を行います。

**理由**:
- ローカル環境（`wrangler dev`）での動作は本番環境と差異が生じる可能性がある
- 環境変数管理が煩雑になる
- Cloudflare特有の機能（KV、Durable Objects等）の動作が異なる

### 開発フロー

1. **コード変更**
   - `apps/workers/src/` 配下のコードを編集

2. **型チェック**
   ```bash
   cd apps/workers
   npm run type-check
   ```

3. **デプロイ（development環境）**
   ```bash
   npm run deploy:dev
   ```

4. **動作確認**
   - `https://casto.sb2024.xyz/api/v1/*` で確認
   - `npm run tail:dev` でログ監視

5. **本番デプロイ**
   ```bash
   npm run deploy:prod
   ```

## データベース接続

### ⚠️ 重要：フロントエンドからSupabaseへの直接接続は禁止

**アーキテクチャ**:
```
フロントエンド → Workers API → Supabase
```

### 理由
- セキュリティ：Service Role Keyをフロントエンドに露出させない
- 権限管理の一元化：Workers側で統一的に制御
- RLS不要：Workers（Service Role）経由のみアクセス可能

### 実装方針

#### ✅ 正しい実装
```typescript
// フロントエンド: Workers APIを呼ぶ
const response = await fetch(`${API_BASE}/api/v1/users`)
```

```typescript
// Workers: Supabaseにアクセス
const supabase = createSupabaseClient(c)
const { data } = await supabase.from('users').select('*')
```

#### ❌ 禁止パターン
```typescript
// フロントエンドから直接Supabaseクライアントを使用
import { supabase } from '@/shared/lib/supabase'
const { data } = await supabase.from('users').select('*') // 禁止
```

**注意**: `apps/web/src/shared/lib/supabase.ts` ファイルは存在しますが、使用しないでください。

## テスト用ページ

### `/test` ディレクトリ

- **用途**: Workers API の動作確認
- **接続先**: `NEXT_PUBLIC_API_BASE_URL` → Workers
- **Supabase**: Workers経由でのみアクセス

## 環境変数

### フロントエンド (`apps/web/.env.local`)
```bash
NEXT_PUBLIC_API_BASE_URL="https://casto.sb2024.xyz/api"
NEXT_PUBLIC_LINE_LIFF_ID="..."
```

### Workers (Cloudflare Secrets)
```bash
# 以下はwrangler secretで設定
JWT_SECRET
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
LINE_CHANNEL_ID
LINE_CHANNEL_SECRET
ALLOWED_ORIGINS
```

**重要**: Workers の環境変数は `.dev.vars` ではなく `wrangler secret put` で本番環境に設定します。

## 禁止事項

1. ❌ Workersをローカル（`wrangler dev`）で実行
2. ❌ フロントエンドからSupabaseへ直接接続
3. ❌ `SUPABASE_SERVICE_ROLE_KEY` をフロントエンドに配置
4. ❌ `.dev.vars` を本番環境変数として使用

## CI/CD

- **GitHub Actions**: 自動デプロイワークフロー
- **development環境**: `apps/workers/.github/workflows/development-deploy.yml`
- **production環境**: `apps/workers/.github/workflows/production-deploy.yml`

デプロイは自動化されており、手動での `wrangler deploy` は原則不要です。
