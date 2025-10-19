# 通知機能テストガイド

## 実装完了状況

### ✅ Phase 1: サービスメッセージ基盤
- [x] 型定義の拡張（notification.ts, lineServiceMessage.ts, application.ts）
- [x] 環境変数の定義（bindings.ts）
- [x] マイグレーション適用（notifications テーブル作成 + 拡張）
- [x] テンプレート定義（notification-templates.ts）
- [x] LINEサービスメッセージ送信実装（line-service-message.ts）
- [x] 通知サービス実装（notification.service.ts）
- [x] 応募完了通知の統合（talent/applications/routes.ts）
- [x] Workers 再デプロイ

## テスト準備

### 1. 環境変数の設定

#### 開発環境（.dev.vars）
```bash
cd /Users/taichiumeki/dev/services/casto/apps/workers
cp .dev.vars.example .dev.vars
```

`.dev.vars` に以下を設定：
```bash
# 既存の設定...

# LINEミニアプリ（通知機能用）
LINE_MINI_APP_CHANNEL_ID="<LINE Developersから取得>"
LINE_MINI_APP_CHANNEL_SECRET="<LINE Developersから取得>"
LIFF_ID="<LIFF IDを取得>"

# メール送信（AWS SES）- Phase 2用
AWS_SES_REGION="ap-northeast-1"
AWS_ACCESS_KEY_ID="<AWS IAMから取得>"
AWS_SECRET_ACCESS_KEY="<AWS IAMから取得>"
FROM_EMAIL="noreply@casto.sb2024.xyz"
```

#### 本番環境（Cloudflare Dashboard）
Cloudflare Workers ダッシュボードから以下のシークレットを設定：
```bash
wrangler secret put LINE_MINI_APP_CHANNEL_ID --env development
wrangler secret put LINE_MINI_APP_CHANNEL_SECRET --env development
wrangler secret put LIFF_ID --env development
```

### 2. LINE Developers コンソール設定

#### Step 2-1: 開発用内部チャネルの確認
1. [LINE Developers Console](https://developers.line.biz/console/) にログイン
2. プロバイダー選択
3. ミニアプリチャネルを選択
4. 「Messaging API」タブで「Channel ID」と「Channel secret」を確認

#### Step 2-2: サービスメッセージテンプレート登録
1. 「Messaging API」タブ → 「Service messages」セクション
2. 以下のテンプレートを登録：

**テンプレート1: application_received_ja**
- テンプレート名: `application_received_ja`
- カテゴリ: Order confirmation / Booking confirmation
- 言語: 日本語
- タイトル: `応募を受け付けました`
- メッセージ: `{{audition_title}} への応募が完了しました。選考結果は通知でお知らせします。`
- 変数:
  - `audition_title` (string)
  - `application_id` (string)
  - `button_uri_1` (uri) - 「詳細を見る」ボタン

**テンプレート2: application_passed_ja**
- テンプレート名: `application_passed_ja`
- カテゴリ: Booking confirmation
- 言語: 日本語
- タイトル: `選考通過のお知らせ`
- メッセージ: `おめでとうございます！{{audition_title}} の{{step_name}}を通過しました。`
- 変数:
  - `audition_title` (string)
  - `step_name` (string)
  - `button_uri_1` (uri)

**テンプレート3: application_failed_ja**
- テンプレート名: `application_failed_ja`
- カテゴリ: Booking confirmation
- 言語: 日本語
- タイトル: `選考結果のお知らせ`
- メッセージ: `{{audition_title}} の選考結果をお知らせします。残念ながら今回は見送りとなりました。`
- 変数:
  - `audition_title` (string)
  - `button_uri_1` (uri)

#### Step 2-3: テンプレート審査申請
- 各テンプレートの登録後、審査を申請
- 審査には数日かかる場合がある
- **開発環境では未審査でもテスト可能**（開発用内部チャネル）

### 3. LIFF ID の取得
1. LINE Developers Console → LIFFタブ
2. LIFF ID をコピー（例: `1234567890-abcdefgh`）

## テスト手順

### テスト1: 応募完了通知（最小構成）

#### フロント側の修正が必要
`apps/web/src/app/liff/auditions/[id]/apply/page.tsx` で、応募送信時に `liff.getAccessToken()` を取得してリクエストボディに含める必要があります。

```typescript
// 応募送信時
const liffAccessToken = liff.getAccessToken()

const response = await fetch('/api/v1/talent/audition-applications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    auditionId: params.id,
    additionalMessage: formData.get('message'),
    liffAccessToken, // ⭐️ 追加
  }),
})
```

#### テスト実行
1. LIFF アプリを起動
2. オーディション詳細画面で「応募する」をクリック
3. 応募フォームを送信
4. **期待される動作**:
   - 応募が正常に完了
   - `notifications` テーブルにレコードが作成される
   - LINEトークルームに通知が届く（開発用内部チャネル）

#### 確認方法
```sql
-- Supabase Studio で確認
SELECT * FROM public.notifications 
WHERE type = 'application_received' 
ORDER BY created_at DESC 
LIMIT 5;
```

### テスト2: データベース確認

```sql
-- notificationsテーブルの確認
SELECT 
  id,
  user_id,
  type,
  title,
  channel,
  context,
  service_notification_token,
  created_at
FROM public.notifications
ORDER BY created_at DESC;
```

### テスト3: エラーハンドリング

#### ケース1: LIFFアクセストークンなし
- 応募送信時に `liffAccessToken` を送らない
- **期待**: 通知レコードは作成されるが、`channel` は `in_app` になる

#### ケース2: 無効なテンプレート名
- テンプレート名を変更して送信
- **期待**: 通知送信エラーがログに出力されるが、応募自体は成功

## トラブルシューティング

### エラー: "Failed to issue service notification token"
**原因**: LINE_MINI_APP_CHANNEL_ID または LINE_MINI_APP_CHANNEL_SECRET が正しくない
**解決**: 環境変数を確認し、Workers を再デプロイ

### エラー: "Failed to send service message"
**原因**: テンプレート名が LINE Developers に登録されていない
**解決**: テンプレートを登録し、審査を通過させる（開発環境では未審査でも可）

### 通知が届かない
**確認事項**:
1. `notifications` テーブルにレコードが作成されているか
2. `channel` カラムが `line` になっているか
3. `service_notification_token` が保存されているか
4. LINEトークルームを確認（公式アカウントからのメッセージ）
5. Workers のログを確認（Cloudflare Dashboard）

## 次のステップ

### Phase 2: メール通知実装
- [ ] AWS SES アカウント作成・設定
- [ ] EmailService 実装
- [ ] 新規応募メール通知の統合

### Phase 3: LIFF通知一覧UI
- [ ] 通知一覧API実装
- [ ] LIFF画面実装
- [ ] 既読管理

### 本番環境移行前チェック
- [ ] LINEミニアプリを認証済みに変更
- [ ] サービスメッセージテンプレートの審査通過
- [ ] 環境変数の本番設定
- [ ] RLS ポリシーの最終確認

## 関連ドキュメント
- `docs/tasks/NOTIFICATION_FUNCTION_DRAFT.md` - 詳細設計
- `docs/tasks/TODO.md` - Phase 3B.5 実装タスク
