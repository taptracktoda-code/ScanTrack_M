import { resolveBackendRole } from './authRole';

describe('resolveBackendRole', () => {
  it.each([
    ['manager', { role: 'manager' }, 'manager'],
    ['organization manager', { user: { roles: [{ name: 'organization_manager' }] } }, 'manager'],
    ['driver', { role: 'driver' }, 'driver'],
    ['operator', { user: { role: 'operator' } }, 'driver'],
  ])('recognizes the backend %s role', (_description, payload, expected) => {
    expect(resolveBackendRole(payload, payload)).toBe(expected);
  });

  it.each([
    ['Super Admin', { role: 'super_admin' }],
    ['admin', { role: 'admin' }],
    ['unknown', { role: 'reviewer' }],
  ])('does not grant mobile access for %s role data', (_description, payload) => {
    expect(resolveBackendRole(payload, payload)).toBe('unauthorized');
  });

  it('does not infer a mobile role when the backend omits role data', () => {
    expect(resolveBackendRole({}, {})).toBeNull();
  });

  it('recognizes a manager explicitly returned in the backend response', () => {
    expect(resolveBackendRole({}, { manager: { id: 5 } })).toBe('manager');
  });

  it('recognizes backend role flags when no role string is provided', () => {
    expect(resolveBackendRole({}, { user: { is_manager: true } })).toBe('manager');
    expect(resolveBackendRole({}, { user: { is_driver: true } })).toBe('driver');
  });

  it('does not treat an admin response as a manager response', () => {
    expect(resolveBackendRole({}, { admin: { id: 5 } })).toBe('unauthorized');
    expect(resolveBackendRole({}, { is_admin: true })).toBe('unauthorized');
  });
});
