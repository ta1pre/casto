/**
 * 通知テンプレート定義
 * [CA][SD] LINEサービスメッセージ・メール用のテンプレート定義
 */

import type { NotificationType } from '@casto/shared/types/notification'

/**
 * LINEサービスメッセージテンプレート
 */
export interface NotificationTemplate {
  /** LINE Developersコンソールに登録するテンプレート名 */
  templateName: string
  /** 通知タイトル（トーク画面に表示） */
  title: string
  /** メッセージ本文生成関数 */
  message: (context: Record<string, any>) => string
  /** LIFFへのDeep Link（オプション） */
  actionUrl?: (context: Record<string, any>, liffId?: string) => string
  /** テンプレート変数のマッピング */
  params?: (context: Record<string, any>, liffId?: string) => Record<string, string>
}

/**
 * LINEサービスメッセージテンプレート定義
 */
export const notificationTemplates: Record<NotificationType, NotificationTemplate> = {
  application_received: {
    templateName: 'entry_s_t_ja',
    title: '応募を受け付けました',
    message: (ctx) => 
      `${ctx.auditionTitle} への応募が完了しました。選考結果は通知でお知らせします。`,
    actionUrl: (ctx, liffId) => 
      `line://app/${liffId}?redirect=/applications/${ctx.applicationId}`,
    params: (ctx, liffId) => ({
      number: ctx.applicationId.substring(0, 8).toUpperCase(),  // 受付番号（IDの先頭8文字）
      btn1_url: `line://app/${liffId}?redirect=/applications/${ctx.applicationId}`,
      btn2_url: `line://app/${liffId}?redirect=/help`,
      btn3_url: `line://app/${liffId}?redirect=/applications/${ctx.applicationId}/edit`,
      btn4_url: `line://app/${liffId}?redirect=/applications/${ctx.applicationId}/withdraw`
    })
  },
  
  application_accepted: {
    templateName: 'application_passed_ja',
    title: '選考通過のお知らせ',
    message: (ctx) => 
      `おめでとうございます！${ctx.auditionTitle} の${ctx.stepName}を通過しました。`,
    actionUrl: (ctx, liffId) => 
      `line://app/${liffId}?redirect=/applications/${ctx.applicationId}`,
    params: (ctx, liffId) => ({
      audition_title: ctx.auditionTitle,
      step_name: ctx.stepName,
      button_uri_1: `line://app/${liffId}?redirect=/applications/${ctx.applicationId}`
    })
  },
  
  application_rejected: {
    templateName: 'application_failed_ja',
    title: '選考結果のお知らせ',
    message: (ctx) => 
      `${ctx.auditionTitle} の選考結果をお知らせします。残念ながら今回は見送りとなりました。`,
    actionUrl: (ctx, liffId) => 
      `line://app/${liffId}?redirect=/applications/${ctx.applicationId}`,
    params: (ctx, liffId) => ({
      audition_title: ctx.auditionTitle,
      button_uri_1: `line://app/${liffId}?redirect=/applications/${ctx.applicationId}`
    })
  },
  
  new_application: {
    templateName: 'new_application_email',
    title: '新しい応募が届きました',
    message: (ctx) => 
      `${ctx.applicantName} さんが ${ctx.auditionTitle} に応募しました。`,
    // 主催者向けはメールなのでactionUrlなし
  },
  
  audition_deadline_reminder: {
    templateName: 'deadline_reminder_ja',
    title: '応募締切が迫っています',
    message: (ctx) => 
      `${ctx.auditionTitle} の応募締切が ${ctx.deadlineDate} に迫っています。`,
    actionUrl: (ctx, liffId) => 
      `line://app/${liffId}?redirect=/auditions/${ctx.auditionId}`,
    params: (ctx, liffId) => ({
      audition_title: ctx.auditionTitle,
      deadline_date: ctx.deadlineDate,
      button_uri_1: `line://app/${liffId}?redirect=/auditions/${ctx.auditionId}`
    })
  },
  
  audition_status_changed: {
    templateName: 'audition_status_changed_ja',
    title: 'オーディション情報が更新されました',
    message: (ctx) => 
      `${ctx.auditionTitle} の情報が更新されました。詳細をご確認ください。`,
    actionUrl: (ctx, liffId) => 
      `line://app/${liffId}?redirect=/auditions/${ctx.auditionId}`,
    params: (ctx, liffId) => ({
      audition_title: ctx.auditionTitle,
      button_uri_1: `line://app/${liffId}?redirect=/auditions/${ctx.auditionId}`
    })
  }
} as const

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
 */
export const emailTemplates: Partial<Record<NotificationType, EmailTemplate>> = {
  new_application: {
    subject: '【Casto】新しい応募が届きました',
    htmlBody: (ctx) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4A90E2; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background-color: #4A90E2; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>新しい応募が届きました</h2>
          </div>
          <div class="content">
            <p><strong>オーディション名:</strong> ${ctx.auditionTitle}</p>
            <p><strong>応募者:</strong> ${ctx.applicantName}</p>
            <p><strong>応募日時:</strong> ${ctx.appliedAt}</p>
            <a href="${ctx.reviewUrl}" class="button">応募詳細を確認する</a>
          </div>
          <div class="footer">
            <p>このメールは Casto から自動送信されています。</p>
          </div>
        </div>
      </body>
      </html>
    `,
    textBody: (ctx) => `
新しい応募が届きました

オーディション名: ${ctx.auditionTitle}
応募者: ${ctx.applicantName}
応募日時: ${ctx.appliedAt}

応募詳細を確認: ${ctx.reviewUrl}

---
このメールは Casto から自動送信されています。
    `
  }
}
