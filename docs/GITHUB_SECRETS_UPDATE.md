# GitHub Secrets 更新手順

## 問題

GitHub Actionsのデプロイ時に、古い`LINE_CHANNEL_SECRET`が再設定されてしまう。

---

## 解決方法

### 1. GitHub Secrets を更新

1. **GitHubリポジトリにアクセス**
   - https://github.com/ta1pre/casto

2. **Settings → Secrets and variables → Actions**

3. **`LINE_CHANNEL_SECRET` を編集**
   - 「Update」ボタンをクリック
   - 正しい値を入力: `6d42cdbeecf244faedd1aaf929f49dc7`
   - 「Update secret」をクリック

---

### 2. 再デプロイ

GitHub Secretsを更新したら、空コミットでデプロイをトリガー：

```bash
git commit --allow-empty -m "chore: trigger redeploy with updated secrets"
git push origin develop
```

---

## GitHub Secrets 一覧

以下のSecretsが設定されている必要があります：

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `JWT_SECRET`
- `LINE_CHANNEL_ID`
- `LINE_CHANNEL_SECRET` ← **これを更新**
- `LINE_LIFF_ID`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ALLOWED_ORIGINS`

---

## 確認方法

1. GitHub Actions が完了するまで待つ（5〜10分）
2. LINE Developers で「検証」ボタンをクリック
3. 成功することを確認

---

**重要**: GitHub Secretsを更新しないと、GitHub Actionsのデプロイ時に毎回古い値が設定されます。
