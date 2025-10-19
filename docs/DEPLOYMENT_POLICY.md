# デプロイポリシー

## ⚠️ 重要ルール

### 🚫 手動デプロイ禁止

**開発環境・本番環境ともに、手動デプロイは禁止です。**

```bash
# ❌ 禁止
npm run deploy:dev
wrangler deploy --env development
wrangler deploy --env production

# ✅ 正しい方法
git add -A
git commit -m "feat: 機能追加"
git push origin develop  # または main
```

---

## 理由

### 1. **環境変数の不整合**
手動デプロイでは GitHub Secrets が反映されません。
- `LINE_CHANNEL_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`
- その他の Secrets

### 2. **デプロイ履歴の追跡不可**
- 誰がいつデプロイしたか分からない
- ロールバックが困難
- デバッグが困難

### 3. **CI/CDの意味がない**
- テストがスキップされる
- Lintがスキップされる
- 型チェックがスキップされる

---

## 正しいデプロイフロー

### 開発環境（development）

```bash
# 1. コード変更
git add -A
git commit -m "feat: 新機能追加"

# 2. developブランチにプッシュ
git push origin develop

# 3. GitHub Actionsが自動実行
# - テスト
# - ビルド
# - Secrets設定
# - Cloudflare Workersデプロイ
```

**デプロイ確認**:
- https://github.com/ta1pre/casto/actions
- 緑色✅になるまで待つ（5〜10分）

---

### 本番環境（production）

```bash
# 1. developからmainにマージ
git checkout main
git merge develop
git push origin main

# 2. GitHub Actionsが自動実行
# - 本番環境へデプロイ
```

---

## 緊急時の対応

### 緊急修正が必要な場合でも手動デプロイ禁止

```bash
# 1. Hotfixブランチ作成
git checkout -b hotfix/critical-bug

# 2. 修正してコミット
git add -A
git commit -m "fix: 緊急修正"

# 3. developにプッシュ
git push origin hotfix/critical-bug

# 4. PRを作成してマージ
# GitHub上でPR作成 → マージ

# 5. GitHub Actionsが自動デプロイ
```

---

## デプロイ状況の確認

### GitHub Actions
https://github.com/ta1pre/casto/actions

### Cloudflare Dashboard
https://dash.cloudflare.com/

### デプロイ履歴確認
```bash
wrangler deployments list --name casto-workers-dev
```

---

## トラブルシューティング

### GitHub Actionsが失敗した場合

1. **エラーログを確認**
   - https://github.com/ta1pre/casto/actions
   - 失敗したワークフローをクリック
   - エラーメッセージを確認

2. **修正してプッシュ**
   ```bash
   git add -A
   git commit -m "fix: CI/CDエラー修正"
   git push origin develop
   ```

3. **再度GitHub Actionsが実行される**

---

## まとめ

- ✅ **常にGitHub経由でデプロイ**
- ❌ **手動デプロイは絶対に禁止**
- ✅ **デプロイ完了を待つ**（5〜10分）
- ✅ **GitHub Actionsのログを確認**

**[SF][CA][DRY] - シンプル、クリーンアーキテクチャ、重複排除**
