# GitHub Secrets 設定ガイド

## 🔐 設定が必要なSecrets

以下のSecretsをGitHubリポジトリに設定してください：

### Vercel関連
```
VERCEL_ORG_ID = team_idrAIQND9CrEn3C7BerMktAl
VERCEL_PROJECT_ID = prj_Jeuz5fLTh8EyFwDpg5JQFLEdDDBL
```

### 取得が必要なトークン
1. **VERCEL_TOKEN**
   - https://vercel.com/account/tokens にアクセス
   - "Create Token" をクリック
   - 名前: "GitHub Actions CI/CD"
   - スコープ: "Full Account"
   - 生成されたトークンをコピー

2. **CLOUDFLARE_API_TOKEN**
   - https://dash.cloudflare.com/profile/api-tokens にアクセス
   - "Create Token" をクリック
   - テンプレート: "Custom token"
   - 権限:
     - Zone:Zone:Read
     - Zone:DNS:Edit  
     - Account:Cloudflare Workers:Edit
   - 生成されたトークンをコピー

## 📝 GitHub Secrets設定手順

### 方法1: GitHub Web UI
1. https://github.com/ta1pre/casto/settings/secrets/actions にアクセス
2. "New repository secret" をクリック
3. 以下を順番に追加:

```
Name: VERCEL_TOKEN
Value: [上記で取得したVercelトークン]

Name: VERCEL_ORG_ID  
Value: team_idrAIQND9CrEn3C7BerMktAl

Name: VERCEL_PROJECT_ID
Value: prj_Jeuz5fLTh8EyFwDpg5JQFLEdDDBL

Name: CLOUDFLARE_API_TOKEN
Value: [上記で取得したCloudflareトークン]
```

### 方法2: GitHub CLI（ログイン後）
```bash
gh secret set VERCEL_TOKEN
gh secret set VERCEL_ORG_ID --body "team_idrAIQND9CrEn3C7BerMktAl"
gh secret set VERCEL_PROJECT_ID --body "prj_Jeuz5fLTh8EyFwDpg5JQFLEdDDBL"  
gh secret set CLOUDFLARE_API_TOKEN
```

## ✅ 設定完了後のテスト

Secrets設定完了後、以下でCI/CDをテストできます：

```bash
# テスト用ブランチ作成
git checkout -b test-cicd
echo "# CI/CD Test" > CICD_TEST.md
git add CICD_TEST.md
git commit -m "test: CI/CD pipeline test"
git push origin test-cicd

# PR作成
gh pr create --title "Test CI/CD Pipeline" --body "Testing automated deployment"
```

これでGitHub Actionsが自動実行され、Vercel + Cloudflareへの自動デプロイがテストされます。
