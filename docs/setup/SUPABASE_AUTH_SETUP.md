# Supabase Auth 設定ガイド

## メール認証設定

### 1. URL Configuration

**方法1: Supabase CLI（推奨）**

`supabase/config.toml`を編集してリモートにプッシュ:

```bash
# supabase/config.toml の [auth] セクションを編集
# その後、以下のコマンドで設定を反映
supabase config push --project-ref sfscmpjplvxtikmifqhe
```

設定内容は `supabase/config.toml` の `[auth]` セクションを参照。

**方法2: Supabase Dashboard**

**Supabase Dashboard → Authentication → URL Configuration**

#### Site URL
開発環境と本番環境で設定:

- **開発環境**: `https://casto.sb2024.xyz`
- **本番環境**: `https://casto.io`

#### Redirect URLs
以下のURLを追加:

```
https://casto.sb2024.xyz/admin/auth/callback
https://casto.sb2024.xyz/organizer/auth/callback
https://casto.sb2024.xyz/admin/reset-password/confirm
https://casto.sb2024.xyz/organizer/reset-password/confirm
https://casto.io/admin/auth/callback
https://casto.io/organizer/auth/callback
https://casto.io/admin/reset-password/confirm
https://casto.io/organizer/reset-password/confirm
```

### 2. Email Templates（日本語化）

**Supabase Dashboard → Authentication → Email Templates**

#### Confirm signup（アカウント確認）

```html
<h2>メールアドレスの確認</h2>

<p>アカウント登録ありがとうございます。</p>

<p>以下のリンクをクリックして、メールアドレスを確認してください：</p>

<p><a href="{{ .ConfirmationURL }}">メールアドレスを確認する</a></p>

<p>このメールに心当たりがない場合は、削除してください。</p>

<p>※ このメールは自動送信されています。返信はできません。</p>

<hr>

<p style="font-size: 12px; color: #666;">
このメールは Casto からお送りしています。
</p>
```

#### Reset Password（パスワードリセット）

```html
<h2>パスワードのリセット</h2>

<p>パスワードリセットのリクエストを受け付けました。</p>

<p>以下のリンクをクリックして、新しいパスワードを設定してください：</p>

<p><a href="{{ .ConfirmationURL }}">パスワードをリセットする</a></p>

<p>このリンクは24時間有効です。</p>

<p>このメールに心当たりがない場合は、削除してください。パスワードは変更されません。</p>

<hr>

<p style="font-size: 12px; color: #666;">
このメールは Casto からお送りしています。
</p>
```

### 3. Workers環境変数設定

#### 開発環境（`.dev.vars`）

```bash
WEB_URL="https://casto.sb2024.xyz"
```

#### 本番環境（Cloudflare Dashboard）

Cloudflare Workers → Settings → Variables and Secrets:

```
WEB_URL = "https://casto.io"
```

### 4. 確認事項

- [ ] Site URLが正しく設定されている
- [ ] Redirect URLsに全てのコールバックURLが登録されている
- [ ] Email Templatesが日本語化されている
- [ ] Workers環境変数`WEB_URL`が設定されている
- [ ] 開発環境でメール送信テスト完了
- [ ] 本番環境でメール送信テスト完了

## トラブルシューティング

### メールが届かない

1. Supabase Dashboard → Authentication → Logs でエラー確認
2. 迷惑メールフォルダを確認
3. SMTP設定を確認（デフォルトは1時間に4通まで）

### リダイレクトURLエラー

1. Redirect URLsに正しいURLが登録されているか確認
2. `WEB_URL`環境変数が正しく設定されているか確認
3. Workers再デプロイ

---

**最終更新**: 2025-10-14
