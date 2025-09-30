# TODOリスト

## 現在の作業の目的
docsディレクトリの情報整理を行い、重複を排除して管理しやすい構造にする。

## 現在の作業項目

- 現在進行中のタスクはありません（必要に応じて追加してください）

---
## LINEミニアプリ（LIFF）認証・ユーザーフロー実装

### 設計方針（確定事項）
- [x] LINE認証必須（middleware.tsの`allowPublic`設定）
- [x] 全LINEユーザーの即座本アカウント登録（既存実装のまま維持）
- [x] 直接アクセス方式: SNS/LP → `/liff/auditions/123` → 認証 → そのまま表示

### Phase 1: 基本フロー・認証基盤（優先度: 高）✅ 完了

#### 1-1. 共通認証フックの実装 ✅
- [x] `apps/web/src/hooks/useLiffAuth.ts` 作成
  - LIFF SDK自動読み込み・初期化
  - 認証状態管理（isLoading, isLiffReady, user）
  - エラーハンドリング
  - 既存の`useAuth`フックとの統合

#### 1-2. トップページ（ホーム画面）の実装 ✅
- [x] `apps/web/src/app/liff/page.tsx` をホーム画面に変更
  - 最近見たオーディション表示（localStorage）
  - 人気のオーディション一覧
  - カテゴリグリッド
  - デバッグ情報（開発環境のみ）

#### 1-3. オーディション詳細ページ ✅
- [x] `apps/web/src/app/liff/auditions/[id]/page.tsx` 実装
  - `useLiffAuth`フックで認証チェック
  - オーディション情報取得API連携
  - 存在しないIDの場合は `/liff/` にリダイレクト
  - 閲覧履歴の記録（localStorage + DB非同期保存）

#### 1-4. プロフィール完了状態の判定 ✅
- [x] Workers API: `GET /api/v1/users/me/profile-status` 実装
  - `applicant_profiles`テーブルベースに変更
  - プロフィール完了判定ロジック
  - 未入力項目のリスト返却
  - 完了率の計算
- [x] Workers API: `POST /api/v1/users/me/history` 実装
  - `viewing_history`テーブルへUPSERT
- [x] Workers API: `GET /api/v1/users/me/recent-auditions` 実装
  - `viewing_history`から最近見たオーディション取得（上位10件）
  - 必須項目: `nickname`, `birthdate`
  - 任意項目: `gender`, `prefecture`, `bio`, `avatar_url`
  - RLS有効化（自分のプロフィールのみ閲覧・編集可能）
- [x] `viewing_history` テーブル作成（マイグレーション）
  - ユーザーのオーディション閲覧履歴を記録
  - UPSERT対応（同じユーザー×オーディションは最新のみ保持）

### Phase 1.5: ローカル開発環境の整備（優先度: 高）🚨

#### 1.5-1. LINEミニアプリのローカル動作確認環境構築
- [ ] ローカル環境でのLIFF動作確認手順の確立
  - **問題**: `https://casto.sb2024.xyz/liff` で401エラー発生
    - エラー詳細: `casto-workers-dev.casto-api.workers.dev/api/v1/auth/session` が401を返す
  - デバッグ用のログ追加・確認
  - LIFF SDK初期化とAPI認証の整合性確認
  - ローカル環境でのLINE認証フローのテスト手順作成
  - `.dev.vars` の設定項目の確認・ドキュメント化
  - 開発者向けセットアップガイドの更新
- [ ] 開発環境のエラーハンドリング改善
  - 401エラー時の詳細なログ出力
  - 認証失敗時のユーザーフレンドリーなエラー表示
  - デバッグモード時の詳細情報表示

### Phase 2: プロフィール機能（優先度: 高）

#### 2-1. プロフィール作成ページ
- [ ] `apps/web/src/app/liff/profile/new/page.tsx` 実装
  - プログレスバー表示
  - バリデーション（クライアント＋サーバー）
  - 完了後のリダイレクト処理（`?return=` パラメータ対応）

#### 2-2. プロフィール編集ページ
- [ ] `apps/web/src/app/liff/profile/edit/page.tsx` 実装
  - 既存情報の読み込み
  - 更新API連携
  - プレビュー機能

#### 2-3. プロフィール促進バナーコンポーネント
- [ ] `apps/web/src/components/ProfileCompletionBanner.tsx` 実装
  - 未完了時のみ表示
  - 「今すぐ作成」「後で」ボタン
  - 閉じた状態の記憶（localStorage）

#### 2-4. 応募ページでのプロフィール必須チェック
- [ ] `apps/web/src/app/liff/auditions/[id]/apply/page.tsx` 実装
  - プロフィール未完了時は強制的に `/liff/profile/new` へ
  - 完了後は元の応募ページに戻る
  - 応募フォームの実装

### Phase 3: セッション管理の改善（優先度: 中）

#### 3-1. JWT有効期限の設定
- [ ] Workers側でJWT expiration設定（例: 7日間）
- [ ] Cookie設定の最適化（HttpOnly, Secure, SameSite）

#### 3-2. セッション自動更新機能
- [ ] フロントエンド: セッション期限前の自動リフレッシュ
  - 期限の80%経過時点で自動更新
  - バックグラウンドでの無音更新
- [ ] Workers: セッション更新API
  - `POST /api/v1/auth/refresh` エンドポイント
  - 既存トークンの検証＋新規トークン発行

### Phase 4: 履歴・補助機能（優先度: 中）

#### 4-1. 閲覧履歴機能
- [ ] Workers API: `POST /api/v1/users/me/history` 実装
  - 閲覧履歴のDB保存
  - `viewing_history` テーブル作成（マイグレーション）
- [ ] Workers API: `GET /api/v1/users/me/recent-auditions` 実装
  - 最近見たオーディションの取得（上位10件）
- [ ] フロントエンド: ハイブリッド方式の実装
  - localStorage優先で即時表示
  - DB非同期保存でデバイス跨ぎ対応

#### 4-2. エラーハンドリングの強化
- [ ] オーディション不存在時のリダイレクト処理
  - 404時に `/liff/` へ自動リダイレクト
  - ユーザーフレンドリーなエラーメッセージ
- [ ] ネットワークエラー時のリトライ機構
- [ ] LIFF SDK読み込み失敗時のフォールバック

### Phase 5: セキュリティ・最適化（優先度: 低）

#### 5-1. セキュリティ強化
- [ ] CSRF対策の実装
- [ ] Turnstile（BOT対策）の導入検討
- [ ] レート制限の実装（Workers側）

#### 5-2. パフォーマンス最適化
- [ ] オーディション情報のキャッシュ戦略
- [ ] 画像の最適化（Next.js Image対応）
- [ ] 初回読み込み速度の改善

---
## 最終タスク
- [ ] docs内のファイル更新（ドキュメント整備・更新）
