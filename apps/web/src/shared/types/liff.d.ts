declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_LIFF_ID: string
    }
  }
}

declare module '@line/liff' {
  interface LiffProfile {
    userId: string
    displayName: string
    pictureUrl?: string
    statusMessage?: string
  }

  interface Liff {
    init(config: { liffId: string }): Promise<void>
    isLoggedIn(): boolean
    login(): void
    logout(): void
    getProfile(): Promise<LiffProfile>
  }

  const liff: Liff
  export default liff
}
