# TODOリスト
## 現在の作業の目的
docsディレクトリの情報整理を行い、重複を排除して管理しやすい構造にする。

## 現在の作業項目

### 🎨 デザインシステム移行（優先度: 最高）

#### Step 1: 現状調査・MUI削除 ✅
- [x] 現在のMUI使用箇所の洗い出し
  - `apps/web/src` 配下の全コンポーネント調査
  - `package.json` のMUI関連依存関係リスト化
  - 結果: テストページ2ファイルのみで使用
- [x] MUI関連パッケージの完全削除
  - `@mui/material`, `@emotion/react`, `@emotion/styled` 削除完了
  - `package.json`, `package-lock.json` から削除

#### Step 2: Tailwind CSS + shadcn/ui セットアップ ✅
- [x] Tailwind CSS導入
  - `tailwind.config.ts` 設定完了
  - `postcss.config.mjs` 設定完了
  - グローバルCSS設定（`app/globals.css`）完了
- [x] shadcn/ui初期設定
  - `components.json` 設定完了
  - `lib/utils.ts` 作成完了
  - カラーパレット・テーマ設定完了
- [x] 依存関係インストール
  - tailwindcss, postcss, autoprefixer
  - class-variance-authority, clsx, tailwind-merge, lucide-react
  - tailwindcss-animate
- [x] v0連携の準備
  - デザイントークン定義完了
  - コンポーネント命名規則策定

#### Step 3: デザインシステム・トンマナ定義 ✅
- [x] デザイントークンの策定
  - カラーパレット（Primary, Secondary, Accent, Neutral, Semantic）
  - タイポグラフィ（フォントサイズ、行間、ウェイト）
  - スペーシング（余白の基準値）
  - ブレークポイント（レスポンシブ対応）
  - シャドウ・ボーダー・角丸
- [x] トンマナルール文書作成
  - `docs/design/DESIGN_SYSTEM.md` 作成完了
  - コンポーネント使用ガイドライン
  - アクセシビリティ基準
  - アニメーション・インタラクション指針
  - v0連携ガイド
- [ ] Figma/デザインツール連携（オプション）

#### Step 4: 基本コンポーネント実装・テスト 🔄
- [x] shadcn/uiコンポーネントのインストール（実行中）
  - Button, Input, Card, Alert, Label
- [ ] 追加コンポーネントのインストール
  - Dialog, Select, Dropdown, Tabs, etc.
- [ ] カスタムコンポーネントの作成
  - 共通レイアウトコンポーネント
  - ナビゲーション・ヘッダー・フッター
- [x] テストページの実装
  - `apps/web/src/app/design-test/page.tsx` 作成完了
  - 全コンポーネントのショーケース
  - レスポンシブ動作確認
  - カラーパレット・タイポグラフィ表示

#### Step 5: 既存ページの段階的移行 🔄
- [x] テストページの移行完了
  - `/apps/web/src/app/test/page.tsx` 完全移行
  - `/apps/web/src/app/test/page-simple.tsx` 削除
  - MUI → Tailwind + shadcn/ui 完全置き換え
- [ ] 優先度付け・移行計画策定
  - LIFFページ（`/liff/*`）を最優先
  - 管理画面（`/admin/*`, `/host/*`）は後回し
- [ ] LIFFページの移行
  - `/liff/page.tsx` (ホーム画面)
  - `/liff/auditions/[id]/page.tsx` (オーディション詳細)
  - プロフィール関連ページ（未実装）
- [ ] 動作確認・デザインQA
  - Docker環境での動作確認（`/Users/taichiumeki/dev/`）
  - 各ページのビジュアル確認
  - インタラクション動作確認
  - レスポンシブ確認

#### Step 6: 最終調整・ドキュメント整備
- [ ] パフォーマンス最適化
  - 未使用CSSの削除（PurgeCSS）
  - バンドルサイズ確認
- [ ] ドキュメント更新
  - README更新（デザインシステム導入の記載）
  - コンポーネントカタログ作成
  - 開発者向けガイド更新
- [ ] レビュー・承認

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

### Phase 1.5: ローカル開発環境の整備（優先度: 高）🚨 ⏸️ ペンディング

#### 1.5-1. LINEミニアプリのローカル動作確認環境構築
- [x] デバッグ用のログ追加・確認
  - `apps/web/src/providers/AuthProvider.tsx` にログ追加
  - `apps/web/src/hooks/useLiffAuth.ts` にログ追加
  - `apps/workers/src/index.ts` のセッション/認証エンドポイントにログ追加
- [x] Cookie設定の改善
  - `apps/workers/src/lib/auth.ts` で`SameSite`/`Secure`設定を環境に応じて動的に変更
- [x] 環境変数の設定完了
  - `/Users/taichiumeki/dev/.env` に開発用LINE設定追加
  - `docker-compose.yml` に`NEXT_PUBLIC_LINE_LIFF_ID`追加
  - Cloudflare Workers Secrets（開発環境）設定完了
- [x] LINE Developers Console設定確認
  - 開発用LIFF ID: `2008009031-ZdQbY5YW`
  - エンドポイントURL: `https://casto.sb2024.xyz/liff`
  - チャネルID: `2008009031`
  - チャネルシークレット: `92f007e2d0c35479434aa4e7b4935f45`
- [x] ブラウザでの動作確認
  - LIFF SDK正常に初期化
  - `liff.init`成功
  - ブラウザからのアクセスで`Is logged in to LINE: false`（正常）
  - 401エラー（セッションなしのため正常）
- [ ] **⏸️ ペンディング**: LINEアプリ内での動作確認
  - LINEアプリで`https://miniapp.line.me/2008009031-ZdQbY5YW`を開く
  - 自動LINE認証の動作確認
  - Workers APIへのIDトークン送信確認
  - セッション作成の確認
- [ ] 開発環境のエラーハンドリング改善
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
