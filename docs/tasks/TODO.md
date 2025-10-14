# TODO - Casto開発タスク

## 🔄 進行中

### フロントエンド・バックエンド構成の整理と管理者認証基盤
- **目的**: 役割別（運営・主催者・タレント）のディレクトリ構成を整備し、管理者認証を実装
- **作業中**: 構成案の策定とタスク分解完了
- **参照**: `docs/tasks/DIRECTORY_STRUCTURE.md`
- **重要**: 既存のLIFF機能には一切影響しません。新規機能の追加のみです。

## ✅ 完了

### セッション管理の改善（2025-10-05完了）
- **問題**: 長時間放置後に401エラーと無限ループが発生
- **原因**: JWTクッキーが24時間で期限切れ、セッション延長機能なし
- **解決策**:
  - ✅ `/api/v1/auth/session`でクッキー自動延長機能を実装
  - ✅ `AuthProvider`に20分ごとの定期セッションリフレッシュを追加
  - ✅ LINEトークンリフレッシュ時にJWTクッキーも更新
- **効果**: アクティブユーザーのセッションが自動的に延長され、無限ループを防止

### LIFFページのクリーンアップ（2025-10-05完了）
- **目的**: `apps/web/src/app/liff/page.tsx`をシンプル化
- **結果**: **350行→121行に削減成功**（65%削減）
- **作業内容**:
  - ✅ デバッグパネルUIを削除（本番環境では不要）
  - ✅ メインページをクリーンなビジネスロジックのみに整理
  - ✅ 開発時のデバッグ機能は`useLiffAuth`フック内部に保持

### LINE認証（LIFF）実装
- LINEミニアプリ認証フロー実装完了
- プロフィール完成度表示機能実装

### CI/CDパイプライン
- GitHub ActionsでNode.js v20対応完了
- Wrangler 4.x系デプロイ環境構築完了

## 📋 今後の予定

### Phase 1: データベース・認証基盤の整備（既存機能に影響なし）
- [x] rolesテーブル作成（admin, organizer, talent, fan）
- [x] user_rolesテーブル作成（多対多の中間テーブル）
- [x] packages/shared: ロール関連の型・ユーティリティ追加
- [x] Workers: 認証ミドルウェア作成（verifyAdminAuth, verifyOrganizerAuth等）
- [x] Workers: 管理者認証API実装（`features/admin/auth/`）
- [x] Workers: 主催者認証API実装（`features/organizer/auth/`）
- [x] Workers: app.tsにルーティング追加
- [x] マイグレーションファイル作成（`migrations/20251014_172328_add_roles_and_user_roles.sql`）
- [x] マイグレーション適用完了（Supabase MCPで適用済み）
- [x] Workers: パスワードリセットAPI実装（`/api/v1/admin/auth/reset-password`等）
- [x] フロントエンド: パスワードリセット機能完全実装
- [ ] Supabase Authのメール認証設定確認（Dashboard確認）
- [ ] Workers: ロール切替API実装（`/api/v1/auth/switch-role`・オプション）

### Phase 2: フロントエンド構成の整備（既存機能に影響なし）
- [x] 管理者ログインUI（`admin/login/page.tsx`）
- [x] 主催者ログインUI（`organizer/login/page.tsx`）
- [x] 共通ログインフォームコンポーネント（`admin/_components/LoginForm.tsx`）
- [x] 新規アカウント作成UI（`admin/signup/page.tsx`, `organizer/signup/page.tsx`）
- [x] パスワードリセットUI（`admin/forgot-password/page.tsx`, `organizer/forgot-password/page.tsx`）
- [x] 共通レイアウト実装（`admin/layout.tsx`, `organizer/layout.tsx`）
- [x] useAdminAuth, useOrganizerAuth フック実装（認証ガード付き）
- [x] ダッシュボードページ作成（admin/dashboard, organizer/dashboard）
- [x] Next.js 15対応（useSearchParams Suspense対応）

### Phase 3: オーディション機能（既存機能に影響なし）
- [ ] auditionsテーブル作成
- [ ] applicationsテーブル作成
- [ ] 主催者: オーディションCRUD API
- [ ] 主催者: オーディション管理UI
- [ ] タレント: オーディション一覧・詳細・応募UI

### Phase 4: クラウドファンディング機能
- [ ] campaignsテーブル設計
- [ ] 主催者: クラファン管理UI
- [ ] 公開: クラファン一覧・詳細ページ

### Phase 5: メディアアップロード機能
- [ ] Supabase Storage設定
- [ ] アップロードAPI実装
- [ ] プロフィール写真・動画統合

### Phase 6: ディレクトリリファクタリング（最後に実施・慎重に）
- [ ] `(public)/`グループ作成
- [ ] インポートパス修正
- [ ] 動作確認

---

## 📂 関連ドキュメント
- [ディレクトリ構成詳細](./DIRECTORY_STRUCTURE.md)
- [アーキテクチャ](../ARCHITECTURE.md)

---

**最終更新**: 2025-10-14