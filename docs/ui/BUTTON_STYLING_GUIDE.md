# ボタンスタイリングガイド

## 問題の背景

アプリ全体でボタンのスタイリングが不統一で、以下の問題が発生していました：

- **選択済みフィルターボタン**: 枠線なし（`bg-primary text-primary-foreground`のみ）
- **未選択フィルターボタン**: 枠線あり（`border border-border`）
- **詳細を見るボタン**: 枠線なし
- **取り下げボタン**: 枠線あり

→ **ユーザーから見て、どのボタンが押せるのか、何が選択されているのか分かりにくい**

## 根本原因

**2つの異なるボタンスタイルパターンが混在**していました：

1. **Solidスタイル**: 背景色のみ（`bg-primary`）→ 枠線なし
2. **Outlineスタイル**: 枠線のみ（`border border-border`）→ 背景色なし

shadcn/uiの標準的なButton variantsに準拠していないため、統一感がありませんでした。

## 解決策：統一ルール

### 1. プライマリボタン（Primary Button）

**用途**: メインアクション（応募する、送信する、詳細を見る、など）

```tsx
className="bg-primary text-primary-foreground border border-primary rounded-lg hover:bg-primary/90 transition-colors"
```

**ポイント**:
- ✅ 背景色 + 枠線の両方を指定
- ✅ `border-primary` で枠線色を背景色と統一
- ✅ `transition-colors` でスムーズなホバー効果

### 2. セカンダリボタン（Secondary Button）

**用途**: サブアクション（戻る、キャンセル、取り下げ、など）

```tsx
className="bg-background border border-border rounded-lg hover:bg-muted transition-colors"
```

**ポイント**:
- ✅ 背景色 + 枠線の両方を指定
- ✅ `bg-background` で背景色を明示
- ✅ `text-foreground` でテキスト色を明示（必要に応じて）

### 3. フィルターボタン（Filter Button）

**用途**: タブやフィルター選択

```tsx
// 選択済み
className="bg-primary text-primary-foreground border border-primary rounded-lg transition-colors"

// 未選択
className="bg-background border border-border text-foreground hover:bg-muted transition-colors"
```

**ポイント**:
- ✅ 選択済み・未選択の両方に枠線を指定
- ✅ 選択済みは背景色で強調（`bg-primary`）
- ✅ 未選択は `bg-background` で背景色を明示

### 4. 装飾的要素（Badge, Icon）

**用途**: ステップ番号、ステータスバッジ、アイコン

```tsx
// ステップ番号バッジ
className="bg-primary text-primary-foreground rounded-full"

// ステータスバッジ
className="bg-blue-100 text-blue-800 rounded-full"
```

**ポイント**:
- ✅ 装飾的要素には枠線不要
- ✅ 背景色のみで視覚的に区別

## 修正済みファイル

### LIFF（タレント側）

1. **`apps/web/src/app/liff/applications/_components/MyApplicationsClient.tsx`**
   - フィルターボタン（すべて、未審査、審査中、合格、不合格）に枠線追加
   - 選択済みは `bg-primary + border-primary`、未選択は `bg-background + border-border`
   - 詳細を見るボタンに `border-primary` 追加
   - 取り下げボタンに `bg-background` 追加

2. **`apps/web/src/app/liff/auditions/[id]/apply/page.tsx`**
   - マイ応募一覧へボタンに `border-primary` 追加
   - 戻る・キャンセルボタンに `bg-background + border-border` 追加
   - 応募するボタンに `border-primary` 追加
   - モーダル内のボタンに枠線追加

3. **`apps/web/src/app/liff/page.tsx`**
   - ページを再読み込みボタンに `border-primary` 追加

## 実装時のチェックリスト

ボタンを実装する際は、以下を確認してください：

- [ ] **背景色と枠線の両方を指定**しているか？
- [ ] **プライマリボタンは `border-primary`** を使用しているか？
- [ ] **セカンダリボタンは `bg-background + border-border`** を使用しているか？
- [ ] **`transition-colors`** を追加しているか？
- [ ] **装飾的要素（バッジ、アイコン）には枠線を追加していない**か？

## 設計原則

[SF][RP][UX] - シンプル、可読性優先、ユーザー体験向上

**統一されたボタンスタイルで、ユーザーが直感的に操作できるUIを実現します。**
