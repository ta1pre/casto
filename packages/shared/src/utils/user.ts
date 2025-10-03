import type { SupabaseUserRow, UserResponse } from '../types/user'

export const mapRoles = (role?: string | null): string[] => {
  if (!role) {
    return []
  }
  return [role]
}

export const serializeUserResponse = (user: SupabaseUserRow): UserResponse => {
  return {
    id: user.id,
    email: user.email ?? null,
    lineUserId: user.line_user_id ?? null,
    displayName: user.display_name ?? null,
    role: user.role ?? null,
    provider: user.auth_provider ?? null,
    tokenVersion: user.token_version ?? 0,
    isActive: user.is_active ?? false,
    createdAt: user.created_at ?? null,
    updatedAt: user.updated_at ?? null
  }
}
