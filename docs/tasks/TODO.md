# TODOリスト

## 🎯 現在の最優先タスク
**Phase 1.5: LINEアプリ内での動作確認**
- LINEアプリで実際にミニアプリを開いて認証フローを確認
- 詳細は下記Phase 1.5参照

## 作業方針
LINEミニアプリ（LIFF）の認証・ユーザーフロー実装に集中。
デザインシステムは必要に応じてv0で追加。

## デザインシステム ✅ 完了
- Tailwind CSS v4 + shadcn/ui 導入完了
- v0統合ガイドライン作成完了
- 詳細: `docs/design/DESIGN_SYSTEM.md`, `docs/design/V0_INTEGRATION_GUIDE.md`

---
## LINEミニアプリ（LIFF）実装タスク

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

### Phase 1.5: LINEアプリ内動作確認（優先度: 最高）🔥

#### 完了済み ✅
- デバッグ用ログ追加完了
- Cookie設定改善完了
- 環境変数設定完了
- ブラウザでの動作確認完了
- **LINE認証API実装完了** (`POST /api/v1/auth/line/verify`)
- **セッション管理API実装完了** (`GET /api/v1/auth/session`, `POST /api/v1/auth/logout`)
- **ユーザー自動登録ロジック実装完了** (UPSERTによる初回登録・更新対応)
- **詳細ドキュメント作成完了** (`docs/tasks/LINE_AUTH_IMPLEMENTATION.md`)

#### 次のステップ（デプロイ・動作確認）

**🚨 重要**: 環境変数が未設定のため、現状では認証APIは動作しません。

##### ステップ1: ローカル環境変数設定
- [ ] **`.dev.vars` ファイルを編集**
  - ファイルパス: `apps/workers/.dev.vars`
  - 必須: `JWT_SECRET`, `LINE_CHANNEL_ID`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
  - 詳細手順: `docs/setup/WORKERS_AUTH_SETUP.md`

##### ステップ2: 型チェック
- [ ] **Workersの型チェック**
  - `cd apps/workers && npm run type-check`
  - エラーがないことを確認

##### ステップ3: 本番環境変数設定
- [ ] **Cloudflare Secretsに設定**
  ```bash
  cd apps/workers
  wrangler secret put JWT_SECRET --env development
  wrangler secret put SUPABASE_URL --env development
  wrangler secret put SUPABASE_SERVICE_ROLE_KEY --env development
  wrangler secret put LINE_CHANNEL_ID --env development
  wrangler secret put ALLOWED_ORIGINS --env development
  ```

##### ステップ4: デプロイ
- [ ] **Workersデプロイ（dev環境）**
  - `cd apps/workers && npm run deploy:dev`
  - デプロイ先: `https://casto.sb2024.xyz/api/*`

##### ステップ5: 動作確認
- [ ] **LINEアプリ内での動作確認**
  - LINEアプリで`https://miniapp.line.me/2008009031-ZdQbY5YW`を開く
  - 自動LINE認証の動作確認
  - Workers APIへのIDトークン送信確認
  - セッション作成の確認
  - DBにユーザーが登録されたか確認
- [ ] **E2Eフロー確認**
  - 未登録ユーザー → LIFF起動 → 自動登録 → セッション確立
  - 登録済みユーザー → LIFF起動 → セッション復元

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

### Phase 4: エラーハンドリング・UX改善（優先度: 中）

#### 4-1. エラーハンドリングの強化
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
