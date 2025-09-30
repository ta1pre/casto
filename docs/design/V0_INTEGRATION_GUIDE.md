# v0統合ガイドライン

## 基本方針

v0で生成したコンポーネントは、既存のデザインシステムと混在させず、明確に区別して管理する。

## ディレクトリ構造

```
apps/web/src/
├── components/
│   ├── ui/                  # shadcn/ui基本コンポーネント（Button, Card等）
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── features/            # 機能別コンポーネント（推奨）
│   │   ├── audition/        # オーディション機能
│   │   │   ├── audition-card.tsx
│   │   │   ├── audition-list.tsx
│   │   │   └── audition-filter.tsx
│   │   ├── profile/         # プロフィール機能
│   │   └── ...
│   └── shared/              # 共通コンポーネント
│       ├── header.tsx
│       ├── footer.tsx
│       └── navigation.tsx
```

## v0統合ワークフロー

### Step 1: v0でデザイン生成
1. v0.devでプロンプト入力
2. デザインを選択
3. **「Copy Code」でコードをコピー**（`npx shadcn add`は使わない）

### Step 2: 必要なコンポーネント確認
```typescript
// コピーしたコードから必要なshadcn/uiコンポーネントを確認
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"  // ← まだない場合のみ追加
```

### Step 3: 不足しているコンポーネントを追加
```bash
# Docker環境で実行
docker exec -it casto sh -c 'cd apps/web && npx shadcn@latest add badge'
```

### Step 4: コンポーネントを適切な場所に配置
```bash
# ❌ 悪い例
src/components/audition-card.tsx

# ✅ 良い例
src/components/features/audition/audition-card.tsx
```

### Step 5: インデックスファイルでエクスポート
```typescript
// src/components/features/audition/index.ts
export { AuditionCard } from './audition-card'
export { AuditionList } from './audition-list'
export { AuditionFilter } from './audition-filter'
```

## v0使用時の注意事項

### ⚠️ やってはいけないこと

1. **`npx shadcn add [URL]`の盲目的な実行**
   - package.jsonが上書きされる
   - 不要なファイルが生成される

2. **コンポーネントの直置き**
   - `src/components/`直下に配置しない
   - 機能別にディレクトリを分ける

3. **依存関係の無確認追加**
   - Radix UIコンポーネントが大量に追加される
   - 本当に必要なものだけ追加

### ✅ やるべきこと

1. **コードレビュー**
   - v0のコードを確認してから追加
   - TypeScriptエラーがないか確認
   - Next.js 15との互換性確認

2. **段階的な追加**
   - 1つずつコンポーネントを追加
   - ビルドが通ることを確認
   - コミット前に動作確認

3. **命名規則の統一**
   - ケバブケース: `audition-card.tsx`
   - コンポーネント名: `AuditionCard`
   - 機能が明確な名前

## トラブルシューティング

### package.jsonが上書きされた場合

```bash
# バージョン管理から復元
git checkout HEAD -- apps/web/package.json
npm install
```

### 重複ファイルが生成された場合

```bash
# v0が作成した不要なディレクトリを削除
rm -rf apps/web/app/  # src/appが正しい
```

### Next.js 15との互換性エラー

```typescript
// v0はNext.js 14想定の場合がある
// paramsを非同期化
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // ...
}
```

## チェックリスト

v0コンポーネント追加時：

- [ ] コードをコピー（`npx shadcn add`は使わない）
- [ ] 必要なshadcn/uiコンポーネントを確認
- [ ] 不足コンポーネントを個別に追加
- [ ] 機能別ディレクトリに配置
- [ ] インデックスファイルでエクスポート
- [ ] ビルドが通ることを確認
- [ ] Dockerで動作確認
- [ ] package.jsonが変更されていないか確認
- [ ] コミット

## 参考

- [shadcn/ui公式](https://ui.shadcn.com/)
- [v0公式](https://v0.dev/)
- [Next.js 15ドキュメント](https://nextjs.org/docs)
