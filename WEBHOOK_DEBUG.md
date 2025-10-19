# Webhook 401エラーのデバッグ手順

## 原因の可能性

1. **LINE_CHANNEL_SECRETが間違っている**
2. **署名検証ロジックの問題**
3. **LINE Developers「検証」機能の仕様**

---

## 即座に確認すべきこと

### 1. LINE_CHANNEL_SECRETの確認

1. **LINE Developers Console** にアクセス
   - https://developers.line.biz/console/

2. **該当のチャネル → Basic Settings**

3. **Channel Secret をコピー**

4. **Cloudflare Workers Secretと一致しているか確認**
   ```bash
   # 現在の値を確認（値は表示されないが、存在は確認できる）
   wrangler secret list --env development
   
   # 再設定（LINE DevelopersのChannel Secretをペースト）
   wrangler secret put LINE_CHANNEL_SECRET --env development
   ```

---

### 2. Cloudflare Logsで詳細確認

現在`wrangler tail`が実行中です。

**手順**:
1. LINE Developers Console → Messaging API設定 → Webhook URL の「検証」ボタンをクリック
2. ターミナルに表示されるログを確認
   - `[Webhook] Missing x-line-signature header` → 署名ヘッダーがない
   - `[Webhook] Invalid signature` → 署名検証失敗
   - `[Webhook] LINE_CHANNEL_SECRET not configured` → Secret未設定

---

### 3. 署名検証を一時的に無効化してテスト（デバッグ用）

**注意**: これは一時的なデバッグ用です。本番環境では絶対に使用しないでください。

```typescript
// apps/workers/src/features/webhook/line.routes.ts

router.post('/', async (c) => {
  // 🚨 デバッグ用：署名検証を一時的にスキップ
  console.log('[Webhook] DEBUG MODE: Signature verification skipped')
  console.log('[Webhook] Headers:', JSON.stringify(c.req.header()))
  
  const bodyText = await c.req.text()
  console.log('[Webhook] Body:', bodyText)
  
  return c.json({ success: true, debug: 'signature_check_skipped' })
})
```

このコードに変更して再デプロイ → LINE検証 → 成功するか確認

成功した場合 → 署名検証ロジックに問題がある
失敗した場合 → ルーティングや他の問題

---

### 4. LINE Developers「検証」機能の仕様確認

LINE Developersの「検証」ボタンは以下を送信します：
```json
{
  "destination": "YOUR_BOT_ID",
  "events": []
}
```

空のイベント配列を送信するだけなので、実際のWebhookとは異なります。

**実際の友だち追加イベント**:
```json
{
  "destination": "YOUR_BOT_ID",
  "events": [
    {
      "type": "follow",
      "timestamp": 1234567890,
      "source": {
        "type": "user",
        "userId": "U1234567890abcdef"
      }
    }
  ]
}
```

---

## 推奨アクション（優先度順）

### 🔥 最優先：LINE_CHANNEL_SECRETの再設定

```bash
cd apps/workers
wrangler secret put LINE_CHANNEL_SECRET --env development
# → LINE Developers の Channel Secret を正確にペースト
```

### ✅ 次：Logsで詳細確認

`wrangler tail` の出力を確認して、具体的なエラーメッセージを確認してください。

### 🧪 最終手段：デバッグモードでテスト

署名検証を一時的にスキップして、ルーティングが正しいか確認。

---

## 正常動作時のログ

```
[Webhook] User followed: U1234567890abcdef
[Webhook] Updated friendship status to true for user: <user_id>
[Webhook] Successfully processed 1 events
```

---

**今すぐ実施**:
1. `wrangler tail` の出力を確認（実行中）
2. LINE Developers で「検証」ボタンをクリック
3. ログに表示されるエラーメッセージを教えてください
