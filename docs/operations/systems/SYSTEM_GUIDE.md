# casto システムガイド

## 1. 目的

このドキュメントは、`casto` プロジェクトの技術的な全体像、特にアーキテクチャ、データベース構造、および開発環境のセットアップ方法について説明します。

## 2. アーキテクチャ概要

`casto` は、以下の主要コンポーネントで構成されるMonorepoプロジェクトです。

- **Frontend (`apps/web`)**: Next.js を使用したWebアプリケーション。ユーザーインターフェースを提供します。
- **Backend (`apps/workers`)**: Cloudflare Workers 上で動作するサーバーレスAPI。ビジネスロジックを担当します。
- **Database**: Supabase (PostgreSQL) を使用。ユーザーデータやアプリケーションデータを管理します。

## 3. データベース

データベースはSupabaseを利用しており、現在のテーブル構造は以下のようにシンプル化されています。

### `users` テーブルスキーマ

```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  line_user_id VARCHAR(100) UNIQUE,
  
  -- 基本情報
  display_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  
  -- アカウント種別
  role VARCHAR(20) NOT NULL DEFAULT 'applicant' 
    CHECK (role IN ('applicant', 'fan', 'organizer', 'manager', 'admin')),
  
  -- 認証方法
  auth_provider VARCHAR(20) NOT NULL DEFAULT 'line'
    CHECK (auth_provider IN ('line', 'email')),
  
  -- ステータス
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  
  -- タイムスタンプ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  
  -- 制約: emailまたはline_user_idのどちらかは必須
  CONSTRAINT users_auth_check CHECK (
    (email IS NOT NULL) OR (line_user_id IS NOT NULL)
  )
);
```

## 4. 環境変数

ローカルでの開発には環境変数の設定が必要です。
プロジェクトルートにある `.env.example` ファイルをコピーして `.env.local` を作成し、必要な値を設定してください。

詳細は [`.env.example`](../.env.example) を参照してください。

## 5. ローカル開発環境セットアップ

1.  **リポジトリのクローン**
    ```bash
    git clone <repository_url>
    cd casto
    ```

2.  **パッケージのインストール**
    ```bash
    pnpm install
    ```

3.  **環境変数の設定**
    `.env.example` をコピーして `.env.local` を作成し、SupabaseのURLやキーなどの必須項目を埋めます。

4.  **開発サーバーの起動**
    ```bash
    pnpm dev
    ```

これで、WebアプリケーションとAPIサーバーが起動します。

## 6. Vercel連携

このプロジェクトのフロントエンド (`apps/web`) は、Vercelにデプロイされます。

- **Vercelプロジェクト**: `ta1pres-projects/web`
- **連携状態**: ローカル環境とVercelプロジェクトは `vercel link` コマンドによって紐付けられています。

**トラブルシューティング**:
Gitリポジトリにpushしてもデプロイが開始されない場合、ローカルとVercelの連携が切れている可能性があります。その場合は、以下のコマンドを実行して再リンクしてください。

```bash
cd apps/web
vercel link
```

このコマンドにより `.vercel` ディレクトリが作成され、プロジェクトIDなどが保存されます。このディレクトリは `.gitignore` に含まれており、バージョン管理の対象外です。
