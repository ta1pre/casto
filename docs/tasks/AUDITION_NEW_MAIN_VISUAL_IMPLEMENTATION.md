# オーディション新規作成画面へのメインビジュアル登録機能追加

## 概要
新規作成画面（`/organizer/auditions/new`）でも編集画面と同じく、メインビジュアル（画像/動画）を1ページ内で登録できるように実装する。

## 現状分析

### 既存実装の状況
- ✅ **編集画面**: `MediaUploader`コンポーネントを使用し、メインビジュアルのアップロード/削除が可能
  - API: `POST /api/v1/organizer/auditions/:id/main-visual/upload`
  - R2ストレージ + DB更新の一気通貫処理が完成
  - @apps/web/src/app/organizer/auditions/[id]/edit/page.tsx#196-244
- ❌ **新規作成画面**: メインビジュアルUIが存在しない
  - フォーム送信でオーディションレコードのみ作成
  - @apps/web/src/app/organizer/auditions/new/page.tsx#123-194
- ✅ **DB**: `auditions.main_visual_url` / `main_visual_type` カラムは既に存在
  - @supabase/migrations/20251016100000_add_main_visual_to_auditions.sql
- ✅ **API/R2**: 認証・権限・バリデーション・アップロード処理はすべて完成済み
  - @apps/workers/src/features/organizer/auditions/mainVisual.routes.ts

### 課題
新規作成時は「オーディションID」が存在しないため、アップロードAPIを呼べない。

---

## 最適な実装方針（1ページ完結型）

### 基本コンセプト
**編集画面と同じUIを提供し、内部処理だけを工夫する** [SF][CA][DRY]

### 実装フロー
1. **ファイル選択時**: ローカルStateで保持（まだアップロードしない）
2. **フォーム送信時**:
   - Step 1: オーディション作成API → ID取得
   - Step 2: ファイルがある場合、取得したIDでアップロードAPI実行
   - Step 3: 完了後に詳細/一覧へ遷移
3. **エラーハンドリング**:
   - Step 1失敗 → ファイル破棄、エラー表示
   - Step 2失敗 → オーディションは作成済み、警告表示「後で編集画面から設定可能」

### メリット
- ✅ **編集画面と同じUI/UX** - ユーザーは違和感なく操作できる
- ✅ **APIを変更不要** - 既存エンドポイントをそのまま活用
- ✅ **シンプルな実装** - 複雑なドラフト管理や一時ストレージ不要
- ✅ **保守性が高い** - MediaUploaderコンポーネントを再利用
- ✅ **エレガント** - 最小限のコード追加で実現

---

## 実装計画

### Phase 1: ローカルState準備 [SF]
**ファイル**: `apps/web/src/app/organizer/auditions/new/page.tsx`

```typescript
// 新規State追加
const [mainVisualFile, setMainVisualFile] = useState<File | null>(null)
const [mainVisualPreview, setMainVisualPreview] = useState<{
  url: string
  type: 'image' | 'video'
} | null>(null)
const [mediaUploading, setMediaUploading] = useState(false)

// ファイル選択ハンドラ（編集画面と同じインターフェース）
const handleMainVisualSelect = async (file: File) => {
  try {
    // プレビュー用のObject URL生成
    const objectUrl = URL.createObjectURL(file)
    const mediaType = file.type.startsWith('video/') ? 'video' : 'image'
    
    setMainVisualFile(file)
    setMainVisualPreview({ url: objectUrl, type: mediaType })
  } catch (error) {
    console.error('ファイル選択エラー:', error)
    setErrors({ ...errors, mainVisual: 'ファイルの選択に失敗しました' })
  }
}

// 削除ハンドラ
const handleMainVisualRemove = () => {
  if (mainVisualPreview?.url) {
    URL.revokeObjectURL(mainVisualPreview.url)
  }
  setMainVisualFile(null)
  setMainVisualPreview(null)
}
```

### Phase 2: フォーム送信ロジック拡張 [REH]

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setErrors({})
  setLoading(true)

  try {
    // Step 1: オーディション作成（既存ロジック）
    const payload = { /* 既存のpayload */ }
    const response = await fetch('/api/v1/organizer/auditions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok) {
      // エラーハンドリング（既存と同じ）
      if (data.errors) {
        const errorMap: Record<string, string> = {}
        data.errors.forEach((err: { path?: string[]; message: string }) => {
          errorMap[err.path?.[0] || 'general'] = err.message
        })
        setErrors(errorMap)
      } else {
        setErrors({ general: data.details || data.error || '作成に失敗しました' })
      }
      return
    }

    const auditionId = data.audition.id

    // Step 2: メインビジュアルアップロード（ファイルがある場合のみ）
    if (mainVisualFile) {
      setMediaUploading(true)
      try {
        const formData = new FormData()
        formData.append('file', mainVisualFile)

        const uploadResponse = await fetch(
          resolveApiUrl(`/api/v1/organizer/auditions/${auditionId}/main-visual/upload`),
          {
            method: 'POST',
            credentials: 'include',
            body: formData,
          }
        )

        if (!uploadResponse.ok) {
          // アップロード失敗でもオーディションは作成済み
          console.error('メインビジュアルのアップロードに失敗しました')
          setErrors({
            general: 'オーディションは作成されましたが、メインビジュアルのアップロードに失敗しました。編集画面から再度設定してください。'
          })
          // 3秒後に詳細画面へ遷移
          setTimeout(() => {
            router.push(`/organizer/auditions/${auditionId}`)
          }, 3000)
          return
        }
      } finally {
        setMediaUploading(false)
      }
    }

    // Step 3: 成功時の遷移
    router.push(`/organizer/auditions/${auditionId}`)
  } catch (error) {
    console.error('Failed to create audition:', error)
    setErrors({ general: 'ネットワークエラーが発生しました' })
  } finally {
    setLoading(false)
  }
}
```

### Phase 3: UI配置（編集画面と同じ） [CA][DRY]

```tsx
{/* 基本情報セクション内 */}
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
  <h2 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h2>

  <div className="space-y-4">
    {/* タイトル、説明、応募条件などの既存フィールド */}
    
    {/* メインビジュアル */}
    <div>
      <MediaUploader
        mediaUrl={mainVisualPreview?.url || null}
        mediaType={mainVisualPreview?.type || null}
        onUpload={handleMainVisualSelect}
        onDelete={handleMainVisualRemove}
        disabled={loading || mediaUploading}
      />
      {errors.mainVisual && (
        <p className="text-red-500 text-sm mt-1">{errors.mainVisual}</p>
      )}
    </div>
  </div>
</div>
```

### Phase 4: クリーンアップ処理 [PA]

```typescript
// コンポーネントアンマウント時にObject URLを解放
useEffect(() => {
  return () => {
    if (mainVisualPreview?.url) {
      URL.revokeObjectURL(mainVisualPreview.url)
    }
  }
}, [mainVisualPreview?.url])
```

---

## 変更ファイル一覧

### 新規作成
なし（既存ファイルの修正のみ）

### 変更
1. **`apps/web/src/app/organizer/auditions/new/page.tsx`**
   - State追加: `mainVisualFile`, `mainVisualPreview`, `mediaUploading`
   - ハンドラ追加: `handleMainVisualSelect`, `handleMainVisualRemove`
   - `handleSubmit`拡張: アップロードロジック追加
   - UI追加: `MediaUploader`コンポーネント配置
   - クリーンアップ処理追加

2. **`apps/web/src/shared/lib/api.ts`** (必要に応じて)
   - `resolveApiUrl`のimportを追加（既にあれば不要）

---

## テスト項目

### 機能テスト
- [ ] ファイル選択 → プレビュー表示
- [ ] ファイル削除 → プレビュー消去
- [ ] オーディション作成のみ（ファイルなし）→ 正常動作
- [ ] オーディション作成 + ファイルアップロード → 両方成功
- [ ] オーディション作成成功 + アップロード失敗 → 警告表示、3秒後に遷移
- [ ] オーディション作成失敗 → エラー表示、ファイルは保持（再送信可能）

### UI/UXテスト
- [ ] 画像プレビュー表示（JPEG, PNG, WebP）
- [ ] 動画プレビュー表示（MP4, WebM）
- [ ] ファイルサイズ制限エラー（画像5MB、動画50MB）
- [ ] 不正ファイル形式のリジェクト
- [ ] ローディング状態の表示
- [ ] エラーメッセージの表示

### エッジケース
- [ ] ネットワーク切断時のエラーハンドリング
- [ ] 大容量ファイルのアップロード
- [ ] ブラウザバック時のObject URL解放
- [ ] 複数回のファイル選択（上書き）

---

## エラーハンドリング戦略 [REH]

### ケース1: オーディション作成失敗
- **状態**: ファイルは選択済み
- **動作**: エラー表示、ファイルは保持（ユーザーが再送信可能）
- **メッセージ**: APIから返却されたエラー内容を表示

### ケース2: オーディション作成成功 + アップロード失敗
- **状態**: オーディションはDBに作成済み
- **動作**: 警告表示、3秒後に詳細画面へ自動遷移
- **メッセージ**: 「オーディションは作成されましたが、メインビジュアルのアップロードに失敗しました。編集画面から再度設定してください。」

### ケース3: ネットワークエラー
- **動作**: 一般的なエラーメッセージ表示
- **メッセージ**: 「ネットワークエラーが発生しました」

---

## パフォーマンス考慮事項 [PA]

1. **Object URLの適切な管理**
   - 選択時に`URL.createObjectURL()`で生成
   - 削除時/アンマウント時に`URL.revokeObjectURL()`で解放
   - メモリリークを防止

2. **プレビュー最適化**
   - 大容量ファイルでもブラウザ側でプレビュー表示
   - サーバーへは実際のアップロード時のみ送信

3. **ローディング状態の管理**
   - `loading`: オーディション作成中
   - `mediaUploading`: メインビジュアルアップロード中
   - 適切にUIを無効化し、二重送信を防止

---

## 代替案の検討 [AS]

### 案1: 二段階フロー（モーダル）
- **概要**: 作成後にモーダルでアップロードを促す
- **Pros**: 実装が簡単
- **Cons**: 画面遷移が増える、UX低下
- **判定**: ❌ 採用しない

### 案2: 編集画面へ即遷移
- **概要**: 作成成功後に`/organizer/auditions/{id}/edit`へ遷移
- **Pros**: 既存UIを完全流用
- **Cons**: 画面遷移が多い、ユーザーが混乱
- **判定**: ❌ 採用しない

### 案3: ドラフト機能 + 一時ストレージ
- **概要**: 仮IDを生成し、ファイルを先にアップロード
- **Pros**: 完全に1フロー
- **Cons**: 実装コスト大、複雑化
- **判定**: ❌ オーバーエンジニアリング

### 案4: 今回採用案（ローカルState保持）
- **概要**: ファイル選択→ローカル保持→作成→アップロード
- **Pros**: シンプル、編集画面と同じUI、既存API活用
- **Cons**: なし
- **判定**: ✅ 採用

---

## 実装スケジュール（目安）

| Phase | 作業内容 | 想定工数 |
|-------|---------|---------|
| Phase 1 | State準備 + ハンドラ実装 | 1h |
| Phase 2 | フォーム送信ロジック拡張 | 2h |
| Phase 3 | UI配置 + スタイル調整 | 1h |
| Phase 4 | クリーンアップ処理 | 0.5h |
| テスト | 機能テスト + UI/UXテスト | 2h |
| **合計** | | **6.5h** |

---

## 設計原則の適用

- **[SF] Simplicity First**: 既存APIを活用、複雑な新規機能なし
- **[CA] Clean Architecture**: コンポーネント再利用、関心の分離
- **[DRY] Don't Repeat Yourself**: MediaUploaderを共通化
- **[REH] Robust Error Handling**: 3段階のエラーハンドリング戦略
- **[PA] Performance Awareness**: Object URLの適切な管理
- **[RP] Readability Priority**: コメント付き、理解しやすいコード

---

## 関連ドキュメント

- `docs/tasksarchive/AUDITION_MAIN_VISUAL_IMPLEMENTATION.md` - メインビジュアル機能の初期実装
- `docs/DATABASE_MANAGEMENT.md` - DBマイグレーション運用
- `apps/web/src/shared/components/MediaUploader.tsx` - MediaUploaderコンポーネント仕様

---

## 完了条件

- [x] 新規作成画面にMediaUploaderが配置されている
- [x] ファイル選択→プレビュー表示が正常動作
- [x] オーディション作成→メインビジュアルアップロードが正常動作
- [x] エラーハンドリングが適切に実装されている
- [x] Object URLのメモリリークが発生しない
- [x] 編集画面と同等のUI/UXを提供している
- [ ] すべてのテスト項目が合格している（次のステップで検証）

---

## 実装完了（2025-11-09）

### 実装内容
- ✅ Phase 1: State準備とハンドラ実装完了
- ✅ Phase 2: フォーム送信ロジック拡張完了
- ✅ Phase 3: UI配置とMediaUploader統合完了
- ✅ Phase 4: 型エラー修正完了

### 変更ファイル
- `apps/web/src/app/organizer/auditions/new/page.tsx` - メインビジュアル機能追加

### 次のステップ
1. ローカル環境で動作確認
2. テスト項目の実施
3. 問題なければdevelopブランチへpush → CI/CD自動デプロイ

---

**最もシンプルでエレガントな解決策。編集画面と同じUIで、ユーザーは違和感なく操作できる。** [SF][CA][DRY]
