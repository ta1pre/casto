/**
 * LIFF SDKの型定義
 */

declare global {
  interface Window {
    liff: {
      init: (config: { liffId: string }) => Promise<void>
      isLoggedIn: () => boolean
      login: (options?: { redirectUri?: string }) => void
      logout: () => void
      getProfile: () => Promise<{
        userId: string
        displayName: string
        pictureUrl?: string
        statusMessage?: string
      }>
      getIDToken: () => string | null
      getDecodedIDToken: () => any
      getAccessToken: () => string | null
      getContext: () => {
        type: 'utou' | 'room' | 'group' | 'external'
        userId?: string
        groupId?: string
        roomId?: string
        endpointUrl?: string
      }
      closeWindow: () => void
      openWindow: (options: { url: string; external?: boolean }) => void
      scanCode: () => Promise<{ value: string }>
      shareTargetPicker: (messages: Array<{
        type: 'text' | 'image' | 'video' | 'audio' | 'location' | 'sticker'
        text?: string
        originalContentUrl?: string
        previewImageUrl?: string
      }>) => Promise<void>
      sendMessages: (messages: Array<{
        type: 'text' | 'image' | 'video' | 'audio' | 'location' | 'sticker'
        text?: string
        originalContentUrl?: string
        previewImageUrl?: string
      }>) => Promise<void>
    }
  }
}

export {}
