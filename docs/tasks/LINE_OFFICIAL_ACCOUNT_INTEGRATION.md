# LINE公式アカウント統合ガイド

**作成日**: 2025-10-19  
**ステータス**: Phase 1 計画中  
**設計原則**: [SF][PA][REH][DRY] - シンプル、パフォーマンス、堅牢、拡張性

---

## 📋 概要

LINE公式アカウントとの統合により、以下の機能を段階的に実装します：

1. **Phase 1**: 友だち追加状態の表示（今回実装）
2. **Phase 2**: Webhook連携 + DB保存（将来実装）
3. **Phase 3**: Messaging API活用（将来実装）

---

## ⚠️ 【確認事項】実装前に回答必須

### 1. LINE公式アカウントの状況

- [ ] **LINE公式アカウントは既に作成済みですか？**
  - YES → 友だち追加URL（`https://lin.ee/XXXXX`）を教えてください
  - NO → Phase 1では仮URL（`https://lin.ee/PLACEHOLDER`）で実装し、後で差し替え

### 2. Webhook URL設定のタイミング

- [ ] **Webhook URLの設定はいつ実施しますか？**
  - 今すぐ → Phase 1と並行してPhase 2も実装
  - Phase 2で実施 → 今回はPhase 1のみ実装（**推奨**）
  - **設定予定URL**: `https://casto-workers-dev.casto-api.workers.dev/api/v1/webhook/line`（開発環境）

### 3. 優先度の確認

- [ ] **今回実装するのはPhase 1のみでよいですか？**
  - YES → 友だち追加状態の表示のみ（**推奨**）
  - NO → Phase 2も含めて実装（Webhook + DB保存）

---

## 📁 ディレクトリ構成（段階的拡張）

### Phase 1: 今回実装

```
apps/web/src/
├── shared/
│   └── hooks/
│       ├── useAuth.ts                          # 既存
│       ├── useLiffAuth.ts                      # 既存
│       └── useOfficialLineStatus.ts            # ⭐新規
└── app/
    └── liff/
        └── page.tsx                            # 修正

.env.example                                     # 修正

docs/tasks/
└── LINE_OFFICIAL_ACCOUNT_INTEGRATION.md        # ⭐新規（このファイル）
```

### Phase 2: 将来実装（Webhook + DB保存）

```
supabase/migrations/
└── YYYYMMDDHHMMSS_add_line_friendship_to_users.sql  # 友だち追加状態カラム追加

apps/workers/src/
├── features/
│   └── webhook/
│       ├── line.service.ts                     # Webhook処理ロジック
│       └── line.routes.ts                      # POST /api/v1/webhook/line
└── lib/
    └── line-messaging.ts                       # Messaging API共通ロジック

packages/shared/src/types/
└── lineFriendship.ts                           # 友だち追加状態型定義
```

### Phase 3: 将来実装（Messaging API活用）

```
apps/workers/src/
├── features/
│   └── messaging/
│       ├── broadcast.service.ts                # 一斉配信ロジック
│       └── broadcast.routes.ts                 # POST /api/v1/internal/messaging/broadcast
└── lib/
    └── line-messaging.ts                       # Messaging API拡張

apps/web/src/app/
└── admin/
    └── messaging/
        └── page.tsx                            # 一斉配信管理画面（将来）
```

---

## 🔧 Phase 1 詳細実装仕様

### 1. `apps/web/src/shared/hooks/useOfficialLineStatus.ts`

**目的**: `liff.getFriendship()` で友だち追加状態を取得するフック

#### 型定義

```typescript
interface UseOfficialLineStatusReturn {
  isFriend: boolean | null        // true: 友だち追加済み, false: 未追加, null: 不明
  loading: boolean                 // 取得中
  error: string | null             // エラーメッセージ
  refetch: () => Promise<void>     // 再取得
  lastCheckedAt: number | null     // 最終確認日時（Unix timestamp）
}
```

#### 実装ロジック

1. `useLiffAuth()` で `isLiffReady` を確認
2. LIFF準備完了後、`liff.getFriendship()` を実行
3. エラーハンドリング:
   - LIFF未初期化 → `isFriend = null`, エラーなし
   - API未許可（403） → `isFriend = null`, 警告ログのみ
   - その他のエラー → `error` にメッセージ設定
4. 結果を状態として保持し、返却

#### エラーハンドリング例

```typescript
try {
  const friendship = await window.liff.getFriendship()
  setIsFriend(friendship.friendFlag)
  setLastCheckedAt(Date.now())
} catch (err: any) {
  if (err.code === 403) {
    // API未許可（認証審査前など）
    console.warn('[useOfficialLineStatus] Friendship API not permitted')
    setIsFriend(null)
  } else {
    // その他のエラー
    console.error('[useOfficialLineStatus] Error fetching friendship:', err)
    setError(err.message || 'Unknown error')
  }
}
```

---

### 2. `apps/web/src/app/liff/page.tsx`

**修正内容**: ウェルカムセクション直後に友だち追加状態カードを追加

#### 配置位置

ウェルカムセクション（`<div>ようこそ...</div>`）直後、プロフィール完成度カードの前

#### UI構成

```tsx
{/* 公式LINE友だち追加状態 */}
<section className="bg-card border border-border rounded-lg p-4">
  {loading ? (
    <div className="animate-pulse">
      <div className="h-4 w-32 bg-muted rounded mb-2"></div>
      <div className="h-3 w-48 bg-muted rounded"></div>
    </div>
  ) : isFriend === true ? (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-foreground mb-1">公式LINE参加済み</h3>
        <p className="text-sm text-muted-foreground">オーディション通知を受け取れる状態です</p>
      </div>
    </div>
  ) : isFriend === false ? (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
        <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-foreground mb-1">公式LINEに参加しよう</h3>
        <p className="text-sm text-muted-foreground mb-3">
          オーディションの通知や最新情報を受け取るために、公式LINEへの参加をお勧めします
        </p>
        <a
          href={process.env.NEXT_PUBLIC_LINE_OFFICIAL_ACCOUNT_URL || 'https://lin.ee/PLACEHOLDER'}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#06C755] text-white px-4 py-2 rounded-md hover:bg-[#05B34A] transition-colors text-sm font-medium"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
          </svg>
          公式LINEに参加する
        </a>
      </div>
    </div>
  ) : (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-foreground mb-1">公式LINE状態を確認中</h3>
        <p className="text-sm text-muted-foreground">しばらくお待ちください</p>
      </div>
    </div>
  )}
</section>
```

#### 条件分岐

- `loading === true` → スケルトンローディング
- `isFriend === true` → 友だち追加済みメッセージ（緑色アイコン）
- `isFriend === false` → 友だち追加促進メッセージ（黄色アイコン）+ 参加ボタン
- `isFriend === null` → 確認中メッセージ（灰色アイコン）

---

### 3. `.env.example`

#### 追加内容

```bash
# LINE Official Account (公式アカウント)
NEXT_PUBLIC_LINE_OFFICIAL_ACCOUNT_URL="https://lin.ee/PLACEHOLDER"  # 友だち追加URL（実際のURLに差し替え）
```

**設定場所**: LINE Development セクション内に追加

**本番設定**: 実際の友だち追加URLに差し替え（例: `https://lin.ee/ABC1234`）

---

## 🎨 UI/UXデザイン

### カードデザイン

- **背景**: `bg-card`（既存カードと同じ）
- **ボーダー**: `border border-border`
- **角丸**: `rounded-lg`
- **パディング**: `p-4`
- **アイコンサイズ**: `w-10 h-10`（円形）

### 色設定

- **友だち追加済み**: 緑色（`bg-green-100`, `text-green-600`）
- **未追加**: 黄色（`bg-amber-100`, `text-amber-600`）
- **確認中**: 灰色（`bg-gray-100`, `text-gray-400`）

### ボタンスタイル

- **背景色**: LINE公式カラー（`#06C755`）
- **ホバー**: 濃い緑（`#05B34A`）
- **アイコン**: LINEロゴ（SVG）
- **テキスト**: 白色（`text-white`）

---

## 🔐 環境変数

### 開発環境（`.env.local`）

```bash
NEXT_PUBLIC_LINE_OFFICIAL_ACCOUNT_URL="https://lin.ee/PLACEHOLDER"
```

### 本番環境（Vercel Environment Variables）

```bash
NEXT_PUBLIC_LINE_OFFICIAL_ACCOUNT_URL="https://lin.ee/ABC1234"  # 実際のURL
```

---

## 🚀 Phase 1 実装手順

1. **確認事項の回答を取得**（上記「確認が必要な事項」参照）
2. **useOfficialLineStatus.ts フック作成**
3. **page.tsx にカードUI追加**
4. **.env.example に環境変数追加**
5. **動作確認**:
   - 友だち追加前: 黄色アイコン + 参加ボタン表示
   - 友だち追加後: 緑色アイコン + 参加済みメッセージ表示
   - エラー時: 確認中メッセージ表示

---

## 📊 Phase 2 実装計画（将来）

### データベーススキーマ

```sql
-- users テーブルに追加
ALTER TABLE public.users 
ADD COLUMN line_friendship_status BOOLEAN DEFAULT NULL,
ADD COLUMN line_friendship_updated_at TIMESTAMPTZ DEFAULT NULL;

-- インデックス追加
CREATE INDEX idx_users_line_friendship ON public.users(line_friendship_status);

-- コメント
COMMENT ON COLUMN public.users.line_friendship_status IS '公式LINE友だち追加状態（true: 追加済み, false: 未追加/ブロック, null: 不明）';
COMMENT ON COLUMN public.users.line_friendship_updated_at IS '友だち追加状態の最終更新日時';
```

### Webhook処理フロー

```
LINE Platform
    ↓
POST /api/v1/webhook/line
    ↓
Webhook署名検証
    ↓
イベントタイプ判定
    ├─ follow（友だち追加）
    │   → line_friendship_status = true
    ├─ unfollow（ブロック）
    │   → line_friendship_status = false
    └─ その他イベント
        → ログ記録のみ
    ↓
DB更新（users.line_friendship_status）
    ↓
レスポンス（200 OK）
```

### Webhook URL設定手順

1. **LINE Developers コンソールにログイン**
   - https://developers.line.biz/console/

2. **Messaging API設定 → Webhook URL設定**
   - 開発環境: `https://casto-workers-dev.casto-api.workers.dev/api/v1/webhook/line`
   - 本番環境: `https://casto-workers.casto-api.workers.dev/api/v1/webhook/line`

3. **Webhook再送信機能を有効化**

4. **Webhook署名検証を実装**
   - LINE Channel Secretを使用してHMAC-SHA256で検証

---

## 📊 Phase 3 実装計画（将来）

### Messaging API活用案

#### 1. 新着オーディション一斉告知

**トリガー**: オーディション公開（`status = 'published'`）

**配信対象**: 
- `line_friendship_status = true` のユーザー
- オプション: ジャンル・エリアでセグメント化

**メッセージ例**:
```
【新着オーディション】
タイトル: アイドルグループメンバー募集
締切: 2025/11/30
詳細: https://casto.sb2024.xyz/liff/auditions/[id]
```

#### 2. 週次まとめ配信

**トリガー**: 毎週日曜日 20:00（定期バッチ）

**配信対象**: `line_friendship_status = true` のユーザー

**メッセージ例**:
```
【週刊casto】今週の新着オーディション
- アイドルグループメンバー募集
- モデル募集
- 声優オーディション
詳細: https://casto.sb2024.xyz/liff/auditions
```

#### 3. 個別メッセージ

**ユースケース**:
- 応募確認（サービスメッセージで対応）
- 選考結果通知（サービスメッセージで対応）
- カスタマーサポート（将来実装）

### コスト管理

| 配信タイプ | 月間通数 | 無料枠 | 超過時 |
|----------|---------|--------|--------|
| サービスメッセージ | 無制限 | 無料 | - |
| 新着オーディション | 約100通 | 無料 | - |
| 週次まとめ | 約200通 | 無料 | - |
| その他 | 約200通 | 無料 | - |
| **合計** | **約500通** | **無料枠内** | Light/Standard |

**無料枠**: 500通/月（Communication）  
**有料プラン**: 
- Light: 5,000通/月（約5,000円）
- Standard: 30,000通/月（約15,000円）

---

## 📝 実装チェックリスト

### Phase 1（今回）

- [ ] LINE公式アカウントの状況確認
- [ ] `useOfficialLineStatus.ts` 実装
- [ ] `page.tsx` カードUI追加
- [ ] `.env.example` 環境変数追加
- [ ] このドキュメント作成
- [ ] 動作確認（友だち追加前/後）
- [ ] エラーハンドリング確認

### Phase 2（将来）

- [ ] マイグレーション作成
- [ ] `line.service.ts` 実装
- [ ] `line.routes.ts` 実装
- [ ] Webhook署名検証実装
- [ ] LINE Developers Webhook URL設定
- [ ] 動作確認（友だち追加/ブロック/解除）

### Phase 3（将来）

- [ ] `broadcast.service.ts` 実装
- [ ] `broadcast.routes.ts` 実装
- [ ] 新着オーディション告知機能
- [ ] 週次まとめ配信機能
- [ ] 管理画面UI実装
- [ ] コスト監視ダッシュボード

---

## 🔗 関連ドキュメント

- [通知機能ドラフト](./NOTIFICATION_FUNCTION_DRAFT.md)
- [LINEサービスメッセージ実装ガイド](./LINE_SERVICE_MESSAGE_IMPLEMENTATION_GUIDE.md)
- [TODO.md - Phase 3B.6](./TODO.md)

---

**最終更新**: 2025-10-19  
**次のアクション**: 確認事項への回答後、Phase 1 実装開始
