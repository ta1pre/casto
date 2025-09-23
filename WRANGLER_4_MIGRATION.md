# Wrangler 4.x系への移行ガイド

## 問題の概要

Wrangler 3.x系から4.x系への移行時に、以下のエラーが発生：

```
✘ [ERROR] A request to the Cloudflare API (/memberships) failed.
Unable to authenticate request [code: 10001]
```

## 根本原因

Wrangler 4.x系では追加のAPI権限が必要：
- `User -> Memberships -> Read`
- `User -> User Details -> Read`

## 解決手順

### 1. 新しいAPI Tokenの作成

1. [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)にアクセス
2. "Edit Cloudflare Workers"テンプレートを使用
3. 以下の権限を設定：

```
Permissions:
- Account: Cloudflare Workers:Edit
- User: User Details:Read      ← 必須
- User: Memberships:Read       ← 必須
- Zone: Zone:Read (オプション)

Account Resources:
- Include: All accounts

Zone Resources:
- Include: All zones (必要に応じて)
```

### 2. ローカルテスト

```bash
# テストスクリプトを実行
./test-api-token.sh YOUR_NEW_API_TOKEN
```

### 3. GitHub Secretsの更新

1. Repository Settings > Secrets and variables > Actions
2. `CLOUDFLARE_API_TOKEN`を新しいトークンで更新

### 4. 動作確認

GitHub Actionsでデプロイが成功することを確認

## 重要なポイント

- **User権限が必須**: Account権限だけでは不十分
- **Memberships権限**: Wrangler 4.x系で新たに必要
- **テンプレート使用推奨**: "Edit Cloudflare Workers"テンプレートが最適

## トラブルシューティング

### エラー: code: 10001
- User Memberships権限が不足
- API Tokenを再作成してUser権限を追加

### エラー: Authentication failed
- API Tokenの有効期限を確認
- 権限設定を再確認

## 移行完了後の確認事項

- [ ] ローカル環境でのデプロイ成功
- [ ] GitHub Actionsでのデプロイ成功
- [ ] 本番環境での動作確認
- [ ] 古いAPI Tokenの無効化（セキュリティ）

## 参考情報

- [Wrangler Deprecations](https://developers.cloudflare.com/workers/wrangler/deprecations/)
- [Cloudflare API Token Permissions](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)
