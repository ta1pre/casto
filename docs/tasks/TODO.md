# TODO リスト

## ✅ Phase 1: LINE認証実装（完了）

### 成果
- LINEミニアプリからのユーザー自動登録が完全動作
- ユーザーID: `f851e129-85c6-45e3-a4d2-e8e9d446aac2` で確認済み

### 実装内容
- Workers: LINE認証API (`/api/v1/auth/line/verify`)
- フロントエンド: LIFF連携（`useLiffAuth`, `AuthProvider`）
- デプロイ: GitHub Actions自動化
- 環境変数: Cloudflare Secrets設定完了

---

## 🚀 Phase 2: タレント・モデルプロフィール機能（現在）

### 目的
タレント・モデルがオーディション応募時に使用するプロフィール情報の登録・管理機能を実装する。

### 実装内容

#### データベース（Supabase）
- [ ] `talent_profiles` テーブル作成マイグレーション
  - **基本情報**: user_id (FK), stage_name, real_name, gender, birthdate, prefecture, bio
  - **体型情報**: height, weight, bust, waist, hip, shoe_size
  - **活動情報**: activity_areas (TEXT[]), can_move, can_stay, passport_status
  - **仕事情報**: job_types (TEXT[]), affiliation_type, work_request_type, agency
  - **SNS情報**: sns_twitter, sns_instagram, sns_tiktok, sns_youtube, total_followers
  - **画像情報**: profile_image_url, portfolio_images (JSONB)
  - **完成度情報**: completion_percentage, completion_details (JSONB), is_complete
  - **システム**: created_at, updated_at

#### Workers API (`apps/workers/src/features/liff/profile/`)
- [ ] `service.ts` - プロフィールCRUDロジック
  - `getTalentProfile(userId)` - プロフィール取得
  - `createTalentProfile(userId, data)` - 新規作成
  - `updateTalentProfile(userId, data)` - 更新
  - `deleteTalentProfile(userId)` - 削除
  - `getProfileStatus(userId)` - 完成度チェック
- [ ] `routes.ts` - APIエンドポイント
  - `GET /api/v1/liff/profile` - 自分のプロフィール取得
  - `POST /api/v1/liff/profile` - プロフィール新規作成
  - `PUT /api/v1/liff/profile` - プロフィール更新
  - `PATCH /api/v1/liff/profile` - プロフィール部分更新
  - `GET /api/v1/liff/profile/status` - 完成度チェック
- [ ] `types.ts` - 型定義
- [ ] `app.ts` にルート追加

#### フロントエンド（LIFF: `apps/web/src/app/liff/profile/`）
- [ ] `profile/page.tsx` - プロフィール表示・編集ページ（完成度表示含む）
- [ ] `profile/new/page.tsx` - 新規作成フォーム（ステップ式）
- [ ] `profile/_components/ProfileForm.tsx` - フォームコンポーネント
- [ ] `profile/_components/ProfilePreview.tsx` - プレビュー表示
- [ ] `profile/_components/SkillsInput.tsx` - スキル入力UI
- [ ] `profile/_components/SNSLinksInput.tsx` - SNSリンク入力UI
- [ ] `profile/_components/ImageUploadSection.tsx` - 画像アップロード画面（ブランク・UI のみ）
- [ ] `profile/_components/PortfolioImagesList.tsx` - ポートフォリオ画像一覧表示
- [ ] `profile/_components/CompletionIndicator.tsx` - 完成度インジケーター

#### Cloudflare R2（画像保存・後日実装）
- [ ] R2バケット作成（`casto-profiles`）
- [ ] wrangler.toml に R2 binding 追加
- [ ] Workers API: 画像アップロードエンドポイント実装
  - `POST /api/v1/liff/profile/upload-image` - プロフィール画像
  - `POST /api/v1/liff/profile/upload-portfolio` - ポートフォリオ画像
  - `DELETE /api/v1/liff/profile/image/:key` - 画像削除

#### 統合・テスト
- [ ] プロフィール未完成時の応募制限実装
- [ ] プロフィール完成促進バナー実装（`/liff` トップページ）
- [ ] 完成度計算ロジックの動作確認
- [ ] LIFF環境での動作確認
- [ ] エラーハンドリング確認

### 成功基準
- タレントがLIFFからプロフィールを作成・編集できる
- プロフィール完成度が正しく判定される（パーセンテージ表示）
- 画像アップロード画面が表示される（実際のアップロードは未実装でOK）
- プロフィール未完成時はオーディション応募ができない
- 全APIがWorkers経由でSupabaseにアクセスできる

### Phase 2の範囲外（後日実装）
- Cloudflare R2への実際の画像アップロード機能
- 画像の削除・並び替え機能
- 画像の圧縮・リサイズ処理

---

## 📋 Phase 3: オーディション・応募機能（未着手）

詳細は後日設計。

---

## 📝 参考ドキュメント

- [アーキテクチャ](../ARCHITECTURE.md)
- [開発ルール](../DEVELOPMENT_RULES.md)
- [重要ルール](../CRITICAL_RULES.md)
- [LINE認証実装詳細](./LINE_AUTH_IMPLEMENTATION.md)
