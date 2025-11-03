# ポイント機能 最終レビュー

**レビュー日**: 2025-10-20  
**レビュアー**: AI + Human  
**ステータス**: ✅ **実装開始承認**

---

## 🎯 整合性チェック結果

### 1. データベース設計 ✅ 完璧

#### テーブル構成
- `points_accounts` - **user_id** 使用（将来拡張対応）
- `points_transactions` - 取引履歴
- `points_plans` - プラン管理
- `viewed_applications` - **user_id** 使用
- `auditions` 拡張 - 4カラム追加
- `audition_genres` 拡張 - 1カラム追加

#### 外部キー整合性
✅ すべてのリレーションが正しく定義されている

#### インデックス設計
✅ 検索パフォーマンスを考慮した設計

#### RLSポリシー
✅ **user_id** に統一済み（organizer_id から修正完了）

---

### 2. ビジネスルール ✅ 矛盾なし

#### 閲覧単価の優先順位（明確）
```
1. 案件ごとの設定（auditions.viewing_point_cost）- 最優先
2. ジャンルごとの設定（audition_genres.viewing_point_cost）
3. デフォルト設定（system_settings = 100pt）
```

#### 無料閲覧枠の仕様（明確）
- 案件ごとに設定可能（`free_viewing_quota`）
- NULL or 0 = 無料枠なし
- 1〜N人まで無料、N+1人目からポイント消費

#### ポイント消費フロー（論理的）
```
1. 見放題チェック（unlimited_viewing）
2. 既に閲覧済みかチェック
3. 無料閲覧枠チェック
4. 閲覧単価決定（優先順位に従う）
5. 残高チェック
6. 上限ポイントチェック（見放題判定）
```

**矛盾なし、論理的に完璧**

---

### 3. API設計 ✅ 一貫性あり

#### エンドポイント命名規則
- 主催者: `/api/v1/points/*`
- Admin: `/api/v1/admin/points/*`
- Webhook: `/api/v1/webhook/stripe`

#### HTTPメソッド
- GET: 取得
- POST: 作成・実行
- PATCH: 更新
- DELETE: 削除

**RESTful、一貫性あり**

#### Admin APIの網羅性
✅ すべてのルールを管理可能
- デフォルト単価
- ジャンル別単価
- ポイントプラン
- 手動付与/減算

---

### 4. UI/UX設計 ✅ 論理的

#### Admin管理画面の構成
```
/admin/points                     - 統合ダッシュボード
/admin/points/accounts            - アカウント管理
/admin/points/plans               - プラン管理
/admin/points/settings            - グローバル設定
/admin/points/genre-costs         - ジャンル別単価
/admin/points/rules/overview      - 全ルール一覧
```

**すべてのルールを一箇所で確認・調整可能** ✅

#### 主催者の導線
```
残高確認 → ポイント購入 → 応募者閲覧 → ポイント消費
```

**シンプルで直感的** ✅

#### エラーハンドリング
- 残高不足: 購入誘導モーダル
- 無料枠内: 「無料閲覧（残りN人）」表示
- 無料枠超過: 「消費ポイント: Xpt」表示

**ユーザーフレンドリー** ✅

---

### 5. 型定義 ✅ 統一完了

#### Backend & Frontend共通
```typescript
PointsAccount {
  user_id: string           // ✅ 統一済み
  account_type: 'organizer' | 'talent'
}

ViewedApplication {
  user_id: string           // ✅ 統一済み
}
```

**organizer_id から user_id へ完全移行** ✅

---

### 6. 拡張性 ✅ 柔軟な設計

#### 将来対応可能な機能
- ポイントルール管理（Phase 2.5）
- キャスト向けポイント（Phase 8）
- 投げ銭機能
- ポイント失効
- サブスクリプション

#### 拡張の容易さ
- **データ構造**: user_id設計で、account_typeで判別するだけ
- **API**: transaction_type追加のみ
- **UI**: 新規ディレクトリ追加、既存に影響なし

**完璧な拡張性** ✅

---

## 🚨 発見・修正した矛盾

### 1. user_id vs organizer_id の不整合 ✅ 修正完了

**問題**:
- POINTS_FEATURE_SPECIFICATION.md: `user_id` 使用
- POINTS_DIRECTORY_STRUCTURE.md: `organizer_id` が一部残存

**修正**:
- RLSポリシーを `user_id` に統一
- 型定義を `user_id` に統一
- `account_type` カラムを追加

---

## 📋 実装前チェックリスト

### Phase 1開始前に確認すること

- [x] データベーススキーマの整合性確認
- [x] API設計の一貫性確認
- [x] ビジネスルールの矛盾チェック
- [x] UI/UXフローの論理性確認
- [x] 型定義の統一確認
- [x] ドキュメント間の整合性確認
- [x] 設計原則の明記

### 実装開始時に厳守すること

**🎯 設計三原則**:
1. **[SF] Simple First**: 最もシンプルな実装を選択
2. **[DRY] Don't Repeat Yourself**: 重複コードは即リファクタリング
3. **[CA] Clean Architecture**: 機能ごとに集約、散らばらせない

**実装チェックリスト**:
- [ ] コード書く前: 最もシンプルな方法か？
- [ ] コード書く前: 既存コードを再利用できないか？
- [ ] コミット前: 重複コードはないか？
- [ ] コミット前: console.logは削除したか？
- [ ] コミット前: 型定義は共通化されているか？

---

## 🎉 最終判定

### ✅ **実装開始承認**

すべての設計が完璧に整合性が取れており、矛盾はありません。

**理由**:
- データベース設計が堅牢
- ビジネスルールが明確
- API設計が一貫している
- UI/UXが論理的
- 拡張性が高い
- ドキュメントが完全

### 🚀 次のアクション

```bash
# Phase 1: データ基盤整備を開始
cd /Users/taichiumeki/dev/services/casto

# マイグレーションファイル作成
supabase/migrations/20251020100000_create_points_system.sql
```

---

## 📝 注意事項

### 実装中に迷ったら

1. **POINTS_FEATURE_SPECIFICATION.md** を参照
2. **POINTS_DIRECTORY_STRUCTURE.md** でファイル配置確認
3. **TODO.md** の設計三原則を思い出す

### 絶対に避けること

- ❌ 複雑な抽象化
- ❌ コードの重複
- ❌ ファイルの散在
- ❌ console.logの残置
- ❌ 型定義の重複

### 推奨すること

- ✅ シンプルな実装
- ✅ 共通関数の活用
- ✅ features/points/ に集約
- ✅ エラーログのみ残す
- ✅ packages/shared で型定義共有

---

**設計原則**: [SF][CA][DRY][REH][SFT]  
**レビュー結果**: ✅ **完璧 - 実装開始GO！**
