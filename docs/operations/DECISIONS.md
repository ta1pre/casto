# casto: 意思決定ログ（ADR）

形式: YYYY-MM-DD: タイトル — 背景 / 選択肢 / 決定 / 影響

## 2025-09-22: ドキュメント運用方針
- 背景: 仕様をコード化する前に合意形成を行うため
- 選択肢: ad-hocメモ / Google Docs / リポジトリ内MD
- 決定: リポジトリ内 `services/casto/doc/` にMDで管理しPRレビュー
- 影響: 変更履歴が残る。関係者レビューが容易

## 2025-09-23: Identity一元化とドメイン分離、Supabase-first
- 背景: ユーザー/権限の重複実装を避け、拡張性と監査性を高めたい
- 選択肢:
  - A) Identityを共通ドメインに一元化＋機能ドメイン分離（Supabase-first）
  - B) 各機能でユーザー/ロールを局所管理（将来統合）
- 決定: Aを採用。DirectoryとAPI草案は `docs/USER_DOMAIN_RULES.md` に準拠
- 影響:
  - ルーティング: `/api/v1/identity/*` を身元・権限の唯一の入口とする
  - スキーマ: `supabase/migrations/*` に users/roles/permissions 等を集中管理
  - 型共有: DTO/Schemaは `packages/shared` に集約し、Workers/Webで共用
  - 実装順: Identity → 応募/主催（auditions/entries）→ 通知/課金の順で段階的に適用
