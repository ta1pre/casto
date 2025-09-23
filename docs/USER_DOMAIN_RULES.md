# ユーザー・権限・ドメイン整理ルール

本ドキュメントは、casto の「身元・権限（Identity）」と各ビジネス機能ドメインの責務分離、およびCloudflare Workers/Supabase前提でのディレクトリ構成・データモデルの指針をまとめたものです。ARCHITECTURE.md / SPEC.md と整合します。（実装ガイドではなく合意形成用）

---

## 1. 基本方針
- ユーザー情報・権限管理は共通ドメイン `identity` に集約する（唯一の“身元”の出入口）。
- ビジネス機能（例: auditions, entries, billing, notifications）は“機能ごと”に独立したドメインに配置し、`identity` を参照して権限判定する。
- 共通機能（認証・認可・プロフィール・スコープ判定）は横断的に再利用する。

---

## 2. ディレクトリ構成（Workers中心の例）

```
apps/workers/
  src/
    routes/
      api/v1/
        identity/                 # ← 身元・権限“だけ”の入口
          me.ts                   # GET  /api/v1/identity/me
          roles.ts                # GET  /api/v1/identity/roles
          assign-role.ts          # POST /api/v1/identity/assign-role
          line/
            liff-login.ts         # POST /api/v1/identity/line/liff-login
        auditions/                # 機能の入口（応募/主催関連）
        entries/
        billing/
        notifications/
      webhooks/
        line.ts                   # 署名検証→domainへ（必要ならQueuesへ）

    middleware/
      auth.ts                     # JWT検証（user_id, roles, permissions）
      scope.ts                    # organizer_id/audition_id 等の所有チェック

    domain/
      identity/                   # ← users/roles を“唯一”で操作する層
        getMe.ts
        listRoles.ts
        assignRole.ts
      auditions/
      entries/
      billing/
      notifications/

    services/
      db/
        users.ts                  # users 読み書き（Identityオーナー）
        roles.ts                  # roles/user_roles/permissions
        applicantProfiles.ts      # 応募者プロフィール（ドメイン側）
        organizerProfiles.ts      # 主催者プロフィール（ドメイン側）
        views.ts                  # 読み取り専用VIEWの参照
      line/
        client.ts                 # 送信・Push
        verify.ts                 # 署名検証
        templates.ts              # Flexメッセージ等

    schemas/
      identity/
        user.ts                   # users/roles/assign の入出力スキーマ
      auditions/
      entries/

supabase/
  migrations/
    2025xxxx_users.sql
    2025xxxx_roles.sql
    2025xxxx_user_roles.sql
    2025xxxx_permissions.sql
    2025xxxx_role_permissions.sql
    2025xxxx_line_links.sql
    2025xxxx_applicant_profiles.sql
    2025xxxx_organizer_profiles.sql
    2025xxxx_views.sql            # VIEW定義（任意）

packages/shared/
  types.ts                        # 共通DTO（UserDTO, RoleDTO など）
  env.ts                          # 環境変数検証
```

補足:
- 入口（`routes/*`）→ 手順（`domain/*`）→ 道具（`services/*`）→ 検品（`schemas/*`）の流れに統一。
- 重い処理や再試行を要する処理は Cloudflare Queues 経由に逃がす。

---

## 3. データモデル（最小構成の指針）

Supabase(PostgreSQL) を前提とし、Identityは役割（roles）と権限（permissions）を多対多で表現します。LINEログイン/Email（Magic Link）に適合させるため「認証手段」は別テーブルに切り出します。

必須テーブル（例）
- users
  - id (uuid, PK)
  - status (text)
  - token_version (int)
  - flags (jsonb)
  - created_at, updated_at (timestamptz)

- user_handles（＝認証手段/連携）
  - id (uuid, PK)
  - user_id (uuid, FK → users.id)
  - provider (enum: 'line' | 'email')
  - handle (text)                # line_user_id or email
  - verified_at (timestamptz)

- roles
  - id (uuid, PK)
  - name (text unique)           # 'applicant' | 'fan' | 'organizer' | 'manager' | 'admin'

- user_roles
  - user_id (uuid, FK)
  - role_id (uuid, FK)

- permissions
  - id (uuid, PK)
  - name (text unique)           # 'manage_auditions', 'view_reservations' など

- role_permissions
  - role_id (uuid, FK)
  - permission_id (uuid, FK)

プロファイル（用途別の分離例）
- applicant_profiles
  - user_id (uuid, PK/FK)        # 応募者プロフィール
  - display_name, avatar_url, bio, ...

- organizer_profiles
  - user_id (uuid, PK/FK)        # 主催者プロフィール
  - org_name, contact_email, ...

任意/将来拡張
- line_links（LINE固有の連携情報を分離したい場合）
- views（ビュー定義。集約読み取り専用クエリを安定化）
- password_hash（将来パスワード式認証を導入する場合のみ）

注:
- 既存ドキュメントの「単一共通ID＋ロール」方針（SPEC.md/ARCHITECTURE.md）と整合します。
- EmailはMagic Link運用を想定し、`password_hash`は当面不要。

---

## 4. 権限サンプル（Cast / Customer / Organizer / Admin）

役割ごとの主な操作例（permissions へのマッピング例）
- Cast（出演者）
  - プロフィール登録・編集（`edit_self_profile`）
  - 自己紹介動画アップロード（`upload_media_self`）
  - 自分の応募状況の確認（`view_self_entries`）

- Customer（顧客）
  - キャスト検索・閲覧（`browse_casts`）
  - 予約作成・キャンセル（`create_reservation`, `cancel_own_reservation`）
  - 決済・履歴参照（`pay_points`, `view_own_payments`）

- Organizer（主催者）
  - オーディション企画作成（`manage_auditions`）
  - 募集要項設定（`manage_auditions`）
  - 応募者リスト確認（`view_audition_entries`）
  - 合否判定・通知（`decide_results`, `notify_applicants`）

- Admin（管理者）
  - 全ユーザー管理（`admin_users`）
  - 問題投稿/アカウント凍結（`moderate_content`, `suspend_accounts`）
  - 売上レポート・監視（`view_reports`）
  - 権限付与・剥奪（`grant_roles`, `revoke_roles`）

---

## 5. フローと責務（簡易）

- API（入口）: `routes/api/v1/*` がHTTP入口。`schemas/*`で入力検証→`middleware/auth.ts`でJWT検証→`domain/*`の手順へ。
- Webhook（LINE）: `routes/webhooks/line.ts` で署名検証→イベント正規化→必要に応じてQueuesへ→`domain/identity|notifications` などに委譲。
- 権限判定: `middleware/scope.ts` で `organizer_id`/`audition_id` 等の所有・可視性を確認。詳細権限は `roles/permissions` による。
- DBアクセス: 直接クエリは行わず `services/db/*` に集約し、再利用性と冪等性（必要に応じて）を担保。

---

## 6. まとめ
- ドメインは“機能ごとに分離”、ユーザー・権限は `identity` に集約。
- `roles/permissions` により柔軟に拡張し、各機能ドメインは `identity` を参照して権限チェック。
- Supabaseのスキーマは `supabase/migrations/*` で一元管理し、型/DTOは `packages/shared` から共有。

---

## 7. 初期ロールとパーミッション（案）

ロール（roles）
- applicant（応募者）
- fan（ファン）
- organizer（主催者）
- manager（マネージャ/保護者）
- admin（管理者）

パーミッション（permissions）例と割り当て
- edit_self_profile（applicant, fan, manager）
- upload_media_self（applicant）
- view_self_entries（applicant）
- browse_casts（fan）
- create_reservation（fan）
- cancel_own_reservation（fan）
- pay_points（fan）
- view_own_payments（fan）
- manage_auditions（organizer）
- view_audition_entries（organizer）
- decide_results（organizer）
- notify_applicants（organizer）
- admin_users（admin）
- moderate_content（admin）
- suspend_accounts（admin）
- view_reports（admin）
- grant_roles（admin）
- revoke_roles（admin）

注意:
- 実装時は `role_permissions` によりロール→権限の対応を定義。将来の細分化に備えて権限は粒度を細かく維持。

---

## 8. マイグレーション命名規則と運用（Supabase）

命名規則（例）
- `YYYYMMDD-HHMM_<scope>_<action>_<object>.sql`
  - 例: `20250923-1200_identity_create_users.sql`
  - 複数オブジェクトを同時に作る場合でも、極力ファイルを分割（変更追跡性と衝突回避のため）。

基本ポリシー
- 変更はすべて `supabase/migrations/*` に保存。PRでレビュー。
- 可能な限りリバーシブルなDDL（DROPは慎重に）。不可逆な変更はデータ移行手順を同時に記載。
- ステージング→本番の適用順を保証（タイムスタンプ命名＋手順書）。

適用フロー（参考）
1) 開発: ローカルで作成・検証
2) ステージング: 手動適用→アプリ検証
3) 本番: メンテ時間考慮の上で適用（ロールアウト計画とロールバック方針をPRに明記）

---

## 9. Identity API 草案（I/Oのイメージ）

- GET `/api/v1/identity/me`
  - 入力: CookieのJWT
  - 出力: `UserDTO { id, handles[], roles[], permissions[] }`

- GET `/api/v1/identity/roles`
  - 入力: 管理権限（admin）
  - 出力: `RoleDTO[]`

- POST `/api/v1/identity/assign-role`
  - 入力: `{ userId, roleName }`
  - 権限: `grant_roles`（通常adminのみ）
  - 出力: 付与後の `UserDTO`

- POST `/api/v1/identity/line/liff-login`
  - 入力: `{ idToken }`（LINE LIFFから）
  - 出力: `Set-Cookie`（JWT）＋ `UserDTO`

注: ここでのI/Oは“型/契約”の草案であり、実装時は `schemas/identity/*` にZod等で定義し `packages/shared` へ共有。

---

## 10. 情報の流れ（テキスト図）

LIFFログイン（LINE）
1) LIFF → POST `/identity/line/liff-login`（idToken）
2) routes で検品 → domain/identity が `user_handles`/`users` を解決
3) JWT発行 → Set-Cookie → `me` 相当のDTOを返す

応募一覧参照（主催者）
1) Web → GET `/api/v1/auditions/:id/entries`
2) middleware/auth でJWT検証 → middleware/scope で主催者権限と所有確認
3) domain/entries が services/db を呼び出し、結果DTOを返却

LINE Webhook
1) LINE → POST `/webhooks/line`
2) routes/webhooks で署名検証 → イベント正規化
3) 軽い応答は同期返信、重い処理はQueuesへ → domain/notifications 等で処理

---

## 11. Definition of Done（Identity 初期リリース）

- スキーマ: users/user_handles/roles/user_roles/permissions/role_permissions を `migrations` に定義
- 型: `packages/shared/types.ts` にDTOを定義（API契約と一致）
- ルール: 権限一覧と付与ポリシーの表をdocsで管理
- 入口: `routes/api/v1/identity/*` のI/Oをdocsに明記（本書）
- 運用: マイグレーション命名規則・適用手順をdocsに明記（本書）

