# 🚨 絶対に守るべき重要ルール（CRITICAL RULES）

このドキュメントは、casto プロジェクトにおいて**絶対に違反してはならない**重要なルールをまとめたものです。

## ⛔ 禁止事項

### 1. Supabase接続で `http://localhost` を使用してはならない

**絶対に `http://localhost` をSupabase URLとして使用しないこと**

#### 理由
- ブラウザクライアント（Next.js）では本番環境のSupabase Project URLが必要
- `http://localhost:54321` はSupabase CLI（`supabase start`）専用のURL
- ブラウザからlocalhostのSupabaseには接続できない

#### 正しい設定
```bash
# ✅ 正しい
NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# ❌ 間違い
NEXT_PUBLIC_SUPABASE_URL="http://localhost:54321"
NEXT_PUBLIC_SUPABASE_URL="http://localhost"
NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
```

#### 適用箇所
- `/apps/web/src/lib/supabase.ts` - Supabaseクライアント設定
- `.env.local` - 環境変数設定
- Docker環境変数

#### 参考ドキュメント
- [Supabase Local Development](https://supabase.com/docs/guides/local-development/overview)
- `/docs/setup/LOCAL_DEVELOPMENT.md`

---

### 2. localhost:3000での直接起動を禁止

**絶対にlocalhostでNext.jsを直接起動しないこと**

#### 理由
- 全ての開発作業はDocker Compose経由で行う
- Traefikリバースプロキシを経由したHTTPS接続が必須
- 環境の一貫性を保つため

#### 禁止コマンド
```bash
# ❌ 絶対に実行しない
npm run dev
npm start
next dev
```

#### 正しい手順
```bash
# ✅ Docker Compose経由で起動
cd /Users/taichiumeki/dev/
docker compose up -d casto
```

#### 参考ドキュメント
- `/docs/setup/LOCAL_DEVELOPMENT.md`

---

## 📝 このドキュメントの重要性

- このルールを破ると、アプリケーションが正常に動作しなくなる
- 開発環境と本番環境の整合性が失われる
- デバッグが困難になる

## 🔄 更新履歴

- 2025-10-01: 初版作成 - Supabase localhost禁止ルールを明記
