#!/bin/bash

echo "🚀 casto 開発環境セットアップを開始します..."

# 1. 依存関係インストール
echo "📦 依存関係をインストール中..."
npm install

# 2. 環境変数ファイル作成
if [ ! -f .env.local ]; then
    echo "📝 環境変数ファイルを作成中..."
    cp .env.example .env.local
    echo "⚠️  .env.local を編集して実際の値を設定してください"
fi

# 3. PostgreSQL コンテナ起動
echo "🐘 PostgreSQL コンテナを起動中..."
if ! docker ps | grep -q casto-postgres; then
    if docker ps -a | grep -q casto-postgres; then
        echo "既存のコンテナを起動中..."
        docker start casto-postgres
    else
        echo "新しいコンテナを作成中..."
        docker run --name casto-postgres \
            -e POSTGRES_DB=casto_dev \
            -e POSTGRES_USER=casto \
            -e POSTGRES_PASSWORD=dev_password \
            -p 5432:5432 \
            -d postgres:15
    fi
    
    echo "⏳ PostgreSQL の起動を待機中..."
    sleep 5
fi

# 4. Cloudflare CLI インストール確認
if ! command -v wrangler &> /dev/null; then
    echo "🔧 Cloudflare CLI (wrangler) をインストール中..."
    npm install -g wrangler
fi

echo "✅ セットアップ完了!"
echo ""
echo "🎯 次のステップ:"
echo "1. .env.local を編集して実際の値を設定"
echo "2. npm run dev で開発サーバー起動"
echo "3. https://casto.sb2024.xyz (Web) と https://casto.sb2024.xyz/api (API) にアクセス"
echo ""
echo "📚 詳細は docs/DEVELOPMENT.md を参照してください"
