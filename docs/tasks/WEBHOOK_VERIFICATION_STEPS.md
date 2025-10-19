# Webhook動作確認手順

**作成日**: 2025-10-20  
**目的**: LINE Webhook が正しく動作し、友だち状態が更新されることを確認する

---

## ⚠️ 現状

- ✅ Webhook実装完了（`/api/v1/webhook/line`）
- ✅ LINE Developers側でWebhook URL設定済み
- ❌ **動作確認未完了** ← 今ここ
- 結果: `line_friendship_status`が`null`（不明）のまま

---

## 🔧 確認手順

### Step 1: LINE Developers コンソールでWebhook設定確認

1. **LINE Developers コンソールにアクセス**
   - https://developers.line.biz/console/

2. **該当のチャネルを選択**
   - Messaging API設定タブを開く

3. **Webhook URLを確認**
   - 設定値: `https://casto-workers-dev.casto-api.workers.dev/api/v1/webhook/line`
   - ステータス: 「有効」になっているか確認

4. **「検証」ボタンをクリック**
   - 成功 → "Success" と表示される
   - 失敗 → エラーメッセージを確認（署名検証エラー、タイムアウトなど）

5. **Webhook再送信機能を有効化**
   - 「Webhook再送信」設定がONになっているか確認

---

### Step 2: Workers ログで動作確認

1. **Cloudflare Dashboard にアクセス**
   - https://dash.cloudflare.com/

2. **Workers & Pages → casto-workers-dev → Logs**

3. **リアルタイムログを開く**

4. **テスト友だち追加を実行**（Step 3）

5. **以下のログが出力されることを確認**
   ```
   [Webhook] User followed: U1234567890abcdef
   [Webhook] Updated friendship status to true for user: <user_id>
   [Webhook] Successfully processed 1 events
   ```

---

### Step 3: 実際に友だち追加してテスト

#### 3-1. テストアカウントで友だち追加

1. **LINEアプリを開く**

2. **公式アカウントの友だち追加URL にアクセス**
   - `.env.local` の `NEXT_PUBLIC_LINE_OFFICIAL_ACCOUNT_URL` を確認
   - または LINE Developers コンソール → Basic Settings → LINE Official Account → QRコード

3. **「追加」ボタンをタップ**

4. **5〜10秒待つ**（Webhook処理時間）

#### 3-2. データベースで確認

Supabase Dashboard でクエリ実行：

```sql
SELECT 
  id,
  email,
  line_user_id,
  line_friendship_status,
  line_friendship_updated_at
FROM users
WHERE line_user_id IS NOT NULL
ORDER BY line_friendship_updated_at DESC NULLS LAST
LIMIT 10;
```

**期待結果**:
- `line_friendship_status` が `true` に更新されている
- `line_friendship_updated_at` にタイムスタンプが入っている

#### 3-3. 管理画面で確認

1. `http://localhost:3000/admin/messaging` にアクセス

2. **友だち追加状態セクション**を確認
   - 友だち追加: 1人以上
   - 状態不明: 減っている

3. **ユーザー一覧セクション**で該当ユーザーを確認
   - ステータスバッジが「友だち追加」（緑）になっている

---

### Step 4: ブロック/解除のテスト

#### 4-1. ブロックテスト

1. LINEアプリで公式アカウントをブロック

2. Workersログ確認:
   ```
   [Webhook] User unfollowed: U1234567890abcdef
   [Webhook] Updated friendship status to false for user: <user_id>
   ```

3. DB確認:
   ```sql
   -- line_friendship_status が false に更新されているか確認
   SELECT line_friendship_status, line_friendship_updated_at
   FROM users
   WHERE line_user_id = 'U1234567890abcdef';
   ```

#### 4-2. ブロック解除テスト

1. LINEアプリで公式アカウントのブロックを解除

2. 再度友だち追加

3. `line_friendship_status` が `true` に戻ることを確認

---

## 🐛 トラブルシューティング

### 問題1: Webhook検証が失敗する

**原因候補**:
- 環境変数 `LINE_CHANNEL_SECRET` が未設定または間違っている
- Webhook URL が間違っている
- Workers がデプロイされていない

**対処**:
```bash
# 1. 環境変数確認
wrangler secret list

# 2. LINE_CHANNEL_SECRET が設定されているか確認
# なければ設定:
wrangler secret put LINE_CHANNEL_SECRET
# → LINE Developers の Channel Secret をペースト

# 3. Workers デプロイ
cd apps/workers
pnpm run deploy
```

---

### 問題2: 友だち追加してもDBが更新されない

**原因候補**:
- Webhook が届いていない（LINE側の設定問題）
- `line_user_id` が DB に存在しない（LIFF初回ログイン前の友だち追加）
- Supabase Service Role Key が未設定

**対処**:
1. **Workers ログを確認**
   - エラーログがないか確認
   
2. **line_user_id を確認**
   ```sql
   SELECT id, email, line_user_id
   FROM users
   WHERE email = '<テストユーザーのメール>';
   ```
   - `line_user_id` が `null` なら、先に LIFF でログインが必要

3. **Supabase Service Role Key を確認**
   ```bash
   wrangler secret list
   # SUPABASE_SERVICE_ROLE_KEY があるか確認
   ```

---

### 問題3: 署名検証エラー

**エラーログ例**:
```
[Webhook] Invalid signature
```

**原因**:
- `LINE_CHANNEL_SECRET` が間違っている

**対処**:
1. LINE Developers → Basic Settings → Channel Secret をコピー

2. 再設定:
   ```bash
   wrangler secret put LINE_CHANNEL_SECRET
   ```

3. Workers 再デプロイ:
   ```bash
   pnpm run deploy
   ```

---

## ✅ 動作確認完了チェックリスト

- [ ] LINE Developers でWebhook検証が成功
- [ ] 友だち追加 → `line_friendship_status = true` に更新
- [ ] ブロック → `line_friendship_status = false` に更新
- [ ] ブロック解除 → `line_friendship_status = true` に戻る
- [ ] 管理画面で友だち数が正しく表示
- [ ] ユーザー一覧でステータスバッジが正しく表示
- [ ] Workers ログにエラーがない

---

## 📊 完了後の状態

### 管理画面（`/admin/messaging`）

```
友だち追加状態
├─ 全ユーザー: 10人
├─ 友だち追加: 7人（70%）  ← 緑
├─ ブロック: 1人（10%）    ← 赤
└─ 状態不明: 2人（20%）    ← 黄色（LIFF未ログインのユーザー）
```

### データベース

```sql
-- 正常に動作している状態
line_user_id          | line_friendship_status | line_friendship_updated_at
----------------------|------------------------|---------------------------
U1234567890abcdef     | true                   | 2025-10-20 02:15:30+00
Uabcdef1234567890     | false                  | 2025-10-20 02:10:15+00
U9876543210fedcba     | true                   | 2025-10-20 01:55:42+00
NULL                  | NULL                   | NULL                       ← LIFF未ログイン
```

---

## 🚀 次のステップ

動作確認が完了したら：

1. **TODO.md を更新**
   ```markdown
   - [x] 友だち追加 → `line_friendship_status = true` に更新されるか確認
   - [x] ブロック → `line_friendship_status = false` に更新されるか確認
   - [x] `/admin/messaging` 画面表示確認
   ```

2. **週次まとめ配信のテスト**（Phase 3）
   - 友だち追加済みユーザーがいる状態で配信テスト

3. **本番環境への展開準備**
   - Webhook URL を本番に設定
   - 環境変数の本番設定

---

**最終更新**: 2025-10-20  
**ステータス**: 動作確認待ち
