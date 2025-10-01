import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase環境変数が設定されていません。NEXT_PUBLIC_SUPABASE_URLとNEXT_PUBLIC_SUPABASE_ANON_KEYを確認してください。')
}

/**
 * Supabaseクライアントインスタンス
 * ブラウザ側で使用するクライアント
 * 
 * ⚠️ 重要: http://localhost を使用しないこと
 * - ブラウザクライアントでは本番環境のSupabase Project URLを使用する
 * - 例: https://your-project-ref.supabase.co
 * - ローカル開発でもSupabase Cloudの本番プロジェクトに接続する
 * 
 * 参考: https://supabase.com/docs/guides/local-development/overview
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
