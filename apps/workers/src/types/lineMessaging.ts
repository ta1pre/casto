/**
 * LINE Messaging API 型定義
 * [SF][DRY] シンプル、重複排除
 * 
 * @see https://developers.line.biz/ja/reference/messaging-api/
 */

/**
 * LINEメッセージ基底型
 */
export interface LineMessage {
  type: 'text' | 'flex' | 'image' | 'video' | 'audio' | 'location' | 'sticker' | 'imagemap' | 'template'
}

/**
 * テキストメッセージ
 */
export interface LineTextMessage extends LineMessage {
  type: 'text'
  text: string
  emojis?: Array<{
    index: number
    productId: string
    emojiId: string
  }>
}

/**
 * Flexメッセージ（リッチなレイアウト）
 */
export interface LineFlexMessage extends LineMessage {
  type: 'flex'
  altText: string
  contents: FlexContainer
}

/**
 * Flexコンテナ
 */
export interface FlexContainer {
  type: 'bubble' | 'carousel'
  hero?: FlexComponent
  header?: FlexBox
  body?: FlexBox
  footer?: FlexBox
  styles?: FlexBubbleStyle
}

/**
 * Flexコンポーネント
 */
export type FlexComponent = FlexBox | FlexButton | FlexImage | FlexText | FlexSpacer | FlexFiller

export interface FlexBox {
  type: 'box'
  layout: 'horizontal' | 'vertical' | 'baseline'
  contents: FlexComponent[]
  backgroundColor?: string
  borderColor?: string
  borderWidth?: string
  cornerRadius?: string
  margin?: string
  paddingAll?: string
  paddingTop?: string
  paddingBottom?: string
  paddingStart?: string
  paddingEnd?: string
}

export interface FlexButton {
  type: 'button'
  action: LineAction
  flex?: number
  margin?: string
  height?: 'sm' | 'md'
  style?: 'primary' | 'secondary' | 'link'
  color?: string
  gravity?: 'top' | 'bottom' | 'center'
}

export interface FlexImage {
  type: 'image'
  url: string
  flex?: number
  size?: string
  aspectRatio?: string
  aspectMode?: 'cover' | 'fit'
  backgroundColor?: string
  action?: LineAction
}

export interface FlexText {
  type: 'text'
  text: string
  size?: string
  weight?: 'regular' | 'bold'
  color?: string
  align?: 'start' | 'center' | 'end'
  margin?: string
  wrap?: boolean
}

export interface FlexSpacer {
  type: 'spacer'
  size?: string
}

export interface FlexFiller {
  type: 'filler'
}

export interface FlexBubbleStyle {
  header?: {
    backgroundColor?: string
  }
  hero?: {
    backgroundColor?: string
  }
  body?: {
    backgroundColor?: string
  }
  footer?: {
    backgroundColor?: string
  }
}

/**
 * アクション
 */
export type LineAction = UriAction | MessageAction | PostbackAction

export interface UriAction {
  type: 'uri'
  label?: string
  uri: string
}

export interface MessageAction {
  type: 'message'
  label?: string
  text: string
}

export interface PostbackAction {
  type: 'postback'
  label?: string
  data: string
  displayText?: string
}

/**
 * プッシュメッセージリクエスト
 */
export interface PushMessageRequest {
  to: string  // LINE User ID
  messages: LineMessage[]
  notificationDisabled?: boolean
}

/**
 * マルチキャストメッセージリクエスト
 */
export interface MulticastMessageRequest {
  to: string[]  // LINE User IDs (最大500件)
  messages: LineMessage[]
  notificationDisabled?: boolean
}

/**
 * ブロードキャストメッセージリクエスト
 */
export interface BroadcastMessageRequest {
  messages: LineMessage[]
  notificationDisabled?: boolean
}
