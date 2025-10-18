/**
 * 通知テンプレート定義
 * 
 * [CA][SD] メンテナンス性と拡張性を重視した通知テンプレート管理
 * 
 * 設計原則：
 * - 共通パーツの再利用（フッター、CTA等）
 * - ユーザーエンゲージメント最大化（プロフィール充実促進等）
 * - ブランディング統一
 * - テンプレート追加時の混乱防止
 */

import type { NotificationType } from '@casto/shared/types/notification'

/**
 * 共通メッセージパーツ
 * 
 * すべての通知で再利用される共通要素を定義
 * メンテナンス性向上のため、変更は一箇所で完結
 */
const COMMON_PARTS = {
  /** ブランド名 */
  brandName: 'Casto',
  
  /** フッター（プロフィール未完成の場合） */
  footerWithProfilePrompt: (profileCompletionRate: number) => 
    profileCompletionRate < 80
      ? `\n\n💡 プロフィールを充実させると、オファーが届きやすくなります！（現在${profileCompletionRate}%完成）`
      : '',
  
  /** フッター（通常） */
  footer: `\n\ncasto オーディション`,
  
  /** ヘルプへのリンク文言 */
  helpLink: 'お困りの場合はヘルプをご覧ください',
  
  /** プロフィール充実促進メッセージ */
  profilePrompt: (profileCompletionRate: number) => 
    profileCompletionRate < 80
      ? `プロフィール充実度: ${profileCompletionRate}% - あと少しで完璧！✨`
      : 'プロフィール完成度100%！素晴らしいです🎉'
} as const

/**
 * LINEサービスメッセージテンプレート
 */
export interface NotificationTemplate {
  /** LINE Developersコンソールに登録したテンプレート名（正確に一致させること） */
  templateName: string
  /** 通知タイトル（トーク画面に表示） */
  title: string
  /** メッセージ本文生成関数 */
  message: (context: Record<string, any>) => string
  /** LIFFへのDeep Link（オプション） */
  actionUrl?: (context: Record<string, any>, liffId?: string) => string
  /** テンプレート変数のマッピング */
  params?: (context: Record<string, any>, liffId?: string) => Record<string, string>
  /** テンプレートの説明（メンテナンス用） */
  description?: string
}

/**
 * LINEサービスメッセージテンプレート定義
 * 
 * 各テンプレートは以下の要素で構成：
 * - templateName: LINE Developersコンソールで登録した名前（完全一致必須）
 * - title: 通知のタイトル
 * - message: メッセージ本文（共通パーツを活用）
 * - params: テンプレート変数（ボタンURL、表示テキスト等）
 * - description: テンプレートの用途説明（メンテナンス用）
 */
export const notificationTemplates: Record<NotificationType, NotificationTemplate> = {
  /**
   * 応募受付完了通知
   * 
   * トリガー: ユーザーがオーディションに応募した直後
   * 目的: 応募完了の確認、次のアクションを促す
   */
  application_received: {
    templateName: 'Entry confirmed (simple)',  // ← LINE Developersコンソールで登録した実際の名前
    title: '✅ 応募を受け付けました',
    description: '応募完了直後に送信。応募詳細ページへの導線とプロフィール充実を促す',
    message: (ctx) => {
      const profileRate = ctx.profileCompletionRate || 0
      return (
        `【${ctx.auditionTitle}】への応募が完了しました！🎉\n\n` +
        `受付番号: ${ctx.applicationId.substring(0, 8).toUpperCase()}\n\n` +
        `選考結果は通知でお知らせします。\n` +
        `応募内容は「マイ応募」からいつでも確認できます。` +
        COMMON_PARTS.footerWithProfilePrompt(profileRate) +
        COMMON_PARTS.footer
      )
    },
    actionUrl: (ctx, liffId) => 
      `line://app/${liffId}?redirect=/applications/${ctx.applicationId}`,
    params: (ctx, liffId) => {
      const profileRate = ctx.profileCompletionRate || 0
      return {
        number: ctx.applicationId.substring(0, 8).toUpperCase(),
        btn1_url: `line://app/${liffId}?redirect=/applications/${ctx.applicationId}`,  // 応募詳細
        btn2_url: profileRate < 80
          ? `line://app/${liffId}?redirect=/profile/edit`  // プロフィール編集
          : `line://app/${liffId}?redirect=/auditions`,  // 他のオーディションを見る
        btn3_url: `line://app/${liffId}?redirect=/applications`,  // マイ応募一覧
        btn4_url: `line://app/${liffId}?redirect=/help`  // ヘルプ
      }
    }
  },
  
  /**
   * 選考通過通知
   * 
   * トリガー: 主催者が応募を「合格」にした時
   * 目的: 合格の喜びを伝え、次のステップへ導く
   */
  application_accepted: {
    templateName: 'application_passed_ja',
    title: '🎉 選考通過のお知らせ',
    description: '選考通過時に送信。次のステップと詳細確認を促す',
    message: (ctx) => (
      `おめでとうございます！🎊\n\n` +
      `【${ctx.auditionTitle}】\n` +
      `${ctx.stepName}を通過しました！\n\n` +
      `次のステップについては、応募詳細ページをご確認ください。\n` +
      `引き続き頑張ってください！💪` +
      COMMON_PARTS.footer
    ),
    actionUrl: (ctx, liffId) => 
      `line://app/${liffId}?redirect=/applications/${ctx.applicationId}`,
    params: (ctx, liffId) => ({
      audition_title: ctx.auditionTitle,
      step_name: ctx.stepName,
      button_uri_1: `line://app/${liffId}?redirect=/applications/${ctx.applicationId}`,  // 応募詳細
      button_uri_2: `line://app/${liffId}?redirect=/auditions`  // 他のオーディションも見る
    })
  },
  
  /**
   * 選考不通過通知
   * 
   * トリガー: 主催者が応募を「不合格」にした時
   * 目的: 丁寧に結果を伝え、次のチャレンジを促す
   */
  application_rejected: {
    templateName: 'application_failed_ja',
    title: '選考結果のお知らせ',
    description: '選考不通過時に送信。次のチャレンジを前向きに促す',
    message: (ctx) => {
      const profileRate = ctx.profileCompletionRate || 0
      return (
        `【${ctx.auditionTitle}】の選考結果をお知らせします。\n\n` +
        `残念ながら今回は見送りとなりましたが、\n` +
        `あなたの才能を求めるオーディションは他にもたくさんあります。\n\n` +
        `次のチャレンジに向けて、頑張ってください！💪` +
        COMMON_PARTS.footerWithProfilePrompt(profileRate) +
        COMMON_PARTS.footer
      )
    },
    actionUrl: (ctx, liffId) => 
      `line://app/${liffId}?redirect=/auditions`,  // 他のオーディションへ
    params: (ctx, liffId) => {
      const profileRate = ctx.profileCompletionRate || 0
      return {
        audition_title: ctx.auditionTitle,
        button_uri_1: `line://app/${liffId}?redirect=/auditions`,  // 他のオーディション
        button_uri_2: profileRate < 80
          ? `line://app/${liffId}?redirect=/profile/edit`  // プロフィール充実
          : `line://app/${liffId}?redirect=/applications/${ctx.applicationId}`  // この応募の詳細
      }
    }
  },
  
  /**
   * 新規応募通知（主催者向け）
   * 
   * トリガー: ユーザーがオーディションに応募した時
   * 目的: 主催者に迅速な応募確認を促す
   * チャネル: メール
   */
  new_application: {
    templateName: 'new_application_email',
    title: '📩 新しい応募が届きました',
    description: '主催者向けメール通知。応募内容の確認を促す',
    message: (ctx) => (
      `${ctx.applicantName} さんが【${ctx.auditionTitle}】に応募しました。\n\n` +
      `応募日時: ${ctx.appliedAt}\n` +
      `応募者のプロフィールと応募内容を確認して、選考を進めてください。`
    )
    // 主催者向けはメールなのでactionUrlなし
  },
  
  /**
   * 応募締切リマインダー
   * 
   * トリガー: 締切の3日前、1日前など
   * 目的: 興味を持ったオーディションへの応募を促す
   */
  audition_deadline_reminder: {
    templateName: 'deadline_reminder_ja',
    title: '⏰ 応募締切が迫っています',
    description: '締切前のリマインダー。緊急性を伝えて応募を促す',
    message: (ctx) => (
      `【${ctx.auditionTitle}】\n\n` +
      `応募締切: ${ctx.deadlineDate}\n\n` +
      `締切まであと少しです！\n` +
      `気になる方はお早めにご応募ください。` +
      COMMON_PARTS.footer
    ),
    actionUrl: (ctx, liffId) => 
      `line://app/${liffId}?redirect=/auditions/${ctx.auditionId}`,
    params: (ctx, liffId) => ({
      audition_title: ctx.auditionTitle,
      deadline_date: ctx.deadlineDate,
      button_uri_1: `line://app/${liffId}?redirect=/auditions/${ctx.auditionId}`,  // オーディション詳細
      button_uri_2: `line://app/${liffId}?redirect=/auditions`  // 他のオーディション
    })
  },
  
  /**
   * オーディション情報更新通知
   * 
   * トリガー: オーディションの募集要項や日程が変更された時
   * 目的: 応募済み/興味を持っているユーザーに変更を周知
   */
  audition_status_changed: {
    templateName: 'audition_status_changed_ja',
    title: '📝 オーディション情報が更新されました',
    description: 'オーディション情報変更時に送信。変更内容の確認を促す',
    message: (ctx) => (
      `【${ctx.auditionTitle}】\n\n` +
      `オーディション情報が更新されました。\n` +
      `${ctx.changeDescription || '詳細をご確認ください。'}\n\n` +
      `応募済みの方は、変更内容をご確認ください。` +
      COMMON_PARTS.footer
    ),
    actionUrl: (ctx, liffId) => 
      `line://app/${liffId}?redirect=/auditions/${ctx.auditionId}`,
    params: (ctx, liffId) => ({
      audition_title: ctx.auditionTitle,
      change_description: ctx.changeDescription || '情報が更新されました',
      button_uri_1: `line://app/${liffId}?redirect=/auditions/${ctx.auditionId}`,  // オーディション詳細
      button_uri_2: ctx.applicationId 
        ? `line://app/${liffId}?redirect=/applications/${ctx.applicationId}`  // 自分の応募
        : `line://app/${liffId}?redirect=/auditions`  // 他のオーディション
    })
  }
} as const

/**
 * テンプレート追加時のチェックリスト
 * 
 * 新しい通知タイプを追加する際は、以下を確認してください：
 * 
 * 1. ✅ NotificationTypeに新しい型を追加（packages/shared/src/types/notification.ts）
 * 2. ✅ LINE Developersコンソールでテンプレートを登録
 * 3. ✅ templateNameがコンソールの名前と完全一致
 * 4. ✅ 共通パーツ（COMMON_PARTS）を活用
 * 5. ✅ プロフィール充実促進を含める（該当する場合）
 * 6. ✅ 適切なDeep Linkを設定
 * 7. ✅ descriptionフィールドに用途を記載
 * 8. ✅ メッセージに絵文字を適度に使用（視認性向上）
 * 9. ✅ フッターを統一（COMMON_PARTS.footer）
 * 10. ✅ ボタンURLは2-4個を推奨
 */

/**
 * メールテンプレート
 */
export interface EmailTemplate {
  subject: string
  htmlBody: (context: Record<string, any>) => string
  textBody: (context: Record<string, any>) => string
}

/**
 * メールテンプレート定義
 * 
 * 主催者向けのメール通知
 * HTMLとテキストの両方を提供（メールクライアント互換性のため）
 */
export const emailTemplates: Partial<Record<NotificationType, EmailTemplate>> = {
  /**
   * 新規応募通知（主催者向けメール）
   * 
   * トリガー: ユーザーがオーディションに応募した時
   * 目的: 主催者に迅速な応募確認と選考開始を促す
   */
  new_application: {
    subject: '【Casto】🎭 新しい応募が届きました - ${ctx.auditionTitle}',
    htmlBody: (ctx) => `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif; 
            line-height: 1.8; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f5f5f5; 
          }
          .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background-color: #ffffff; 
            border-radius: 8px; 
            overflow: hidden; 
            box-shadow: 0 2px 8px rgba(0,0,0,0.1); 
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
          }
          .header h1 { 
            margin: 0; 
            font-size: 24px; 
            font-weight: 600; 
          }
          .content { 
            padding: 30px 20px; 
          }
          .info-box { 
            background-color: #f9fafb; 
            border-left: 4px solid #667eea; 
            padding: 15px; 
            margin: 20px 0; 
            border-radius: 4px; 
          }
          .info-row { 
            margin: 10px 0; 
          }
          .label { 
            font-weight: 600; 
            color: #4a5568; 
            display: inline-block; 
            min-width: 100px; 
          }
          .value { 
            color: #2d3748; 
          }
          .button-container { 
            text-align: center; 
            margin: 30px 0; 
          }
          .button { 
            display: inline-block; 
            padding: 14px 32px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white !important; 
            text-decoration: none; 
            border-radius: 6px; 
            font-weight: 600; 
            font-size: 16px; 
            transition: transform 0.2s; 
          }
          .button:hover { 
            transform: translateY(-2px); 
          }
          .footer { 
            padding: 20px; 
            text-align: center; 
            font-size: 12px; 
            color: #718096; 
            background-color: #f7fafc; 
            border-top: 1px solid #e2e8f0; 
          }
          .brand { 
            font-weight: 600; 
            color: #667eea; 
          }
          .divider { 
            height: 1px; 
            background-color: #e2e8f0; 
            margin: 20px 0; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎭 新しい応募が届きました</h1>
          </div>
          <div class="content">
            <p>オーディション【<strong>${ctx.auditionTitle}</strong>】に新しい応募がありました。</p>
            
            <div class="info-box">
              <div class="info-row">
                <span class="label">応募者:</span>
                <span class="value">${ctx.applicantName || '（名前未設定）'}</span>
              </div>
              <div class="info-row">
                <span class="label">応募日時:</span>
                <span class="value">${ctx.appliedAt}</span>
              </div>
              <div class="info-row">
                <span class="label">受付番号:</span>
                <span class="value">${ctx.applicationId ? ctx.applicationId.substring(0, 8).toUpperCase() : 'N/A'}</span>
              </div>
            </div>

            <div class="divider"></div>

            <p>応募者のプロフィールと応募内容を確認して、選考を進めてください。</p>
            <p style="color: #718096; font-size: 14px;">💡 迅速な対応が、優秀な人材の確保につながります。</p>

            <div class="button-container">
              <a href="${ctx.reviewUrl}" class="button">応募内容を確認する →</a>
            </div>
          </div>
          <div class="footer">
            <p>casto オーディション</p>
            <p style="margin-top: 10px;">このメールは自動送信されています。返信はできません。</p>
          </div>
        </div>
      </body>
      </html>
    `,
    textBody: (ctx) => `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎭 新しい応募が届きました
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

オーディション【${ctx.auditionTitle}】に新しい応募がありました。

【応募情報】
応募者: ${ctx.applicantName || '（名前未設定）'}
応募日時: ${ctx.appliedAt}
受付番号: ${ctx.applicationId ? ctx.applicationId.substring(0, 8).toUpperCase() : 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

応募者のプロフィールと応募内容を確認して、選考を進めてください。

💡 迅速な対応が、優秀な人材の確保につながります。

▼ 応募内容を確認する
${ctx.reviewUrl}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
casto オーディション
このメールは自動送信されています。
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `
  }
}
