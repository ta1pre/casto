# オーディションメインビジュアル機能 実装計画

**作成日**: 2025-10-16  
**ステータス**: 設計中

---

## 📋 概要

オーディション作成・編集時にメインビジュアル（画像・動画）を登録し、スクエア表示する機能を実装します。

### 要件
- ✅ 画像と動画の両方に対応
- ✅ スクエア（1:1）表示
- ✅ ユーザーフレンドリーなUI
- ✅ 既存のロゴアップロードパターンを踏襲
- ✅ シンプルでエレガントな設計

---

## 🏗️ アーキテクチャ設計

### 既存実装の踏襲ポイント [DRY]

| 要素 | 既存パターン | 新規実装 |
|------|-------------|----------|
| **ストレージ** | `TALENT_PHOTOS` R2バケット | 同じバケットを使用 |
| **パス構造** | `organizers/{id}/logo{ext}` | `auditions/{id}/main-visual{ext}` |
| **配信方式** | Workers経由 (`/api/v1/.../view/{id}`) | 同様のパターン |
| **バリデーション** | `@casto/shared/validators/photo` | 拡張して動画対応 |
| **UI** | `LogoUploader` (円形) | `MediaUploader` (スクエア) |

---

## 📊 データベース設計

### auditionsテーブルへの追加カラム

```sql
-- メインビジュアル関連カラム
ALTER TABLE public.auditions
ADD COLUMN main_visual_url TEXT,
ADD COLUMN main_visual_type TEXT CHECK (main_visual_type IN ('image', 'video'));

-- インデックスは不要（検索条件にならない）

COMMENT ON COLUMN public.auditions.main_visual_url IS 'メインビジュアルのURL（画像/動画）';
COMMENT ON COLUMN public.auditions.main_visual_type IS 'メディアタイプ（image/video）';
```

### 既存カラムとの関係

- **`cover_image_url`**: 既存のカラム、互換性のため残す
- **`main_visual_url`**: 新しいカラム、今後はこちらを優先的に使用
- 移行期間中は両方をサポート

---

## 💾 ストレージ設計

### R2バケット構成

```
TALENT_PHOTOS/
├── organizers/          # 主催者ロゴ（既存）
│   └── {organizerId}/
│       └── logo{ext}
├── auditions/           # オーディションメインビジュアル（新規）
│   └── {auditionId}/
│       └── main-visual{ext}
└── talents/             # タレント写真（既存）
    └── {talentId}/
        └── {index}{ext}
```

### ファイル仕様

#### 画像
- **対応形式**: JPEG, PNG, WebP
- **最大サイズ**: 5MB
- **推奨解像度**: 1080x1080px (1:1)

#### 動画
- **対応形式**: MP4, WebM
- **最大サイズ**: 50MB
- **推奨解像度**: 1080x1080px (1:1)
- **最大長**: 60秒

### RLS設計

既存のauditionsテーブルのRLSポリシーがそのまま適用されます:
- **アップロード/削除**: 主催者本人 (`organizer_id = auth.uid()`) または管理者
- **閲覧**: 公開中 (`status = 'published'`) のオーディションは誰でも閲覧可

---

## 🔌 API設計

### エンドポイント一覧

| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/api/v1/organizer/auditions/:id/main-visual/upload` | メインビジュアルアップロード |
| DELETE | `/api/v1/organizer/auditions/:id/main-visual` | メインビジュアル削除 |
| GET | `/api/v1/organizer/auditions/:id/main-visual/view` | メインビジュアル配信 |

### 1. アップロードAPI

**POST `/api/v1/organizer/auditions/:id/main-visual/upload`**

```typescript
// リクエスト (FormData)
{
  file: File | Blob  // 画像または動画ファイル
}

// レスポンス
{
  success: true,
  url: string,           // "/api/v1/organizer/auditions/{id}/main-visual/view?v={timestamp}"
  mediaType: 'image' | 'video',
  message: string
}
```

**処理フロー**:
1. 認証チェック（主催者本人または管理者）
2. オーディション存在確認
3. ファイルバリデーション
4. 既存ファイル削除（上書き前のクリーンアップ）
5. R2にアップロード
6. データベース更新（`main_visual_url`, `main_visual_type`）
7. 公開URLを返す

### 2. 削除API

**DELETE `/api/v1/organizer/auditions/:id/main-visual`**

```typescript
// レスポンス
{
  success: true,
  message: string
}
```

**処理フロー**:
1. 認証チェック
2. オーディション存在確認
3. R2からファイル削除
4. データベース更新（`main_visual_url` = NULL, `main_visual_type` = NULL）

### 3. 配信API

**GET `/api/v1/organizer/auditions/:id/main-visual/view`**

```typescript
// クエリパラメータ
?v={timestamp}  // キャッシュバスティング用（任意）

// レスポンス
Content-Type: image/jpeg | video/mp4 など
Cache-Control: public, max-age=31536000, immutable (vパラメータあり)
               public, max-age=300 (vパラメータなし)
```

**処理フロー**:
1. R2から複数の拡張子を試して取得
2. 見つかったファイルを配信
3. 適切なCache-Controlヘッダーを設定

---

## 🎨 UI/UXコンポーネント設計

### 新規コンポーネント: `MediaUploader`

**配置**: `packages/shared/src/components/MediaUploader.tsx`  
**目的**: 画像・動画両対応の汎用メディアアップローダー（スクエア表示）

#### Props

```typescript
interface MediaUploaderProps {
  mediaUrl?: string | null
  mediaType?: 'image' | 'video' | null
  onUpload: (file: File) => Promise<void>
  onDelete: () => Promise<void>
  disabled?: boolean
  maxImageSizeMB?: number      // デフォルト: 5MB
  maxVideoSizeMB?: number      // デフォルト: 50MB
  allowedImageTypes?: string[] // デフォルト: ['image/jpeg', 'image/png', 'image/webp']
  allowedVideoTypes?: string[] // デフォルト: ['video/mp4', 'video/webm']
}
```

#### 機能
- ✅ ドラッグ&ドロップ対応
- ✅ スクエア（1:1）プレビュー表示
- ✅ 画像/動画の自動判別
- ✅ ファイルサイズ・形式バリデーション
- ✅ アップロード進行状況表示
- ✅ 削除確認ダイアログ
- ✅ レスポンシブ対応

#### UIレイアウト（スクエア）

```
┌──────────────────────────────┐
│                              │
│      メインビジュアル          │  ← ラベル + 削除ボタン
│                              │
└──────────────────────────────┘

┌──────────────────────────────┐
│                              │
│                              │
│      [プレビュー表示]          │  ← スクエア (400x400px)
│      または                   │
│      [アップロードUI]          │
│                              │
│                              │
└──────────────────────────────┘

💡 画像: 最大5MB (JPG/PNG/WebP)
   動画: 最大50MB (MP4/WebM)
```

### フォームへの統合

**配置**: `apps/web/src/app/organizer/auditions/[id]/edit/page.tsx`

```typescript
<MediaUploader
  mediaUrl={formData.mainVisualUrl}
  mediaType={formData.mainVisualType}
  onUpload={handleMainVisualUpload}
  onDelete={handleMainVisualDelete}
  disabled={isLoading}
/>
```

---

## 🔧 共通バリデーション設計

### 新規ファイル: `packages/shared/src/validators/media.ts`

```typescript
// メディア設定
export const MEDIA_CONFIG = {
  IMAGE: {
    MAX_SIZE_MB: 5,
    MAX_SIZE_BYTES: 5 * 1024 * 1024,
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  },
  VIDEO: {
    MAX_SIZE_MB: 50,
    MAX_SIZE_BYTES: 50 * 1024 * 1024,
    ALLOWED_TYPES: ['video/mp4', 'video/webm'],
    MAX_DURATION_SECONDS: 60,
  },
}

// バリデーション関数
export function validateMedia(file: File | Blob): MediaValidationResult
export function detectMediaType(file: File | Blob): 'image' | 'video' | 'unknown'
export function getMediaExtension(file: File | Blob): string
```

---

## 📁 ファイル構成

### 新規作成ファイル

```
packages/shared/src/
├── validators/
│   └── media.ts                    # メディアバリデーション（新規）
├── types/
│   └── media.ts                    # メディア型定義（新規）
└── components/
    └── MediaUploader.tsx           # 汎用メディアアップローダー（新規）

apps/workers/src/
└── features/organizer/auditions/
    ├── mainVisual.routes.ts        # メインビジュアルAPI（新規）
    └── mainVisual.service.ts       # R2操作サービス（新規）

apps/web/src/app/organizer/auditions/
└── _components/
    └── (既存のフォームに統合)

supabase/migrations/
└── {timestamp}_add_main_visual_to_auditions.sql  # マイグレーション（新規）
```

### 変更ファイル

```
apps/workers/src/app.ts             # ルーティング追加
packages/shared/src/types/audition.ts  # Audition型に main_visual_url/type 追加
apps/web/src/app/organizer/auditions/[id]/edit/page.tsx  # UI統合
apps/web/src/app/organizer/auditions/new/page.tsx        # UI統合
```

---

## 🚀 実装ステップ

### Phase 1: データベース・バリデーション [SF]
1. ✅ マイグレーションファイル作成
2. ✅ 共通型定義追加 (`types/media.ts`, `types/audition.ts`)
3. ✅ バリデーション実装 (`validators/media.ts`)

### Phase 2: Workers API [REH]
4. ✅ `mainVisual.service.ts` 実装（R2操作）
5. ✅ `mainVisual.routes.ts` 実装（エンドポイント）
6. ✅ `app.ts` にルーティング追加
7. ✅ 動作確認（Postman/curl）

### Phase 3: 共通UIコンポーネント [CA]
8. ✅ `MediaUploader.tsx` 実装
9. ✅ スタイリング・レスポンシブ対応

### Phase 4: フォーム統合 [DRY]
10. ✅ 作成フォームに統合 (`new/page.tsx`)
11. ✅ 編集フォームに統合 (`[id]/edit/page.tsx`)
12. ✅ 詳細ページに表示追加 (`[id]/page.tsx`)

### Phase 5: テスト・最適化 [PA]
13. ✅ アップロード動作確認（画像・動画）
14. ✅ 削除動作確認
15. ✅ バリデーションエラーハンドリング確認
16. ✅ レスポンシブ表示確認
17. ✅ パフォーマンス最適化

---

## ✅ テスト項目

### 機能テスト
- [ ] 画像アップロード（JPEG, PNG, WebP）
- [ ] 動画アップロード（MP4, WebM）
- [ ] ファイルサイズ制限（画像5MB、動画50MB）
- [ ] 不正ファイル形式のリジェクト
- [ ] 削除機能
- [ ] 上書きアップロード（既存ファイル自動削除）

### UI/UXテスト
- [ ] ドラッグ&ドロップ動作
- [ ] プレビュー表示（画像・動画）
- [ ] スクエア表示の適切さ
- [ ] エラーメッセージ表示
- [ ] ローディング状態
- [ ] レスポンシブ対応

### セキュリティテスト
- [ ] 他人のオーディションへのアップロード拒否
- [ ] 認証なしアクセス拒否
- [ ] RLSポリシー動作確認

---

## 🔄 既存機能との互換性

### 移行戦略

#### フロントエンド
```typescript
// 表示時: main_visual_url を優先、なければ cover_image_url にフォールバック
const visualUrl = audition.mainVisualUrl || audition.coverImageUrl
const visualType = audition.mainVisualType || 'image'
```

#### データベース
- `cover_image_url` カラムは削除せず保持
- 新規作成では `main_visual_url` のみ使用
- 既存データは段階的に移行可能

---

## 📝 実装時の注意点 [SF][CA][REH]

### シンプルさの維持
- ✅ 既存のロゴアップロードパターンを最大限流用
- ✅ 新規コードは最小限に抑える
- ✅ 複雑な画像処理は避ける（リサイズ等は将来的に検討）

### エラーハンドリング
- ✅ ユーザーフレンドリーなエラーメッセージ
- ✅ 適切なHTTPステータスコード
- ✅ コンソールログでデバッグ可能に

### パフォーマンス
- ✅ キャッシュ戦略（Cache-Controlヘッダー）
- ✅ 適切なファイルサイズ制限
- ✅ プログレッシブアップロード（将来的に検討）

---

## 📚 参考実装

- `apps/workers/src/features/organizer/profile/logo.service.ts` - R2操作パターン
- `apps/web/src/app/organizer/profile/_components/LogoUploader.tsx` - UIパターン
- `packages/shared/src/validators/photo.ts` - バリデーションパターン

---

**次のアクション**: Phase 1（データベース・バリデーション）の実装開始
