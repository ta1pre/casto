import type {
  SupabaseUserRow,
  UserResponse,
  UsersListResponse,
  UsersStats
} from '../types/user'

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
    tokenVersion: user.token_version ?? 0,
    isActive: user.is_active ?? false,
    createdAt: user.created_at ?? null,
    updatedAt: user.updated_at ?? null
  }
}

export const calculateUsersStats = (users: SupabaseUserRow[]): UsersStats => {
  const stats: UsersStats = {
    total: users.length,
    active: 0,
    inactive: 0,
    byProvider: {},
    byRole: {}
  }

  for (const user of users) {
    if (user.is_active) {
      stats.active += 1
    } else {
      stats.inactive += 1
    }

    // Provider情報はline_user_idの有無で判定
    const provider = user.line_user_id ? 'line' : user.email ? 'email' : 'unknown'
    stats.byProvider[provider] = (stats.byProvider[provider] ?? 0) + 1

    const role = user.role ?? 'unknown'
    stats.byRole[role] = (stats.byRole[role] ?? 0) + 1
  }

  return stats
}

export const buildUsersListResponse = (users: SupabaseUserRow[]): UsersListResponse => {
  const serializedUsers = users.map(serializeUserResponse)

  return {
    users: serializedUsers,
    count: serializedUsers.length,
    fetchedAt: new Date().toISOString(),
    stats: calculateUsersStats(users)
  }
}
