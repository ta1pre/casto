# LINE Service Message テンプレート設定ガイド

**作成日**: 2025-10-19  
**目的**: プロフィール充実度に応じた動的通知を実現

## 概要

プロフィール充実度に応じて**2つのテンプレート**を使い分けます：

1. **`application_received_prompt`** - プロフィール充実度80%未満
2. **`application_received_complete`** - プロフィール充実度80%以上

## LINE Developersコンソールでの設定手順

### 1. LINE Developersコンソールにアクセス

https://developers.line.biz/console/

1. LINEミニアプリチャネルを選択
2. 「サービスメッセージ」タブをクリック

### 2. テンプレート1: `application_received_prompt` (80%未満用)

#### 基本設定

- **テンプレート**: 「Entry confirmed (detailed)」などの詳細型を選択
- **API用テンプレート名**: `application_received_prompt`
- **使用事例**: 「オーディション応募完了時にプロフィール充実を促進する通知」

#### メッセージ内容

**タイトル（A-1）**:
```
エントリー完了
```

**サブタイトル（A-2）**:
```
受付番号 {{number}}
```

**詳細内容（B - detailed）**:

**キー1: `title`**
```
{{audition_title}}への応募が完了しました！🎉
```

**キー2: `message`**
```
選考結果は通知でお知らせします。
応募内容は「マイ応募」からいつでも確認できます。
```

**キー3: `prompt`** (プロフィール促進)
```
💡 プロフィールを充実させると、オファーが届きやすくなります！
```

**キー4: `footer`**
```
casto オーディション
```

#### ボタン（C）

**ボタン1** (必須 - 「詳細はこちら」として表示):
- URL: `{{btn1_url}}`
- ラベル: 応募詳細を見る

**ボタン2**:
- URL: `{{btn2_url}}`
- ラベル: プロフィールを編集

**ボタン3**:
- URL: `{{btn3_url}}`
- ラベル: マイ応募

**ボタン4**:
- URL: `{{btn4_url}}`
- ラベル: ヘルプ

#### テストメッセージ用JSON

```json
{
  "audition_title": "新作ドラマ「青春ストーリー」主演オーディション",
  "number": "9F75449D",
  "btn1_url": "line://app/2008009031-ZdQbY5YW?redirect=/applications/app123",
  "btn2_url": "line://app/2008009031-ZdQbY5YW?redirect=/profile/edit",
  "btn3_url": "line://app/2008009031-ZdQbY5YW?redirect=/applications",
  "btn4_url": "line://app/2008009031-ZdQbY5YW?redirect=/help"
}
```

---

### 3. テンプレート2: `application_received_complete` (80%以上用)

#### 基本設定

- **テンプレート**: 「Entry confirmed (simple)」などのシンプル型を選択
- **API用テンプレート名**: `application_received_complete`
- **使用事例**: 「オーディション応募完了時の確認通知（プロフィール完成済みユーザー向け）」

#### メッセージ内容

**タイトル（A-1）**:
```
エントリー完了
```

**サブタイトル（A-2）**:
```
受付番号 {{number}}
```

**詳細内容（B - simple）**:

**キー1: `message`**
```
{{audition_title}}への応募が完了しました！🎉

選考結果は通知でお知らせします。
応募内容は「マイ応募」からいつでも確認できます。

casto オーディション
```

#### ボタン（C）

**ボタン1** (必須 - 「詳細はこちら」として表示):
- URL: `{{btn1_url}}`
- ラベル: 応募詳細を見る

**ボタン2**:
- URL: `{{btn2_url}}`
- ラベル: 他のオーディション

**ボタン3**:
- URL: `{{btn3_url}}`
- ラベル: マイ応募

**ボタン4**:
- URL: `{{btn4_url}}`
- ラベル: ヘルプ

#### テストメッセージ用JSON

```json
{
  "audition_title": "新作ドラマ「青春ストーリー」主演オーディション",
  "number": "9F75449D",
  "btn1_url": "line://app/2008009031-ZdQbY5YW?redirect=/applications/app123",
  "btn2_url": "line://app/2008009031-ZdQbY5YW?redirect=/auditions",
  "btn3_url": "line://app/2008009031-ZdQbY5YW?redirect=/applications",
  "btn4_url": "line://app/2008009031-ZdQbY5YW?redirect=/help"
}
```

---

## 動作の仕組み

### コード側の実装

```typescript
application_received: {
  templateName: (ctx) => {
    const profileRate = ctx.profileCompletionRate || 0
    return profileRate < 80 
      ? 'application_received_prompt'  // プロフィール充実促進あり
      : 'application_received_complete' // プロフィール完成
  },
  params: (ctx, liffId) => {
    const profileRate = ctx.profileCompletionRate || 0
    return {
      audition_title: ctx.auditionTitle,
      number: ctx.applicationId.substring(0, 8).toUpperCase(),
      btn1_url: `line://app/${liffId}?redirect=/applications/${ctx.applicationId}`,
      btn2_url: profileRate < 80
        ? `line://app/${liffId}?redirect=/profile/edit`      // プロフィール編集
        : `line://app/${liffId}?redirect=/auditions`,         // 他のオーディション
      btn3_url: `line://app/${liffId}?redirect=/applications`,
      btn4_url: `line://app/${liffId}?redirect=/help`
    }
  }
}
```

### 動作フロー

1. ユーザーが応募
2. バックエンドがプロフィール充実度を計算（0-100%）
3. **充実度 < 80%** → `application_received_prompt` テンプレート
   - プロフィール促進メッセージ表示
   - ボタン2: プロフィール編集へ
4. **充実度 >= 80%** → `application_received_complete` テンプレート
   - プロフィール促進メッセージなし
   - ボタン2: 他のオーディションへ

## テンプレート名の重要性

### ⚠️ 注意事項

**API用テンプレート名は完全一致必須**:
- ❌ `Application Received Prompt` → 動作しない
- ❌ `application-received-prompt` → 動作しない
- ✅ `application_received_prompt` → 正しい

コンソールに表示される「API用テンプレート名」をそのままコードに記載してください。

## テスト方法

### 1. テストメッセージ送信

LINE Developersコンソールで各テンプレートのテストメッセージを送信：

1. テンプレート編集画面で「テストメッセージを送信する」セクション
2. 上記のJSON例をコピー＆ペースト
3. 「送信する」をクリック
4. ログインしているLINEアカウントに通知が届く

### 2. 実際の応募でテスト

#### プロフィール充実度70%でテスト

1. プロフィールを意図的に70%程度に設定
2. LINEミニアプリから応募
3. `application_received_prompt` テンプレートが届くことを確認
4. プロフィール促進メッセージが表示されることを確認
5. ボタン2が「プロフィール編集」になっていることを確認

#### プロフィール充実度90%でテスト

1. プロフィールを90%以上に設定
2. LINEミニアプリから応募
3. `application_received_complete` テンプレートが届くことを確認
4. プロフィール促進メッセージが表示されないことを確認
5. ボタン2が「他のオーディション」になっていることを確認

## トラブルシューティング

### 通知が届かない

**原因1: テンプレート名が間違っている**
```bash
# Workersログで確認
Failed to send service message: Template not found
```

**解決策**: LINE Developersコンソールの「API用テンプレート名」と完全一致させる

**原因2: テンプレートが「開発中」状態**

**解決策**: 
- テストユーザーでログインしているか確認
- または審査を申請して「公開中」にする

### ボタンリンクが動作しない

**原因: Deep Linkの形式が間違っている**

**正しい形式**:
```
line://app/{LIFF_ID}?redirect=/path
```

**確認方法**:
```bash
# .dev.vars で LIFF_ID を確認
LINE_LIFF_ID="2008009031-ZdQbY5YW"
```

### メッセージ内容が反映されない

**原因: LINE Service Messageはメッセージ本文を動的に変更できない**

LINE Service Messageの仕様:
- ✅ プレースホルダー（`{{変数}}`）に値を渡せる
- ✅ ボタンURLを動的に設定できる
- ❌ メッセージ本文自体は変更不可（テンプレートで固定）

**解決策**: テンプレートを複数作成して使い分ける（今回の実装）

## メンテナンス

### テンプレート内容の変更

1. LINE Developersコンソールでテンプレートを編集
2. コード変更は不要（プレースホルダーが同じなら）
3. テストメッセージで確認

### 新しいテンプレートの追加

1. LINE Developersコンソールでテンプレートを作成
2. `notification-templates.ts` に定義を追加
3. Workers再デプロイ

## まとめ

### 実現したこと

✅ **プロフィール充実度に応じた動的通知**
- 80%未満: プロフィール促進メッセージ + 編集ボタン
- 80%以上: シンプルなメッセージ + 探索ボタン

✅ **メッセージ内容のカスタマイズ**
- オーディション名の動的表示
- 受付番号の表示
- フッターの統一

✅ **適切なCTA**
- プロフィール編集へのスムーズな誘導
- 次のアクションへの明確な導線

### 制約事項

❌ **メッセージ本文の完全な動的変更は不可**
- LINE Service Messageの仕様
- テンプレートを使い分けることで対応

❌ **審査が必要**
- 本番環境で使用するには審査通過が必要
- 開発環境ではテストユーザーのみ受信可能

---

**作成日**: 2025-10-19  
**最終更新**: 2025-10-19  
**ステータス**: ✅ 実装完了・テンプレート作成待ち
