# TODO

## Adminダッシュボード刷新計画（2025-10-20策定完了）

**詳細計画書**: `docs/tasks/ADMIN_DASHBOARD_RENOVATION_PLAN.md`

---

## Phase 1: 基盤整備とダッシュボード刷新 ⭐⭐⭐（優先度最高）✅ **完了**

### 1.1 共通コンポーネント作成
- [x] `StatCard.tsx` - 統計カード共通コンポーネント
- [x] `Navigation.tsx` - サイドバーナビゲーション
- [x] `QuickAction.tsx` - クイックアクション共通コンポーネント

### 1.2 Workers API実装
- [x] `GET /api/v1/admin/stats/overview` - ダッシュボード統計値
- [x] `GET /api/v1/admin/stats/recent-activities` - 最新アクティビティ

### 1.3 ダッシュボードUI刷新
- [x] `useAdminStats.tsx` フック作成
- [x] `dashboard/page.tsx` リファクタリング（実データ表示）
- [x] `OverviewCards.tsx` KPIカード群実装
- [x] `RecentActivity.tsx` 最新アクティビティ実装
- [x] `admin/layout.tsx` サイドバーナビゲーション統合

---

## Phase 2: メッセージング機能拡張 ⭐⭐⭐（優先度高）✅ **完了**

### 2.1 LINEセクション拡張
- [x] `LineMessageComposer.tsx` - 個別送信フォーム作成
- [x] `SegmentSelector.tsx` - セグメント選択UI作成
- [ ] `POST /api/v1/admin/messaging/line/individual` - LINE個別送信API（要実装）
- [ ] `POST /api/v1/admin/messaging/line/segment` - セグメント別配信API（要実装）
- [ ] `GET /api/v1/admin/messaging/templates` - テンプレート取得API（将来実装）

### 2.2 メールセクション新設
- [x] `EmailMessageComposer.tsx` - メール送信フォーム作成
- [ ] `POST /api/v1/admin/messaging/email/send` - メール送信API（要実装・AWS SES連携）
- [ ] メッセージテンプレート定義拡張（将来実装）
- [ ] 送信履歴にメール送信履歴を追加（将来実装）

### 2.3 UI改善
- [x] `messaging/page.tsx` タブ切り替えUI追加（LINE/メール）
- [ ] ユーザー一覧にチェックボックス追加（将来実装）

---

## Phase 3: 案件一覧ページ新設 ⭐⭐（優先度中）✅ **完了**

### 3.1 コンポーネント作成
- [x] オーディション一覧テーブル（`auditions/page.tsx`に統合）
- [x] フィルタUI（ステータス）
- [x] 検索バー
- [x] ステータスバッジ

### 3.2 Workers API実装
- [x] `GET /api/v1/admin/auditions` - 一覧取得（ページネーション、フィルタ、検索）
- [x] `GET /api/v1/admin/auditions/:id` - 詳細取得
- [ ] `PATCH /api/v1/admin/auditions/:id/status` - ステータス一括変更（将来実装）

### 3.3 ページ作成
- [x] `auditions/page.tsx` - 一覧ページ作成
- [ ] ページネーションコンポーネント作成（将来実装）

---

## 共通改善事項

### ナビゲーション・共通UI
- [x] サイドバーナビゲーション実装（全ページ共通）
- [x] 共通コンポーネント整理（`apps/web/src/app/admin/_components/`）

### DB・マイグレーション
- [ ] `messaging_logs` テーブルにchannel列追加（LINE/メール識別用）
- [ ] オーディション検索用インデックス追加

### ドキュメント更新
- [ ] `docs/API.md` - 新規APIエンドポイント追加
- [ ] `docs/COMPONENTS.md` - 共通コンポーネント一覧作成
- [ ] `README.md` - Admin機能セクション追加

---

## 実装順序（推奨）

1. Phase 1-1: 共通コンポーネント作成
2. Phase 1-2: Workers API実装
3. Phase 1-3: ダッシュボードUI刷新
4. Phase 2-1: LINE個別送信機能
5. Phase 2-2: メール送信機能
6. Phase 3-1: オーディション一覧ページ基本実装
7. Phase 3-2: フィルタ・検索機能追加
