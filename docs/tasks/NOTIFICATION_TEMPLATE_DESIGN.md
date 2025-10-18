# 通知テンプレート設計ドキュメント

**作成日**: 2025-10-19  
**ステータス**: ✅ 完成・実装済み

## 概要

Castoの通知システムは、ユーザーエンゲージメントを最大化し、メンテナンス性を確保するために設計されています。

### 設計原則

1. **共通パーツの再利用** [DRY] - フッター、CTA等を一箇所で管理
2. **ユーザーエンゲージメント最大化** - プロフィール充実促進、適切なCTA
3. **ブランディング統一** - すべての通知で一貫したトーン＆マナー
4. **拡張性** - 新しい通知タイプの追加が容易
5. **メンテナンス性** - 変更は一箇所で完結

## アーキテクチャ

```
notification-templates.ts
├── COMMON_PARTS             # 共通メッセージパーツ
│   ├── brandName
│   ├── footer
│   ├── footerWithProfilePrompt
│   ├── profilePrompt
│   └── helpLink
│
├── notificationTemplates    # LINEサービスメッセージ
│   ├── application_received
│   ├── application_accepted
│   ├── application_rejected
│   ├── new_application
│   ├── audition_deadline_reminder
│   └── audition_status_changed
│
└── emailTemplates          # メール通知
    └── new_application
```

## 共通パーツ（COMMON_PARTS）

### 1. ブランドフッター

```typescript
footer: `\n\n📱 Casto - あなたの才能を輝かせる場所`
```

**目的**: ブランド想起、統一感

**使用箇所**: すべての通知

### 2. プロフィール充実促進フッター

```typescript
footerWithProfilePrompt: (profileCompletionRate: number) => 
  profileCompletionRate < 100
    ? `\n\n💡 プロフィールを充実させると、オファーが届きやすくなります！（現在${profileCompletionRate}%完成）`
    : ''
```

**目的**: 
- プロフィール充実を促進
- オファーマッチング精度向上
- ユーザーの能動的な行動を促す

**使用箇所**: 
- 応募受付完了通知
- 選考不通過通知（次のチャンス to)

### 3. プロフィールステータス

```typescript
profilePrompt: (profileCompletionRate: number) => 
  profileCompletionRate < 80
    ? `プロフィール充実度: ${profileCompletionRate}% - あと少しで完璧！✨`
    : 'プロフィール完成度100%！素晴らしいです🎉'
```

**目的**: ゲーミフィケーション、達成感の提供

## 通知タイプ別設計

### 1. 応募受付完了通知（application_received）

**トリガー**: ユーザーがオーディションに応募した直後

**目的**:
- 応募完了の安心感を提供
- 次のアクションを明示
- プロフィール充実を促進（完成度<80%の場合）

**メッセージ構成**:
```
【オーディション名】への応募が完了しました！🎉

受付番号: XXXXXXXX

選考結果は通知でお知らせします。
応募内容は「マイ応募」からいつでも確認できます。

💡 プロフィールを充実させると、オファーが届きやすくなります！（現在XX%完成）

📱 Casto - あなたの才能を輝かせる場所
```

**ボタンCTA**:
1. 応募詳細を見る → `/applications/{id}`
2. プロフィール編集 or 他のオーディション → 完成度に応じて切り替え
3. マイ応募一覧 → `/applications`
4. ヘルプ → `/help`

**設計ポイント**:
- 受付番号で信頼性を提供
- プロフィール完成度に応じて動的にCTAを変更
- 次のアクション（確認、充実、探索）を明確に提示

### 2. 選考通過通知（application_accepted）

**トリガー**: 主催者が応募を「合格」にした時

**目的**:
- 合格の喜びを伝える
- 次のステップへ導く
- モチベーション維持

**メッセージ構成**:
```
おめでとうございます！🎊

【オーディション名】
ステップ名を通過しました！

次のステップについては、応募詳細ページをご確認ください。
引き続き頑張ってください！💪

📱 Casto - あなたの才能を輝かせる場所
```

**ボタンCTA**:
1. 応募詳細を見る → `/applications/{id}`
2. 他のオーディションも見る → `/auditions`

**設計ポイント**:
- ポジティブな絵文字で喜びを強調
- 次のステップを明確に案内
- さらなるチャレンジを促す

### 3. 選考不通過通知（application_rejected）

**トリガー**: 主催者が応募を「不合格」にした時

**目的**:
- 丁寧に結果を伝える
- 落胆させず、前向きにする
- 次のチャレンジを促す

**メッセージ構成**:
```
【オーディション名】の選考結果をお知らせします。

残念ながら今回は見送りとなりましたが、
あなたの才能を求めるオーディションは他にもたくさんあります。

次のチャレンジに向けて、頑張ってください！💪

💡 プロフィールを充実させると、オファーが届きやすくなります！（現在XX%完成）

📱 Casto - あなたの才能を輝かせる場所
```

**ボタンCTA**:
1. 他のオーディション → `/auditions`
2. プロフィール充実 or 応募詳細 → 完成度に応じて切り替え

**設計ポイント**:
- ネガティブな言葉を避ける
- 他の機会があることを強調
- プロフィール充実で次のチャンスを増やす

### 4. 新規応募通知（new_application）- 主催者向け

**トリガー**: ユーザーがオーディションに応募した時

**目的**:
- 主催者に迅速な応募確認を促す
- 応募情報を明確に提示
- 選考開始を促す

**メッセージ構成（HTML）**:
- グラデーションヘッダー
- 情報ボックス（応募者、日時、受付番号）
- CTAボタン（応募内容を確認）
- ブランドフッター

**設計ポイント**:
- プロフェッショナルなデザイン
- 重要情報を視覚的に強調
- 迅速な対応を促すメッセージ

## プロフィール充実度システム

### 計算ロジック

`lib/profile-completion.ts`で実装

**重み付け**:
```typescript
const PROFILE_WEIGHTS = {
  // 基本情報（30%）
  displayName: 10,
  bio: 10,
  birthdate: 10,
  
  // プロフィール写真・動画（30%）
  profileImageUrl: 15,
  profileVideoUrl: 15,
  
  // 経歴・スキル（25%）
  experiences: 15,
  skills: 10,
  
  // 連絡先（15%）
  email: 10,
  phoneNumber: 5,
}
```

**特徴**:
- 視覚的要素（写真・動画）を重視（30%）
- 基本情報の完全性を評価（30%）
- 経歴・スキルで差別化（25%）
- 連絡可能性を確保（15%）

### 動的CTA切り替え

プロフィール完成度に応じてボタンのリンク先を変更：

```typescript
btn2_url: profileRate < 100 
  ? `line://app/${liffId}?redirect=/profile/edit`  // プロフィール編集
  : `line://app/${liffId}?redirect=/auditions`     // 他のオーディション
```

**効果**:
- 未完成ユーザー → プロフィール充実を促す
- 完成ユーザー → さらなるチャレンジを促す

## 新しい通知タイプの追加方法

### チェックリスト

通知タイプを追加する際は、以下を確認：

1. ✅ `NotificationType`に新しい型を追加（`packages/shared/src/types/notification.ts`）
2. ✅ LINE Developersコンソールでテンプレートを登録
3. ✅ `templateName`がコンソールの名前と完全一致
4. ✅ 共通パーツ（`COMMON_PARTS`）を活用
5. ✅ プロフィール充実促進を含める（該当する場合）
6. ✅ 適切なDeep Linkを設定
7. ✅ `description`フィールドに用途を記載
8. ✅ メッセージに絵文字を適度に使用（視認性向上）
9. ✅ フッターを統一（`COMMON_PARTS.footer`）
10. ✅ ボタンURLは2-4個を推奨

### テンプレート例

```typescript
new_notification_type: {
  templateName: 'template_name_in_line_console',
  title: '🎉 タイトル',
  description: 'このテンプレートの用途説明（メンテナンス用）',
  message: (ctx) => {
    const profileRate = ctx.profileCompletionRate || 0
    return (
      `メッセージ本文\n\n` +
      `詳細情報` +
      COMMON_PARTS.footerWithProfilePrompt(profileRate) +
      COMMON_PARTS.footer
    )
  },
  actionUrl: (ctx, liffId) => 
    `line://app/${liffId}?redirect=/path/${ctx.id}`,
  params: (ctx, liffId) => ({
    param1: ctx.value1,
    button_uri_1: `line://app/${liffId}?redirect=/path1`,
    button_uri_2: `line://app/${liffId}?redirect=/path2`
  })
}
```

## ブランディングガイドライン

### トーン＆マナー

- **親しみやすく、プロフェッショナル**
- **前向きで、励まし**
- **明確で、分かりやすい**

### 絵文字使用ガイドライン

**推奨**:
- 🎉 お祝い、達成
- 💪 頑張れ、応援
- 💡 アイデア、ヒント
- 📱 アプリ、テクノロジー
- ✅ 完了、成功
- ⏰ 時間、締切

**避ける**:
- 過度な使用（1メッセージに3個まで）
- ネガティブな絵文字
- 意味不明な絵文字

### 文体

- **です・ます調**
- **短い文章**（1文50文字以内目安）
- **改行で読みやすく**

## パフォーマンス最適化

### キャッシュ戦略

- プロフィール充実度は通知送信時に計算（リアルタイム）
- 共通パーツは定数化（ビルド時に確定）
- テンプレートは`as const`で型安全性確保

### エラーハンドリング

```typescript
try {
  const profileCompletionRate = await calculateProfileCompletion(userId, supabase)
  // 通知送信...
} catch (error) {
  // プロフィール充実度取得失敗時はデフォルト値（0）を使用
  console.error('[Notification] Profile completion calculation failed:', error)
}
```

## テスト方法

### 1. ローカルテスト

```bash
cd apps/workers
npx wrangler dev --env development
```

### 2. プロフィール充実度のテスト

```typescript
// 各完成度でテスト
const testCases = [0, 30, 50, 70, 90, 100]
for (const rate of testCases) {
  console.log(`Rate: ${rate}%`)
  console.log(COMMON_PARTS.footerWithProfilePrompt(rate))
}
```

### 3. 通知送信テスト

1. LINEミニアプリから応募
2. Workers logsを確認
3. LINE通知を受信
4. リンクの動作確認

## メンテナンスガイド

### フッターメッセージの変更

```typescript
// apps/workers/src/config/notification-templates.ts
const COMMON_PARTS = {
  brandName: 'Casto',
  footer: `\n\ncasto オーディション`,
  footerWithProfilePrompt: (rate) => rate < 80 ? プロフィール充実促進メッセージ : '',
  profilePrompt: (rate) => プロフィールステータス表示
}
```

→ すべての通知に自動反映

### プロフィール充実促進メッセージの変更

```typescript
footerWithProfilePrompt: (profileCompletionRate: number) => 
  profileCompletionRate < 80
    ? `\n\n💡 新しいメッセージ（現在${profileCompletionRate}%完成）`
    : ''
```

→ すべての該当通知に自動反映

### テンプレート名の変更

1. LINE Developersコンソールで新しい名前のテンプレートを作成
2. `templateName`を更新
3. Workers再デプロイ

**注意**: 既存テンプレートの名前変更は推奨しません（互換性）

## 実装ファイル

- `apps/workers/src/config/notification-templates.ts` - テンプレート定義
- `apps/workers/src/lib/profile-completion.ts` - プロフィール充実度計算
- `apps/workers/src/lib/notification.service.ts` - 通知送信サービス
- `apps/workers/src/features/talent/applications/routes.ts` - 応募エンドポイント

## まとめ

### 実現したこと

✅ **共通パーツで一貫性を確保** - フッター、プロフィール促進メッセージ  
✅ **ユーザーエンゲージメント最大化** - プロフィール充実促進、動的CTA  
✅ **ブランディング統一** - トーン＆マナー、絵文字ガイドライン  
✅ **拡張性** - 新しい通知タイプの追加が容易  
✅ **メンテナンス性** - 変更は一箇所で完結

### 今後の拡張

- [ ] Phase 2: メール通知（他の通知タイプ）
- [ ] Phase 3: LIFF通知一覧UI
- [ ] A/Bテスト機能（メッセージ最適化）
- [ ] パーソナライゼーション（ユーザー属性に応じた変更）

---

**作成日**: 2025-10-19  
**最終更新**: 2025-10-19  
**ステータス**: ✅ 完成・実装済み
