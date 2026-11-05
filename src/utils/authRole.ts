export type AuthenticatedAppRole = 'manager' | 'driver';
export type BackendRoleResolution = AuthenticatedAppRole | 'unauthorized' | null;

type RoleRecord = Record<string, unknown>;

function isRecord(value: unknown): value is RoleRecord {
  return typeof value === 'object' && value !== null;
}

function getRole(value: unknown): unknown {
  if (!isRecord(value)) return undefined;

  const roles = value.roles;
  const firstRole = Array.isArray(roles) ? roles[0] : undefined;
  const namedRole = isRecord(firstRole) ? firstRole.name : firstRole;
  const directRole = isRecord(value.role) ? value.role.name : value.role;

  return directRole ??
    value.user_role ??
    value.account_type ??
    value.user_type ??
    value.type ??
    namedRole;
}

export function resolveBackendRole(authUser: unknown, payload: unknown): BackendRoleResolution {
  const response = isRecord(payload) ? payload : {};
  const nestedUser = isRecord(response.user) ? response.user : undefined;
  const manager = isRecord(response.manager) ? response.manager : undefined;
  const driver = isRecord(response.driver) ? response.driver : undefined;
  const data = isRecord(response.data) ? response.data : undefined;
  const dataUser = data && isRecord(data.user) ? data.user : undefined;
  const dataManager = data && isRecord(data.manager) ? data.manager : undefined;
  const dataDriver = data && isRecord(data.driver) ? data.driver : undefined;
  const role = [
    getRole(authUser),
    getRole(response),
    getRole(nestedUser),
    getRole(manager),
    getRole(driver),
    getRole(data),
    getRole(dataUser),
    getRole(dataManager),
    getRole(dataDriver),
  ].find((candidate) => typeof candidate === 'string' && candidate.trim());

  if (typeof role === 'string') {
    const normalized = role.toLowerCase().replace(/[\s-]+/g, '_');
    if (['manager', 'organization_manager', 'toda_manager'].includes(normalized)) return 'manager';
    if (['driver', 'operator'].includes(normalized)) return 'driver';
    return 'unauthorized';
  }

  const roleSources = [authUser, response, nestedUser, manager, driver, data, dataUser, dataManager, dataDriver];
  const hasFlag = (flag: string) => roleSources.some((source) => isRecord(source) && source[flag] === true);
  if (hasFlag('is_admin') || hasFlag('admin')) return 'unauthorized';
  const managerFlag = hasFlag('is_manager') || hasFlag('manager');
  const driverFlag = hasFlag('is_driver') || hasFlag('driver');
  if (managerFlag && driverFlag) return 'unauthorized';
  if (managerFlag) return 'manager';
  if (driverFlag) return 'driver';

  if (manager || dataManager) return 'manager';
  if (driver || dataDriver) return 'driver';
  if (isRecord(response.admin) || (data && isRecord(data.admin))) return 'unauthorized';
  return null;
}
