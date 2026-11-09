export function notificationTarget(data: Record<string, unknown> | undefined, isManager: boolean) {
  if (data?.screen === 'dashboard') return isManager ? '/admin/dashboard' as const : '/(tabs)' as const;
  if (data?.screen === 'issues') return '/settings/issues' as const;
  return null;
}
