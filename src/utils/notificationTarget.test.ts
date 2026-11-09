import { notificationTarget } from './notificationTarget';

it('opens current queue screens using the signed-in role, without trusting notification URLs', () => {
  expect(notificationTarget({ screen: 'dashboard', entry_id: 12 }, false)).toBe('/(tabs)');
  expect(notificationTarget({ screen: 'dashboard' }, true)).toBe('/admin/dashboard');
  expect(notificationTarget({ screen: 'issues' }, false)).toBe('/settings/issues');
  expect(notificationTarget({ screen: 'https://example.com' }, false)).toBeNull();
});
