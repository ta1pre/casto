# ⚠️ ローカル開発環境について

## 🚫 このディレクトリで直接起動しないでください

このcastoプロジェクトは、**上位階層のDocker環境で統合管理**されています。

### ❌ やってはいけないこと

```bash
# このディレクトリで直接実行しないでください
npm run dev
npm run dev:web
npm start
```

### ✅ 正しい起動方法

**メインのDocker環境から起動してください：**

```bash
# /Users/taichiumeki/dev/ ディレクトリで実行
cd /Users/taichiumeki/dev/
docker-compose up -d casto
```

## 🏗️ アーキテクチャ

```
/Users/taichiumeki/dev/
├── docker-compose.yml          # ← メインのDocker設定
├── services/
│   └── casto/                  # ← このディレクトリ
│       ├── apps/web/           # Next.jsアプリ
│       ├── Dockerfile.dev      # Docker設定
│       └── docs/               # このファイル
└── infrastructure/
    └── tunnel/config.yml       # Cloudflare Tunnel設定
```

## 🌐 アクセス方法

- **外部アクセス**: https://casto.sb2024.xyz
- **ローカルテスト**: `curl -H "Host: casto.sb2024.xyz" https://localhost:443`

## 🔧 開発時の注意点

1. **Docker環境必須**: Traefik、Cloudflare Tunnel連携のため
2. **ポート競合回避**: 直接起動すると他のサービスと競合
3. **統合管理**: 全サービス（hqmahjong、tokyoestate等）と統一管理

## 🐛 トラブルシューティング

### 勝手にNext.jsが起動してしまった場合

```bash
# プロセス確認
ps aux | grep -i next

# プロセス停止
kill [PID]

# 正しい方法で再起動
cd /Users/taichiumeki/dev/
docker-compose restart casto
```

### ポート51231等で起動してしまった場合

これは通常、IDEやエディタの機能によるものです：
- VSCode/Windsurf等のNext.js自動起動機能を無効化
- `.vscode/settings.json`で自動起動を制御

## 📚 関連ドキュメント

- [メインREADME](/Users/taichiumeki/dev/README.md)
- [デプロイ環境](../README.md)
- [技術仕様書](../docs/)

---

**重要**: このプロジェクトは本番デプロイ環境（Vercel + Cloudflare Workers）と開発環境（Docker統合管理）が分離されています。ローカルでの直接起動は環境の整合性を損なう可能性があります。
