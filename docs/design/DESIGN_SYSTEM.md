# Casto デザインシステム

## 概要

Castoのデザインシステムは、Tailwind CSS + shadcn/uiをベースに構築されています。
一貫性のあるUI/UX、高速な開発、優れたアクセシビリティを実現します。

## 技術スタック

- **Tailwind CSS**: ユーティリティファーストのCSSフレームワーク
- **shadcn/ui**: 再利用可能なReactコンポーネントライブラリ
- **Lucide React**: アイコンライブラリ
- **class-variance-authority (CVA)**: コンポーネントバリアント管理
- **v0**: AIによるコンポーネント生成支援

## デザイントークン

### カラーパレット

#### Primary（プライマリ）
- **用途**: メインアクション、ブランドカラー
- **Light**: `hsl(240 5.9% 10%)` - ダークグレー
- **Dark**: `hsl(0 0% 98%)` - ホワイト

#### Secondary（セカンダリ）
- **用途**: サブアクション、補助的な要素
- **Light**: `hsl(240 4.8% 95.9%)` - ライトグレー
- **Dark**: `hsl(240 3.7% 15.9%)` - ダークグレー

#### Accent（アクセント）
- **用途**: 強調、注目を集める要素
- **Light**: `hsl(240 4.8% 95.9%)`
- **Dark**: `hsl(240 3.7% 15.9%)`

#### Destructive（破壊的アクション）
- **用途**: 削除、エラー、警告
- **Light**: `hsl(0 84.2% 60.2%)` - レッド
- **Dark**: `hsl(0 62.8% 30.6%)` - ダークレッド

#### Semantic Colors
- **Muted**: 控えめなテキスト・背景
- **Border**: ボーダー、区切り線
- **Input**: フォーム入力フィールド
- **Ring**: フォーカスリング

### タイポグラフィ

#### フォントファミリー
```css
font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

#### フォントサイズ（Tailwind標準）
- `text-xs`: 0.75rem (12px)
- `text-sm`: 0.875rem (14px)
- `text-base`: 1rem (16px)
- `text-lg`: 1.125rem (18px)
- `text-xl`: 1.25rem (20px)
- `text-2xl`: 1.5rem (24px)
- `text-3xl`: 1.875rem (30px)
- `text-4xl`: 2.25rem (36px)

#### フォントウェイト
- `font-normal`: 400
- `font-medium`: 500
- `font-semibold`: 600
- `font-bold`: 700

#### 行間
- `leading-tight`: 1.25
- `leading-normal`: 1.5
- `leading-relaxed`: 1.625

### スペーシング（Tailwind標準）

- `0`: 0px
- `1`: 0.25rem (4px)
- `2`: 0.5rem (8px)
- `3`: 0.75rem (12px)
- `4`: 1rem (16px)
- `6`: 1.5rem (24px)
- `8`: 2rem (32px)
- `12`: 3rem (48px)
- `16`: 4rem (64px)

### ブレークポイント（Tailwind標準）

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### 角丸（Border Radius）

- `rounded-sm`: `calc(var(--radius) - 4px)` - 小
- `rounded-md`: `calc(var(--radius) - 2px)` - 中
- `rounded-lg`: `var(--radius)` - 大（デフォルト: 0.5rem）
- `rounded-full`: 完全な円形

### シャドウ

- `shadow-sm`: 軽いシャドウ
- `shadow`: 標準シャドウ
- `shadow-md`: 中程度のシャドウ
- `shadow-lg`: 大きなシャドウ
- `shadow-xl`: 特大シャドウ

## コンポーネント使用ガイドライン

### Button（ボタン）

```tsx
import { Button } from "@/components/ui/button"

// Primary
<Button>クリック</Button>

// Secondary
<Button variant="secondary">キャンセル</Button>

// Destructive
<Button variant="destructive">削除</Button>

// Outline
<Button variant="outline">詳細</Button>

// Ghost
<Button variant="ghost">閉じる</Button>

// サイズ
<Button size="sm">小</Button>
<Button size="default">標準</Button>
<Button size="lg">大</Button>
```

### Card（カード）

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>タイトル</CardTitle>
    <CardDescription>説明文</CardDescription>
  </CardHeader>
  <CardContent>
    コンテンツ
  </CardContent>
  <CardFooter>
    フッター
  </CardFooter>
</Card>
```

### Input（入力フィールド）

```tsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

<div>
  <Label htmlFor="email">メールアドレス</Label>
  <Input id="email" type="email" placeholder="example@casto.jp" />
</div>
```

### Alert（アラート）

```tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

<Alert>
  <AlertTitle>注意</AlertTitle>
  <AlertDescription>
    重要なメッセージがここに表示されます。
  </AlertDescription>
</Alert>

// Destructive
<Alert variant="destructive">
  <AlertTitle>エラー</AlertTitle>
  <AlertDescription>
    エラーが発生しました。
  </AlertDescription>
</Alert>
```

## レイアウトパターン

### コンテナ

```tsx
<div className="container mx-auto px-4 py-8">
  {/* コンテンツ */}
</div>
```

### グリッドレイアウト

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div>アイテム1</div>
  <div>アイテム2</div>
  <div>アイテム3</div>
</div>
```

### Flexレイアウト

```tsx
<div className="flex items-center justify-between">
  <div>左</div>
  <div>右</div>
</div>
```

## アクセシビリティ基準

### キーボードナビゲーション
- すべてのインタラクティブ要素はキーボードでアクセス可能
- `Tab`キーで順次移動
- `Enter`/`Space`キーで実行

### フォーカス管理
- フォーカス可能な要素には明確なフォーカスリング
- `focus-visible:`を使用してキーボードフォーカスのみ表示

### カラーコントラスト
- WCAG 2.1 AA基準を満たす（最低4.5:1）
- テキストと背景のコントラスト比を確保

### セマンティックHTML
- 適切なHTML要素を使用（`<button>`, `<nav>`, `<main>`, etc.）
- ARIA属性を必要に応じて追加

### スクリーンリーダー対応
- 画像には`alt`属性
- アイコンのみのボタンには`aria-label`

## アニメーション・インタラクション指針

### トランジション

```tsx
// ホバー
<Button className="transition-colors hover:bg-primary/90">
  ホバー効果
</Button>

// フェードイン
<div className="animate-in fade-in duration-300">
  フェードイン
</div>
```

### 推奨アニメーション時間
- **短い**: 150ms - 小さな変化（ホバー、フォーカス）
- **標準**: 300ms - 通常のトランジション
- **長い**: 500ms - 大きな変化（モーダル表示）

### アニメーション原則
- **控えめに**: 過度なアニメーションは避ける
- **目的を持つ**: ユーザーの注意を適切に誘導
- **パフォーマンス**: `transform`と`opacity`を優先（GPUアクセラレーション）

## ダークモード対応

### 実装方法

```tsx
// Tailwindのdark:プレフィックスを使用
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
  コンテンツ
</div>
```

### トグル実装（next-themes推奨）

```tsx
import { useTheme } from "next-themes"

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  
  return (
    <Button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      テーマ切替
    </Button>
  )
}
```

## v0連携ガイド

### v0の使い方
1. [v0.dev](https://v0.dev)にアクセス
2. 作りたいコンポーネントを自然言語で説明
3. 生成されたコードをコピー
4. `src/components/`に配置
5. 必要に応じてカスタマイズ

### v0使用時の注意点
- 生成されたコードは必ずレビュー
- アクセシビリティを確認
- プロジェクトのトンマナに合わせて調整
- 不要なコードは削除

## コンポーネント命名規則

### ファイル命名
- PascalCase: `UserProfile.tsx`
- UIコンポーネント: `src/components/ui/button.tsx`
- 機能コンポーネント: `src/components/UserProfile.tsx`

### クラス名
- Tailwindユーティリティクラスを使用
- カスタムクラスは最小限に
- `cn()`ヘルパーで条件付きクラス管理

```tsx
import { cn } from "@/lib/utils"

<div className={cn(
  "base-class",
  isActive && "active-class",
  className
)}>
```

## 開発ワークフロー

### 新規コンポーネント作成
1. shadcn/uiで基本コンポーネントを確認
2. 既存コンポーネントがなければv0で生成
3. `src/components/ui/`または`src/components/`に配置
4. Storybookまたはテストページで動作確認
5. ドキュメント更新

### 既存コンポーネント修正
1. 変更の影響範囲を確認
2. 他のページで使用されているか確認
3. 修正実施
4. 全体の動作確認

## ベストプラクティス

### DO（推奨）
✅ Tailwindユーティリティクラスを使用
✅ shadcn/uiコンポーネントを優先
✅ レスポンシブデザインを常に考慮
✅ アクセシビリティを確保
✅ 一貫性のあるスペーシング
✅ セマンティックなHTML

### DON'T（非推奨）
❌ インラインスタイルの多用
❌ カスタムCSSの乱用
❌ 固定幅の使用（レスポンシブ対応のため）
❌ 過度なアニメーション
❌ 不適切なカラーコントラスト
❌ 非セマンティックなHTML（`<div>`の乱用）

## トラブルシューティング

### Tailwindクラスが効かない
- `tailwind.config.ts`の`content`パスを確認
- ビルドを再実行: `npm run dev`

### shadcn/uiコンポーネントが見つからない
- `components.json`の`aliases`を確認
- `tsconfig.json`の`paths`を確認

### ダークモードが動作しない
- `tailwind.config.ts`の`darkMode: ["class"]`を確認
- `next-themes`がインストールされているか確認

## 参考リンク

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Lucide Icons](https://lucide.dev)
- [v0.dev](https://v0.dev)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**最終更新**: 2025-09-30
**バージョン**: 1.0.0
