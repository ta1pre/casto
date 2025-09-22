#!/bin/bash

echo "🚀 CI/CD Pipeline テスト開始"

# テスト用ブランチ作成
git checkout -b test-cicd-$(date +%s)

# テストファイル作成
echo "# CI/CD Pipeline Test

このファイルはCI/CDパイプラインのテスト用です。

- 作成日時: $(date)
- テスト内容: 自動デプロイ機能確認

## 期待される動作

1. GitHub Actionsが自動実行
2. Lint & Type Check
3. Vercel Preview Deploy
4. Cloudflare Workers Preview Deploy

## 確認URL

- PR作成後、GitHub ActionsのログでデプロイURLを確認
- プレビュー環境でAPI接続テストを実行
" > CICD_TEST.md

git add CICD_TEST.md
git commit -m "test: CI/CD pipeline automated deployment test

- Add test file for CI/CD verification
- Test GitHub Actions workflow
- Verify Vercel + Cloudflare Workers deployment"

echo "📤 ブランチをプッシュ中..."
git push origin HEAD

echo "✅ CI/CDテスト準備完了！"
echo ""
echo "次のステップ:"
echo "1. GitHub Secrets設定完了後"
echo "2. このスクリプトを実行: ./test-cicd.sh"
echo "3. PR作成: gh pr create --title 'Test CI/CD Pipeline' --body 'Testing automated deployment'"
