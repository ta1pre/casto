# HelpHintコンポーネント利用ガイド

## 目的
`apps/web/src/shared/ui/help-hint.tsx` に定義した `HelpHint` は、フォーム項目やガイド文の横に配置するヘルプアイコンを統一的に提供するためのコンポーネントです。モバイル端末でもタップしやすく、アプリ全体で再利用できる設計になっています。

## 基本構造
```tsx
import { HelpHint } from "@/shared/ui/help-hint"

<HelpHint description="説明文" />
```

- `description`: **必須**。テキストまたは任意の `ReactNode` を渡します。
- `title`: 見出しを表示したい場合に指定します。
- `placement`: `"top" | "bottom" | "left" | "right"` でツールチップの位置を制御。初期値は `"top"`。

## 配置ガイドライン
- ラベルや見出しの右側に `flex` で横並び配置するのが基本パターンです。
- ツールチップの幅は、コンテンツの長さに合わせて自動で調整されます (`w-max`)。
- 最大幅は `15rem` (約240px) に設定されており、これを超えるテキストは自動的に折り返されます。
- アイコンのタップ領域は十分確保されていますが、周囲の要素と近すぎないよう配置に注意してください。

## アクセシビリティ
- `aria-label` にはデフォルトで「ヘルプを表示」を設定。音声読み上げ用途で文言を変えたい場合は `triggerLabel` を指定します。
- `Esc` キーで閉じることができ、フォーカスはトリガーボタンに戻ります。

## 応用例
```tsx
<label className="flex items-center gap-2">
  <span>生年月日 (任意)</span>
  <HelpHint
    description="18歳未満の方はオーディション時に親の承諾書が必要です。"
  />
</label>
```

## 注意点
- 長文やリンクを含める場合は `description` に `ReactNode` を渡し、段落やリンク要素を自前で整形してください。
- モーダル表示が必要な場合は `HelpHint` の `trigger` を拡張する新コンポーネントを検討してください。
