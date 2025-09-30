# 認証実装FIXメモ

## 1. 現状サマリー
- フロント(`apps/web/`)では`AuthProvider`が`localStorage`ベースでモック状態。
- Workers(`apps/workers/src/index.ts`)の`/api/v1/auth/*`はすべて`TODO`。
- JWT・セッション・アクセス制御が未導入で、本番運用には耐えない。

## 2. 実装方針
1. **Workersでの判定一元化**
   - `createJWT`/`verifyJWT`ユーティリティを実装し、署名付きJWTを発行・検証する。
   - HTTPOnly Cookie(`Secure`,`SameSite=Lax`)でセッション維持。
   - ミドルウェアで`user`コンテキストとロール情報を展開。
2. **認証ハンドラ**
   - `POST /api/v1/auth/line/verify`: LINE IDトークン検証→ユーザー作成/更新→JWT発行。
   - `POST /api/v1/auth/email/request`: Magic Link生成・送信。
   - `POST /api/v1/auth/email/verify`: トークン検証→メールハンドル紐付け→JWT発行。
3. **Next.js連携**
   - `middleware.ts`でディレクトリ別ガード（`/liff/*`はLINE、`/organizer/*`はメールなど）。
   - `AuthProvider`をCookieベースのセッション同期に刷新。
   - 共通ヘッダーでログイン状態・ロール表示を統一。
4. **ロール管理**
   - `roles`マスタに権限配列を保持し、RBACで判定。
   - Workers共通ヘルパーで`requiredRole`/`requiredPermission`をチェック。
   - ロール追加手順をタスクとドキュメントで標準化。

## 3. 実装タスクとの紐付け
- 進行中タスクの管理は `tasks/TODO.md` に統合。認証関連の未完了項目が存在する場合は必ず追記する。
- 進行管理の推奨順序: `Workers認証基盤 → LINE認証 → メール認証 → Next.js連携 → RBAC`。

## 4. 残課題
- LINE Developers Consoleのテスト用LIFF ID確保（タスク4参照）。
- Magic Link送信プロバイダ選定と環境変数設計。
- `tokenVersion`によるリボーク、及び高リスク操作時の二要素導入タイミング。

## 5. 参照ドキュメント
- `specs/ARCHITECTURE.md` セクション3「認証／セッション」
- `specs/ROADMAP.md` セクション3「応募・閲覧フロー」
- `apps/web/src/providers/AuthProvider.tsx`
- `apps/workers/src/index.ts`
