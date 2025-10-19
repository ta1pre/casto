# LINE Messaging API 環境変数設定手順

## 必要な環境変数

Messaging API（メッセージ送信）には、Messaging APIチャネルの認証情報が必要です。

| 環境変数 | 用途 | チャネル |
|---------|------|----------|
| `LINE_CHANNEL_ID` | LINEログイン | LINEログインチャネル |
| `LINE_CHANNEL_SECRET` | LINEログイン | LINEログインチャネル |
| `LINE_MESSAGING_CHANNEL_ID` | メッセージ送信 | Messaging APIチャネル |
| `LINE_MESSAGING_CHANNEL_SECRET` | Webhook署名検証 | Messaging APIチャネル |

---

## 設定手順

### 1. LINE Developers Console で Channel ID を取得

1. https://developers.line.biz/console/ にアクセス
2. **Messaging API チャネル**を選択
3. **Basic Settings** タブ
4. **Channel ID** をコピー

---

### 2. Cloudflare Workers に環境変数を設定

```bash
cd apps/workers

# Messaging API チャネルの Channel ID を設定
echo "[コピーしたChannel ID]" | wrangler secret put LINE_MESSAGING_CHANNEL_ID --env development
```

**例**:
```bash
echo "2006504791" | wrangler secret put LINE_MESSAGING_CHANNEL_ID --env development
```

---

### 3. GitHub Secrets にも追加

今後のCI/CDデプロイで自動設定されるよう、GitHub Secretsにも追加します。

1. https://github.com/ta1pre/casto/settings/secrets/actions にアクセス
2. 「New repository secret」をクリック
3. 以下を入力：
   - **Name**: `LINE_MESSAGING_CHANNEL_ID`
   - **Secret**: `[コピーしたChannel ID]`
4. 「Add secret」をクリック

---

### 4. 設定確認

```bash
wrangler secret list --env development
```

以下が表示されればOK：
- `LINE_CHANNEL_ID` ✅
- `LINE_CHANNEL_SECRET` ✅
- `LINE_MESSAGING_CHANNEL_ID` ✅ **← 新しく追加**
- `LINE_MESSAGING_CHANNEL_SECRET` ✅

---

## テスト送信

1. https://casto.sb2024.xyz/admin/messaging にアクセス
2. 「📮 週次まとめを配信」ボタンをクリック
3. 成功すれば、LINEにメッセージが届きます！

---

**[CA][SF] - クリーンアーキテクチャ、シンプル**
