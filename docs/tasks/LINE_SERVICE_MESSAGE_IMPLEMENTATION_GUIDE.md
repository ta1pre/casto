# LINEサービスメッセージ実装ガイド

## ✅ 実装完了（2025-10-19）

### 動作確認済み
- ✅ 通知データベース（`notifications`テーブル）
- ✅ サービスメッセージ送信ロジック（`line-service-message.ts`）
- ✅ 短期のチャネルアクセストークン動的生成
- ✅ 通知トリガー（応募時、評価時など）
- ✅ サービスメッセージテンプレート（LINE Developersコンソールで設定済み）
- ✅ **開発環境でのLINE通知送信成功**

### 実装方式
**短期のチャネルアクセストークン（30日間有効）を動的生成**

当初はステートレスチャネルアクセストークンを検討しましたが、`kid` (Key ID)の登録が必要で複雑なため、
よりシンプルな短期のチャネルアクセストークンを採用しました。

## 実装の技術詳細

### アーキテクチャ
```
応募完了（フロントエンド）
    ↓
liff.getAccessToken() でLIFFアクセストークン取得
    ↓
POST /api/v1/talent/audition-applications { liffAccessToken }
    ↓
notification.service.ts でサービスメッセージ送信
    ↓
line-service-message.ts
    1. 短期のチャネルアクセストークン発行（30日間有効）
    2. サービス通知トークン発行
    3. サービスメッセージ送信
    ↓
LINE通知がユーザーに届く
```

### 使用している環境変数
```bash
LINE_CHANNEL_ID="2008009031"          # LINEミニアプリチャネルID
LINE_CHANNEL_SECRET="..."             # LINEミニアプリチャネルシークレット
LINE_LIFF_ID="2008009031-ZdQbY5YW"   # 開発用LIFF ID
```

### 重要な設計判断
1. **短期トークンを採用**
   - ステートレスチャネルアクセストークン: `kid`登録が必要で複雑
   - 短期のチャネルアクセストークン: チャネルIDとシークレットのみで発行可能
   
2. **トークンキャッシュは不要**
   - 短期トークンは30日間有効
   - APIリクエストごとに発行しても問題ない（LINE推奨）
   - シンプルで保守性が高い

3. **エラーハンドリング**
   - 未認証ミニアプリでは警告ログのみ（処理は継続）
   - 通知は`notifications`テーブルに必ず記録
   - 後からリトライ可能な設計

## 認証審査後の実装手順

### ステップ1: 認証審査を通過する

**LINE Developersコンソール → 「審査申請」タブ**から審査を申請してください。

審査に必要な準備：
- ✅ LINEミニアプリの基本機能が完成している
- ✅ 審査用エンドポイントURLにアプリをデプロイ済み
- ✅ サービスメッセージテンプレートが設定済み
- ✅ プライバシーポリシー、利用規約が整備されている

### ステップ2: 内部チャネルの確認

認証審査通過後、LINE Developersコンソールで以下を確認：

#### 3つの内部チャネル
LINEミニアプリチャネルには、以下の3つの内部チャネルが自動作成されます：

1. **開発用** (LIFF ID: `2008009031-ZdQbY5YW`)
   - 開発・テスト用
   - チャネルIDとチャネルシークレットでステートレスチャネルアクセストークンを生成

2. **審査用** (LIFF ID: `2008009032-r62gWoWO`)
   - LINE審査担当者用

3. **本番用** (LIFF ID: `2008009033-yanMd8dp`)
   - 一般公開用

#### 重要な注意事項
**各内部チャネル専用のチャネルアクセストークンを使用する必要があります。**

> 審査用LINEミニアプリや本番用LINEミニアプリからサービスメッセージを送信する際に、開発用LINEミニアプリチャネルのチャネルアクセストークンを指定しないでください。

### ステップ3: ステートレスチャネルアクセストークンの実装

LINEミニアプリでは、**長期トークンが使えません**。  
**ステートレスチャネルアクセストークン**（15分間有効）を動的に生成する必要があります。

#### 実装方法

`apps/workers/src/lib/line-service-message.ts` の `getChannelAccessToken` 関数を以下のように修正：

```typescript
import jwt from '@tsndr/cloudflare-worker-jwt'

/**
 * ステートレスチャネルアクセストークンを生成
 * @param env - 環境変数
 * @returns ステートレスチャネルアクセストークン
 */
async function getChannelAccessToken(env: Bindings): Promise<string> {
  const channelId = env.LINE_CHANNEL_ID
  const channelSecret = env.LINE_CHANNEL_SECRET

  if (!channelId || !channelSecret) {
    throw new Error('LINE_CHANNEL_ID and LINE_CHANNEL_SECRET are required')
  }

  // JWTペイロード
  const payload = {
    iss: channelId,
    sub: channelId,
    aud: 'https://api.line.me/',
    exp: Math.floor(Date.now() / 1000) + 60 * 30, // 30分後
    token_exp: 60 * 15 // トークン有効期限: 15分
  }

  // JWT署名
  const token = await jwt.sign(payload, channelSecret, { algorithm: 'HS256' })

  // ステートレスチャネルアクセストークン発行API
  const response = await fetch('https://api.line.me/oauth2/v3/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: token
    })
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('[Stateless Token Error]', error)
    throw new Error(`Failed to issue stateless channel access token: ${error}`)
  }

  const data = await response.json() as { access_token: string; expires_in: number }
  return data.access_token
}
```

#### 必要な依存関係

`apps/workers/package.json` に追加：

```json
{
  "dependencies": {
    "@tsndr/cloudflare-worker-jwt": "^2.4.0"
  }
}
```

インストール：
```bash
cd apps/workers
npm install @tsndr/cloudflare-worker-jwt
```

### ステップ4: 環境変数の設定

#### `.dev.vars` （開発環境）
```bash
# LINEミニアプリ - 開発用内部チャネル
LINE_CHANNEL_ID="2008009031"
LINE_CHANNEL_SECRET="92f007e2d0c35479434aa4e7b4935f45"
LINE_LIFF_ID="2008009031-ZdQbY5YW"
```

**注意**: `LINE_CHANNEL_ACCESS_TOKEN` は不要になります（ステートレス生成のため）。

#### Cloudflare Workers Secrets （本番環境）
```bash
cd apps/workers

# 本番用内部チャネルのチャネルシークレットを設定
echo "本番用チャネルシークレット" | npx wrangler secret put LINE_CHANNEL_SECRET --env production
```

### ステップ5: 動作確認

#### 1. Workers再デプロイ
```bash
cd apps/workers
npx wrangler deploy --env development
```

#### 2. ログ監視
```bash
npx wrangler tail --env development --format pretty
```

#### 3. テスト実行
LINEアプリから開発用LIFF URLを開いてオーディションに応募：
```
https://miniapp.line.me/2008009031-ZdQbY5YW
```

#### 4. 成功ログの確認
```
POST https://api.line.me/message/v3/notifier/token - Ok
POST https://api.line.me/message/v3/notifier/send - Ok
[Application] Notification sent successfully
```

## トラブルシューティング

### エラー: `Unlicensed API Request`
- **原因**: LINEミニアプリが未認証
- **解決**: 認証審査を通過する

### エラー: `Invalid channel access token`
- **原因**: チャネルIDとシークレットが間違っている、または内部チャネルが異なる
- **解決**: LINE Developersコンソールで正しい値を確認

### エラー: `Failed to issue stateless channel access token`
- **原因**: JWT生成またはAPI呼び出しに問題
- **解決**: ログを確認し、チャネルシークレットが正しいか確認

### 通知が届かない
1. **Supabase `notifications` テーブルを確認**
   ```sql
   SELECT * FROM notifications
   WHERE user_id = '<your_user_id>'
   ORDER BY created_at DESC
   LIMIT 10;
   ```

2. **`sent` カラムが `true` か確認**

3. **`error_message` カラムにエラーがないか確認**

4. **Workers ログを確認**
   ```bash
   npx wrangler tail --env development --format pretty
   ```

## 参考ドキュメント

### LINE公式ドキュメント
- [サービスメッセージを送信する](https://developers.line.biz/ja/docs/line-mini-app/develop/service-messages/)
- [LINEミニアプリ用LINE Developersコンソールガイド](https://developers.line.biz/ja/docs/line-mini-app/discover/console-guide/)
- [チャネルアクセストークン](https://developers.line.biz/ja/docs/basics/channel-access-token/)
- [ステートレスチャネルアクセストークンを発行する](https://developers.line.biz/ja/reference/messaging-api/#issue-stateless-channel-access-token)

### 関連ファイル
- `apps/workers/src/lib/line-service-message.ts` - サービスメッセージ送信ロジック
- `apps/workers/src/lib/notification.service.ts` - 通知サービス（オーケストレーション）
- `apps/workers/src/types/bindings.ts` - 環境変数の型定義
- `packages/shared/src/types/lineServiceMessage.ts` - LINE API型定義

## 暫定対応（現在の実装）

認証審査通過までの間、以下の暫定対応を実施中：

### アプリ内通知のみ
- ✅ `notifications` テーブルに記録
- ✅ LINE通知は試行するがエラーを無視
- ❌ ユーザーへのLINE通知は届かない

### 今後の実装予定
1. **LIFF通知一覧UI**
   - `/liff/notifications` ページ
   - 未読バッジ
   - 既読管理

2. **メール通知**（主催者向け）
   - AWS SES / SendGrid
   - 新規応募通知、評価リマインドなど

## 実装スケジュール

### Phase 1: 認証審査申請 【要対応】
- [ ] 審査用エンドポイントへのデプロイ
- [ ] プライバシーポリシー・利用規約の整備
- [ ] 審査申請の提出
- **所要時間**: 審査は数日〜1週間程度

### Phase 2: サービスメッセージ有効化 【認証後】
- [ ] ステートレスチャネルアクセストークンの実装
- [ ] 開発環境でテスト
- [ ] 本番環境へデプロイ
- **所要時間**: 1〜2日

### Phase 3: LIFF通知一覧UI 【低優先度】
- [ ] 通知一覧ページの実装
- [ ] 未読バッジの実装
- [ ] 既読管理の実装
- **所要時間**: 2〜3日

---

**作成日**: 2025-10-19  
**最終更新**: 2025-10-19  
**ステータス**: 認証審査待ち
