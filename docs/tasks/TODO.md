# TODO - ポイント機能実装

**策定日**: 2025-10-20  
**参照ドキュメント**:
- `docs/tasks/POINTS_FEATURE_SPECIFICATION.md` - 詳細仕様書
- `docs/tasks/POINTS_DIRECTORY_STRUCTURE.md` - ディレクトリ構成

---

## ⚠️ 実装時の絶対原則（必読）

### 🎯 設計三原則を常に意識せよ

1. **[SF] Simple First - シンプルファースト**
   - 最もシンプルな実装を選択する
   - 複雑な抽象化は避ける
   - 「動く最小限のコード」を書く

2. **[DRY] Don't Repeat Yourself - 重複排除**
   - 同じロジックを2回書いたら即リファクタリング
   - 3行以上の重複コードは関数化
   - コピペ厳禁

3. **[CA] Clean Architecture - クリーンアーキテクチャ**
   - 機能ごとに1つのディレクトリに集約
   - ファイルを散らばらせない
   - `features/points/` 配下に全て収める

### 💡 実装チェックリスト

**コード書く前に自問せよ**:
- □ これは最もシンプルな方法か？
- □ 既存のコードを再利用できないか？
- □ ファイルは正しいディレクトリに配置されているか？

**コミット前に確認せよ**:
- □ 重複コードはないか？
- □ console.log は削除したか？
- □ 型定義は共通化されているか？

---

## Phase 0: 仕様策定と設計 ✅ **完了**

- [x] ポイント種別と通貨ルール定義
- [x] Stripe決済連携範囲の確定
- [x] 主催者閲覧課金フローの整理
- [x] ディレクトリ構成案の作成
- [x] API設計の確定
- [x] UI/UX設計の確定

---

## Phase 1: データ基盤整備（目安: 2日）

### 1.1 DBマイグレーション作成 ⭐⭐⭐
- [ ] `supabase/migrations/20251020100000_create_points_system.sql` 作成
  - [ ] `points_accounts` テーブル（**重要**: `user_id` 使用、将来拡張対応）
  - [ ] `points_transactions` テーブル
  - [ ] `points_plans` テーブル
  - [ ] `viewed_applications` テーブル
  - [ ] `auditions` テーブル拡張
    - [ ] `viewing_point_cost` - 案件ごとの閲覧単価（NULL=ジャンル or デフォルト）
    - [ ] `free_viewing_quota` - 無料閲覧枠（例: 10人まで無料）
    - [ ] `max_viewing_points` - 上限ポイント（見放題判定）
    - [ ] `unlimited_viewing` - 完全無料フラグ
  - [ ] `audition_genres` テーブル拡張
    - [ ] `viewing_point_cost` - ジャンル別閲覧単価（NULL=デフォルト使用）
    - [ ] 初期データ設定（求人=2,500pt、映画=500pt、アイドル=800pt等）
  - [ ] インデックス作成
  - [ ] RLSポリシー設定
  - [ ] `system_settings` 初期データ（default_viewing_point_cost=100）
- [ ] マイグレーション適用テスト（ローカル）
- [ ] マイグレーション適用（リモート）

### 1.2 型定義作成
- [ ] `packages/shared/src/types/points.ts` 作成
  - [ ] PointsAccount型（**重要**: `user_id` を使用、将来拡張対応）
  - [ ] PointsTransaction型（`expires_at` カラム含む）
  - [ ] PointsPlan型
  - [ ] ViewingEligibility型
  - [ ] TransactionType型（拡張可能な設計）

---

## Phase 2: Workers API実装（目安: 3日）

### 2.1 共通ライブラリ
- [ ] `apps/workers/src/lib/stripe.ts` 作成（Stripe SDK初期化）
- [ ] 環境変数設定（wrangler.toml）

### 2.2 主催者向けAPI（/api/v1/points/*）
- [ ] `apps/workers/src/features/points/types.ts` 作成
- [ ] `apps/workers/src/features/points/validation.ts` 作成
- [ ] `apps/workers/src/features/points/service.ts` 実装
  - [ ] `getAccount()` - アカウント取得
  - [ ] `getTransactions()` - 取引履歴取得
  - [ ] `getPointsPlans()` - プラン一覧取得
  - [ ] `checkViewingEligibility()` - 閲覧可否チェック
    - [ ] 無料閲覧枠チェック（案件ごとの閲覧済み数カウント）
    - [ ] 閲覧単価決定（優先順位: 案件 > ジャンル > デフォルト）
    - [ ] ジャンル情報をオーディションと一緒に取得
  - [ ] `consumeViewingPoints()` - ポイント消費（トランザクション）
    - [ ] 無料枠内の場合は0pt消費で記録
    - [ ] 無料枠超過後は単価に従って消費
- [ ] `apps/workers/src/features/points/stripe.service.ts` 実装
  - [ ] `createCheckoutSession()` - Checkout作成
  - [ ] `handleWebhook()` - Webhook処理
  - [ ] `verifyWebhookSignature()` - 署名検証
  - [ ] `issuePoints()` - ポイント付与
- [ ] `apps/workers/src/features/points/routes.ts` 実装
  - [ ] GET `/api/v1/points/account`
  - [ ] GET `/api/v1/points/transactions`
  - [ ] GET `/api/v1/points/plans`
  - [ ] POST `/api/v1/points/purchase`
  - [ ] POST `/api/v1/points/check-viewing`
  - [ ] POST `/api/v1/points/consume-viewing`

### 2.3 Webhook（/api/v1/webhook/stripe）
- [ ] `apps/workers/src/features/webhook/stripe.routes.ts` 実装
  - [ ] POST `/api/v1/webhook/stripe`
  - [ ] `checkout.session.completed` 処理
  - [ ] 署名検証
  - [ ] 冪等性チェック

### 2.4 Admin向けAPI（/api/v1/admin/points/*）
- [ ] `apps/workers/src/features/admin/points/service.ts` 実装
  - [ ] `getAllAccounts()` - 全アカウント取得
  - [ ] `getAccountDetail()` - 詳細取得
  - [ ] `grantPoints()` - 手動付与
  - [ ] `deductPoints()` - 手動減算
  - [ ] `getPlans()` - プラン管理一覧
  - [ ] `createPlan()` - プラン作成
  - [ ] `updatePlan()` - プラン更新
  - [ ] `deletePlan()` - プラン削除
  - [ ] `updateSettings()` - 設定更新
  - [ ] `getGenreCosts()` - ジャンル別単価一覧取得
  - [ ] `updateGenreCost()` - ジャンル別単価更新
- [ ] `apps/workers/src/features/admin/points/routes.ts` 実装
  - [ ] GET `/api/v1/admin/points/accounts`
  - [ ] GET `/api/v1/admin/points/accounts/:id`
  - [ ] POST `/api/v1/admin/points/grant`
  - [ ] POST `/api/v1/admin/points/deduct`
  - [ ] GET `/api/v1/admin/points/plans`
  - [ ] POST `/api/v1/admin/points/plans`
  - [ ] PATCH `/api/v1/admin/points/plans/:id`
  - [ ] DELETE `/api/v1/admin/points/plans/:id`
  - [ ] PATCH `/api/v1/admin/points/settings`
  - [ ] GET `/api/v1/admin/points/genre-costs` - ジャンル別単価一覧
  - [ ] PATCH `/api/v1/admin/points/genre-costs/:id` - ジャンル別単価更新

---

## Phase 3: フロントエンド実装（目安: 4日）

### 3.1 共通部分
- [ ] `apps/web/src/shared/api/points.ts` 作成（API呼び出し統一）
- [ ] `apps/web/src/shared/hooks/points/` 作成
  - [ ] `usePointsAccount.ts`
  - [ ] `usePointsTransactions.ts`
  - [ ] `usePointsPurchase.ts`
  - [ ] `useViewingCheck.ts`
  - [ ] `usePointsConsume.ts`
- [ ] `apps/web/src/shared/components/points/` 作成
  - [ ] `PointsBadge.tsx` - ヘッダー用残高バッジ
  - [ ] `PointsIcon.tsx`
  - [ ] `TransactionTypeLabel.tsx`
- [ ] `apps/web/src/shared/utils/points/` 作成
  - [ ] `formatPoints.ts`
  - [ ] `formatPrice.ts`

### 3.2 主催者向けUI
- [ ] `apps/web/src/app/organizer/points/page.tsx` - 残高・購入導線
- [ ] `apps/web/src/app/organizer/points/purchase/page.tsx` - プラン選択
- [ ] `apps/web/src/app/organizer/points/purchase/success/page.tsx` - 成功
- [ ] `apps/web/src/app/organizer/points/purchase/cancel/page.tsx` - キャンセル
- [ ] `apps/web/src/app/organizer/points/history/page.tsx` - 取引履歴
- [ ] `apps/web/src/app/organizer/points/_components/` 作成
  - [ ] `BalanceCard.tsx`
  - [ ] `PlanSelector.tsx`
  - [ ] `PlanCard.tsx`
  - [ ] `TransactionList.tsx`

### 3.3 応募者閲覧課金UI
- [ ] 応募者詳細ページ修正
  - [ ] `ViewingConfirmModal.tsx` - 閲覧確認モーダル
    - [ ] 無料枠内の場合: 「無料閲覧（残りN人）」表示
    - [ ] 無料枠超過後: 「消費ポイント: Xpt」表示
  - [ ] `InsufficientPointsModal.tsx` - 残高不足モーダル
  - [ ] 閲覧前のポイント消費処理統合
- [ ] オーディション作成・編集ページ修正
  - [ ] ポイント設定セクション追加（オプション展開）
    - [ ] 閲覧単価の個別設定（チェックボックス + 入力欄）
    - [ ] 無料閲覧枠設定（0 = なし）
    - [ ] 見放題設定（チェックボックス + 上限ポイント）
    - [ ] 完全無料フラグ
    - [ ] ジャンル単価のヒント表示

### 3.4 Admin向けUI
- [ ] `apps/web/src/app/admin/points/page.tsx` - 統計・アカウント一覧
- [ ] `apps/web/src/app/admin/points/accounts/[id]/page.tsx` - 詳細
- [ ] `apps/web/src/app/admin/points/plans/page.tsx` - プラン管理
- [ ] `apps/web/src/app/admin/points/settings/page.tsx` - 設定
- [ ] `apps/web/src/app/admin/points/genre-costs/page.tsx` - ジャンル別単価管理
- [ ] `apps/web/src/app/admin/points/_components/` 作成
  - [ ] `AccountList.tsx`
  - [ ] `TransactionHistory.tsx`
  - [ ] `PointGrantModal.tsx`
  - [ ] `PlanEditor.tsx`
  - [ ] `DefaultCostSettings.tsx`
  - [ ] `GenreCostEditor.tsx` - ジャンル別単価編集テーブル

### 3.5 ナビゲーション統合
- [ ] Admin サイドバーに「ポイント管理」メニュー追加
- [ ] 主催者 ヘッダーにポイント残高バッジ追加

---

## Phase 4: Stripe連携テスト（目安: 2日）

### 4.1 Stripe設定
- [ ] Stripe Dashboardでプラン作成
- [ ] Product & Price ID取得
- [ ] `points_plans` テーブルに登録
- [ ] Webhook URL設定（`/api/v1/webhook/stripe`）
- [ ] Webhook署名シークレット取得

### 4.2 決済フローテスト
- [ ] テスト購入フロー実行
- [ ] Checkout遷移確認
- [ ] Webhook受信確認
- [ ] ポイント付与確認
- [ ] 取引履歴記録確認

---

## Phase 5: 閲覧課金テスト（目安: 1日）

- [ ] 閲覧可否チェックテスト
- [ ] ポイント消費テスト
- [ ] 残高不足時の挙動確認
- [ ] 重複閲覧時の挙動確認（消費なし）
- [ ] 見放題設定時の挙動確認

---

## Phase 6: Admin機能テスト（目安: 1日）

- [ ] 全アカウント一覧表示確認
- [ ] 手動付与/減算テスト
- [ ] プラン作成/編集/削除テスト
- [ ] デフォルト単価設定テスト
- [ ] 権限チェック（RLS）テスト

---

## Phase 7: 統合テスト・ドキュメント（目安: 2日）

### 7.1 統合テスト
- [ ] エンドツーエンドテスト
  - [ ] 購入 → 閲覧 → 消費フロー
  - [ ] 残高不足時のフロー
  - [ ] Admin操作フロー
- [ ] パフォーマンステスト
- [ ] セキュリティテスト

### 7.2 ドキュメント整備
- [ ] `docs/API.md` にポイントAPI追加
- [ ] `README.md` にポイント機能セクション追加
- [ ] 運用ガイド作成
- [ ] トラブルシューティングガイド作成

---

## Phase 2.5: ポイントルール管理（拡張機能・任意）

### 2.5.1 データ基盤
- [ ] `points_rules` テーブル作成
- [ ] `points_rule_executions` テーブル作成
- [ ] `points_transactions.expires_at` 追加
- [ ] 有効残高計算関数（SQL Function）

### 2.5.2 Workers Cron Handler
- [ ] `apps/workers/src/cron/points-rules.ts` 実装
- [ ] Cron式パーサー実装
- [ ] 対象ユーザー取得ロジック
- [ ] ポイント付与実行ロジック
- [ ] 実行履歴記録
- [ ] wrangler.toml にCron設定追加

### 2.5.3 Admin API
- [ ] GET `/api/v1/admin/points/rules` - ルール一覧
- [ ] POST `/api/v1/admin/points/rules` - ルール作成
- [ ] PATCH `/api/v1/admin/points/rules/:id` - ルール更新
- [ ] DELETE `/api/v1/admin/points/rules/:id` - ルール削除
- [ ] GET `/api/v1/admin/points/rules/:id/executions` - 実行履歴

### 2.5.4 Admin UI
- [ ] `/admin/points/rules` ページ作成
- [ ] ルール一覧表示
- [ ] ルール作成・編集フォーム
- [ ] Cron式ビルダーコンポーネント
- [ ] 実行履歴表示
- [ ] テスト実行機能

---

## Phase 8: 将来拡張（キャスト向けポイント）

**注意**: Phase 1実装時に `user_id` 設計にしておけば、将来スムーズに拡張可能

### 8.1 データ基盤拡張
- [ ] `points_accounts.account_type` で 'talent' サポート
- [ ] `withdrawal_requests` テーブル作成
- [ ] `bank_accounts` テーブル作成
- [ ] `platform_revenue` テーブル作成
- [ ] transaction_type 拡張（'audition_reward', 'tip_received', etc.）

### 8.2 Workers API（キャスト向け）
- [ ] GET `/api/v1/talent/points/balance`
- [ ] GET `/api/v1/talent/points/transactions`
- [ ] POST `/api/v1/talent/points/withdraw`
- [ ] POST `/api/v1/talent/points/bank-accounts`
- [ ] POST `/api/v1/talent/tip` - 投げ銭
- [ ] GET `/api/v1/talent/tips/received`

### 8.3 Workers API（Admin）
- [ ] GET `/api/v1/admin/points/withdrawals`
- [ ] PATCH `/api/v1/admin/points/withdrawals/:id` - 承認/却下
- [ ] GET `/api/v1/admin/points/revenue` - プラットフォーム収益

### 8.4 LIFF UI（キャスト向け）
- [ ] `/liff/points/page.tsx` - 残高・履歴
- [ ] `/liff/points/withdraw/page.tsx` - 出金申請
- [ ] `/liff/points/bank-accounts/page.tsx` - 銀行口座管理

### 8.5 Admin UI（出金管理）
- [ ] `/admin/points/withdrawals/page.tsx` - 出金申請一覧
- [ ] `/admin/points/withdrawals/[id]/page.tsx` - 承認画面

---

## 実装順序（推奨）

1. **Phase 1**: DBマイグレーション（2日）
2. **Phase 2.1-2.2**: 主催者向けAPI（2日）
3. **Phase 2.3**: Webhook（1日）
4. **Phase 3.1-3.2**: 主催者向けUI（2日）
5. **Phase 4**: Stripe連携テスト（2日）
6. **Phase 3.3**: 応募者閲覧課金UI（1日）
7. **Phase 5**: 閲覧課金テスト（1日）
8. **Phase 2.4**: Admin向けAPI（1日）
9. **Phase 3.4**: Admin向けUI（2日）
10. **Phase 6**: Admin機能テスト（1日）
11. **Phase 7**: 統合テスト・ドキュメント（2日）

**合計**: 約15日（3週間）
