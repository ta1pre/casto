# Supabase セットアップガイド

本ドキュメントは「確定している事実のみ」を記載します。機密情報（Project ID/URL/API Key）は記載しません。

## 1. 前提
- **マイグレーション定義**: `supabase/migrations/001_initial_schema.sql`
- **環境変数テンプレート**: `.env.example`（開発用 `DATABASE_URL` 等を参照）
- **CLI**: Supabase CLI が利用可能（`supabase` コマンド）

## 2. マイグレーション方針
スキーマは `supabase/migrations/` 配下の SQL で管理し、確定済みの定義のみをコミットする。テーブル一覧やポリシーの詳細はマイグレーションファイル内を参照する。[SF][TR]

## 3. セットアップ（CLI）
プロジェクト作成とリンクは Supabase CLI で行います。実際の Project Ref は各自の環境のものを使用してください。

```bash
# ログイン（ブラウザ認証）
supabase login

# 既存プロジェクトにリンク（<PROJECT_REF> を置換）
supabase link --project-ref <PROJECT_REF>

# マイグレーション適用（本番/共有環境では reset は慎重に）
supabase db push --linked
# （必要に応じて）初期化
# supabase db reset --linked
```

## 4. 環境変数
実値は `.env.local`（ローカル）やデプロイ環境のシークレットに設定してください。リポジトリにはコミットしません。
- 参考: `.env.example`
- 最低限、アプリやワーカーが DB/Supabase に接続するために以下が必要になる場合があります。
  - `DATABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`（必要な場合のみ）

## 5. Cloudflare Workers（必要時）
Workers から DB/Supabase に接続する場合、シークレットは CLI で登録します。
```bash
# プロジェクト直下または該当ワーカーのディレクトリで実行
wrangler secret put DATABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

## 6. 接続確認（CLI）
```bash
# プロジェクトにリンク済みであれば、マイグレーション状態や接続を確認
supabase db pull --linked --schema public >/dev/null && echo "OK"
```

## 7. 変更手順（開発フロー）
1. `supabase/migrations/` に SQL を追加
2. ローカルで `supabase db push` で適用
3. レビュー後、CI/CD から本番環境へ反映

以上、確定事項のみ。
