# casto: 技術設計書

## 0. スコープ（今回MVP）
- **対象機能**: 応募者の応募～主催者の閲覧・連絡まで（課金閲覧を含むがクラファンは除外）
- **想定ユーザー**:
  - **応募者 / ファン**: LINEのみで利用（LIFF起動＋公式LINE通知）
  - **主催者 / マネージャ**: ブラウザで利用（メールログイン）

---

## 1. 技術の役割分担
- **Next.js (Vercel想定)**: フロントUIのみ
  - ルート: `/liff/*`（応募・投票等、スマホ軽量UI）、`/organizer/*`（主催ダッシュボード）、`/auth/*`
  - DBへ直接アクセスしない。全てWorkers API経由。
- **Cloudflare Workers**: API・認証・Webhookの門番
  - 機能: 共通ID・ロール判定、応募/審査API、課金閲覧API、LINE Webhook受信、署名URL発行（R2直PUT）、通知送信
  - Queues/KVで順序保証・重複排除・短期キャッシュ
- **DB**: PostgreSQL（Neon/Supabase/RDS 等）
  - 参照/更新はWorkersのみ。Nextは触らない。
- **ストレージ**: Cloudflare R2（画像・動画）。アップロードは署名URLでフロント直PUT。
- **公式LINE (Messaging API)＋LIFF**
  - LIFF: 公式LINEのメニュー/Flexから`/liff/*`を起動（応募・結果確認・投票等）
  - Messaging: セグメント通知、AIチャット（Webhook→Workers処理→返信）
- **決済 (閲覧課金)**: Stripe想定（成功/失敗WebhookはWorkersで受信→Queues→DB反映）
- **メール配信**: Resend（Magic Linkや重要通知をWorkers経由で送信、テンプレート管理はResend側）

---

## 2. アカウント設計
- **共通ID (User)**: 1人=1つ（二重発行禁止）
- **ロール**: `applicant`（応募者）/ `fan` / `organizer`（主催）/ `manager`（マネ）
- **ログイン手段 (Handle)**
  - **応募者/ファン**: LINE（LIFF）
  - **主催/マネ**: メール（Magic Link／将来Passkey） ※LINEは通知用に任意
- **昇格（応募者→主催）**: 既存共通IDにメールを追加紐付け＋`organizer`ロール付与
- **二重ID防止**:
  - 本登録は“アンカー完了”（LINE連携 or eKYC）まで保留（仮アカウントは`pre_user`テーブル管理）
  - メール衝突時: 統合ウィザード（LINE再承認＋Magic Link両方成立）→統合後48hの出金ロック

---

## 3. 認証／セッション (判定者＝Workers)
- **セッション方式**: 署名付きJWTをHTTPOnly Cookieで保持（Secure, SameSite=Lax/Strict）
  - ペイロード例: `sub(userId), roles, iat, exp, tokenVersion`
- **失効**: `tokenVersion`をDBで照合 or KVブラックリスト
- **判定フロー（各API呼出ごと）**
  1. Next → Workers API（Cookie自動送信）
  2. Workers: JWT検証→`userId`/`roles`確定→必要最小限DB確認（停止フラグ等）
  3. OKなら処理続行／NGなら401/403
- **ログイン入口**
  - **LINE**: LIFFでIDトークン取得→Workersの`/auth/line/verify`→JWT発行
  - **メール**: Magic Link→`/auth/email/verify`→紐付け＆JWT発行
- **高リスク操作**: 2要素（Email OTP/Passkey）＋冷却期間（出金先変更/ID統合直後）

---

## 4. 主要ユーザーフロー
- **4.1 応募 (LINE)**
  - 公式LINEメニュー or Flex → LIFF起動（`/liff/apply`）
  - LIFFでLINEログイン→Workers検証→JWT発行→応募フォーム表示
  - 画像/動画はR2署名URLで直PUT→メタ情報だけWorkers APIへ
  - 応募完了→公式LINE通知（Workers→Messaging API）
- **4.2 主催者の閲覧・連絡 (ブラウザ)**
  - LP（Next）→「主催者登録」→メール入力→Magic Link
  - 認証後、`/organizer/*`へ。以降のAPIはJWTで判定
  - 応募一覧取得: Next→Workers(`/api/v1/entries?auditionId=…`)→DB
  - プロフィール課金閲覧（必要時）: Next→Workers→Stripe Checkout→Webhook確定→閲覧解放
  - 応募者へ連絡: Workers→公式LINEプッシュ
- **4.3 公式LINE (AIチャット／通知)**
  - ユーザー発話→LINE Webhook（Workers）→意図判定
  - DB参照で即答可能なら同期返信
  - それ以外はワークフロー（Queues投入／LLM要約）→返信
  - 主催操作に応じたセグメント通知（締切・結果・当日案内）

---

## 5. API設計 (REST例／v1固定)
- **認証系**
  - `POST /auth/line/verify`（LIFF IDトークン→JWT発行）
  - `POST /auth/email/request`（Magic Link送信）
  - `POST /auth/email/verify`（リンク検証→紐付け＆JWT発行）
  - `POST /auth/logout`（tokenVersion更新 or blacklist登録）
- **応募・閲覧**
  - `GET /auditions/:id`（公開情報）
  - `POST /auditions/:id/entries`（応募作成）
  - `GET /organizer/auditions/:id/entries`（主催者閲覧）
  - `POST /uploads/sign`（R2署名URL発行）
- **課金閲覧**
  - `POST /billing/checkout`（Stripe Checkout作成）
  - `POST /webhooks/stripe`（結果受信→Queues→確定反映）
- **通知・LINE**
  - `POST /notifications/line/push`（セグメントID or userIds）
  - `POST /webhooks/line`（Messaging受信→Queues→応答）

---

## 6. データモデル (最小テーブル案)
- `users` (id, created_at, status, token_version, flags)
- `user_handles` (user_id, provider: ‘line’|‘email’, handle, verified_at, unique)
- `user_roles` (user_id, role: ‘applicant’|‘fan’|‘organizer’|‘manager’)
- `auditions` (id, organizer_id, title, desc, status, deadlines …)
- `entries` (id, audition_id, applicant_id, profile_snapshot, assets, status …)
- `payments` (id, user_id, type: ‘profile_view’, status, amount, external_ref …)
- `notifications` (id, user_id|segment, channel: ‘line’|‘email’, payload, status …)
- `audit_logs` (id, actor_user_id, action, target, detail, ip, ua, at)

---

## 7. ディレクトリ構成 (モノレポ)
- `/apps/web` # Next.js（/liff, /organizer, /auth をルート分離）
- `/apps/workers` # Cloudflare Workers（api/*, webhooks/line, auth/*, uploads/*）
- `/packages/shared` # 型・Zodスキーマ・APIクライアント・権限Enum（単一真実）
- `/packages/ui` # 共通UI（MUIテーマ・共通フォーム等）
- `/infra` # IaC/設定（Pages/Workers/R2/KV/Queues/DB接続・環境毎）

---

## 8. 環境とシークレット
- `dev/stg/prod`は完全分離
- LIFF ID／LINE Channel ID/Secret／Messaging Webhook URL
- Resend APIキー・送信ドメイン（環境ごとに分離）
- API_BASE_URL／WEB_BASE_URL（環境ごと）
- DB接続（Postgres）／R2バケット名
- Stripeキー（公開/秘密）
- JWT署名鍵（ローテーション前提）、メール送信プロバイダの鍵
- Cloudflare：Queues/KV/R2のネームスペースは環境別

---

## 9. セキュリティ・運用の最低ライン
- **Cookie**: HTTPOnly+Secure+SameSite、短命JWT＋更新エンドポイント
- **Turnstile**: 応募・投票・ログイン試行に導入（Bot抑止）
- **Webhook**: 冪等性（イベントIDで重複拒否）＋Queuesで順序保証
- **重要操作**: 2要素＋48h冷却（出金・権限統合直後）
- **監視**: Sentry（Next/Workers）、メトリクス／アラート、監査ログの常時出力
- **レート制限**: Workers前段（IP+UserIDで可変）

---

## 10. リリース順
1. **基盤**: モノレポ・3環境・Secrets・DBスキーマ・/packages/shared
2. **認証**: /auth/line/verify／/auth/email/*／JWTクッキー／ロールガード
3. **応募**: R2署名URL→応募API→主催者閲覧API
4. **LINE公式**: Webhook受信→自動応答（FAQ）→通知配信
5. **課金閲覧**（必要に応じてStripe）
6. **監視・レート制限・運用ドキュメント**

---

## 11. 未決事項
- eKYCの導入タイミング（公開／決済／出金）
- Stripeの課金方式（都度・サブスクなし／プロファイル閲覧単価）
- 未成年ポリシー（時間帯・保護者同意・社内フラグ運用）
- LINEのセグメント設計（タグ・属性の保持方針）

---

## まとめ
- Next.js（Vercel）＝画面、Cloudflare Workers＝API/認証/通知、DB＝Postgres、ファイル＝R2。
- 応募者/ファンはLINE（LIFF＋公式）で回し、主催者はブラウザ（メール）。
- 判定（認証・権限）は常にWorkers。Nextは画面だけ。
- これで、後からクラファン等を“API追加”で横展開可能。
