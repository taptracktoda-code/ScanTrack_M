/** @jest-environment jsdom */
import { act } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Linking } from 'react-native';
import { createRoot, type Root } from 'react-dom/client';
import SettingsScreen from '../app/settings/index';
import AttendanceScreen from '../app/(tabs)/attendance';
import ReportIssueScreen from '../app/settings/report-issue';
import IssuesScreen from '../app/settings/issues';
import IndexScreen from '../app/index';
import { WelcomeOnboarding } from './welcome-onboarding';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/api';
import { useAuth } from '../context/auth';
import { useApi } from './page';

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({}), useRouter: () => ({ push: mockPush, replace: mockReplace }), useFocusEffect: jest.fn(), Redirect: ({ href }: any) => <span>Route: {href}</span> }));
jest.mock('@react-native-async-storage/async-storage', () => ({ getItem: jest.fn(), setItem: jest.fn() }));
jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
jest.mock('expo-symbols', () => ({ SymbolView: () => <span aria-hidden="true" /> }));
jest.mock('../hooks/use-responsive-layout', () => ({ useResponsiveLayout: () => ({ horizontalPadding: 18, isShort: false }) }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: ({ children }: any) => <div>{children}</div> }));
jest.mock('../context/auth', () => ({ useAuth: jest.fn() }));
jest.mock('../hooks/use-queue-refresh', () => ({ useQueueRefresh: jest.fn() }));
jest.mock('../services/api', () => ({ apiService: { getIssues: jest.fn(), getDailyManagerReport: jest.fn(), getDashboardData: jest.fn(), submitIssue: jest.fn(), decideIssue: jest.fn() } }));
jest.mock('./themed-text', () => ({ ThemedText: ({ children }: any) => <span>{children}</span> }));
jest.mock('./error-state', () => ({ ErrorState: () => <span>Error</span> }));
jest.mock('./summary-card', () => ({ SummaryCard: ({ label, value }: any) => <span>{label}: {value}</span> }));
jest.mock('./page', () => ({
  Page: ({ title, children }: any) => <div><h1>{title}</h1>{children}</div>, styles: {}, useApi: jest.fn(),
}));
jest.mock('./index', () => ({
  AttendanceCard: () => null, AttendanceRecord: () => null, DateSelector: () => null,
  EmptyState: ({ message }: any) => <span>{message}</span>, SegmentedControl: () => null, SummaryCard: () => null,
}));
jest.mock('react-native', () => ({
  Linking: { openURL: jest.fn() },
  StyleSheet: { create: (styles: any) => styles },
  View: ({ children }: any) => <div>{children}</div>, ActivityIndicator: () => <span>Loading</span>,
  Pressable: ({ children, onPress, disabled }: any) => <button onClick={onPress} disabled={disabled}>{children}</button>,
  TextInput: ({ value, onChangeText }: any) => <input value={value} onChange={event => onChangeText(event.target.value)} />,
}));

let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
  jest.clearAllMocks();
  jest.mocked(useApi).mockReturnValue({ data: { pending_count: 3, data: { date: '2026-11-08', completed_trips: 0, entry_events: 0, exit_events: 0, queue_removals: 0 } }, loading: false, error: null, refreshing: false, retry: jest.fn(), refresh: jest.fn(), lastSuccess: null } as any);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });

it('places reports below My Attendance for managers and never renders them for drivers', async () => {
  jest.mocked(useAuth).mockReturnValue({ isManager: true } as any);
  await act(async () => root.render(<AttendanceScreen />));
  const managerText = container.textContent || '';
  expect(managerText.indexOf('My Attendance')).toBeGreaterThanOrEqual(0);
  expect(managerText.indexOf('Daily Manager Reports')).toBeGreaterThan(managerText.indexOf('My Attendance'));
  jest.mocked(useAuth).mockReturnValue({ isManager: false } as any);
  await act(async () => root.render(<AttendanceScreen />));
  expect(container.textContent).toContain('My Attendance');
  expect(container.textContent).not.toContain('Daily Manager Reports');
});

it('routes driver Settings to the existing password screen and exposes driver request actions', async () => {
  jest.mocked(useAuth).mockReturnValue({ isManager: false } as any);
  await act(async () => root.render(<SettingsScreen />));
  expect(container.textContent).toContain('Report an Issue');
  expect(container.textContent).toContain('My Requests');
  const button = [...container.querySelectorAll('button')].find(item => item.textContent === 'Change Password');
  expect(button).toBeDefined();
  await act(async () => button!.click());
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/change-password', params: { from: 'driver-settings' } });
});

it('exposes manager review with a pending count and excludes driver-only Settings actions', async () => {
  jest.mocked(useAuth).mockReturnValue({ isManager: true } as any);
  await act(async () => root.render(<SettingsScreen />));
  expect(container.textContent).toContain('Driver Issue Requests (3 pending)');
  expect(container.textContent).not.toContain('Change Password');
  expect(container.textContent).not.toContain('Report an Issue');
});

function reportButton() {
  return [...container.querySelectorAll('button')].find(item => /Submit report|Submitting|Retry original/.test(item.textContent || ''))!;
}

async function fillReason(value: string) {
  const input = container.querySelector('textarea, input')!;
  await act(async () => {
    const prototype = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

function mockReportQueue(queue: any, wrapped = true) {
  jest.mocked(useAuth).mockReturnValue({ isDriver: true } as any);
  jest.mocked(useApi).mockReturnValue({ data: wrapped ? { data: { queue } } : { queue }, loading: false, error: null, refreshing: false, retry: jest.fn(), refresh: jest.fn().mockResolvedValue(undefined), lastSuccess: null } as any);
}

it.each([true, false])('submits Others with required details using dashboard wrapped=%s', async wrapped => {
  mockReportQueue({ status: 'WAITING', entry_id: 42 }, wrapped);
  jest.mocked(apiService.submitIssue).mockResolvedValue({ success: true });
  await act(async () => root.render(<ReportIssueScreen />));
  await act(async () => [...container.querySelectorAll<HTMLElement>('[role="radio"], button')].find(item => item.textContent?.includes('Others (reason)'))!.click());
  expect(reportButton().disabled).toBe(true);
  await fillReason('   ');
  expect(reportButton().disabled).toBe(true);
  await fillReason('  Family emergency; need assistance  ');
  expect(reportButton().disabled).toBe(false);
  await act(async () => reportButton().click());
  expect(apiService.submitIssue).toHaveBeenCalledWith(expect.objectContaining({ type: 'other', explanation: 'Family emergency; need assistance', queue_entry_id: null }));
  expect(mockReplace).toHaveBeenCalledWith({ pathname: '/settings/issues', params: { submitted: '1' } });
});

it.each([{ status: 'SERVING', entry_id: 42 }, { status: 'WAITING' }, null])('blocks submission without a waiting entry: %s', async queue => {
  mockReportQueue(queue);
  await act(async () => root.render(<ReportIssueScreen />));
  await fillReason('Need help');
  expect(reportButton().disabled).toBe(true);
  expect(apiService.submitIssue).not.toHaveBeenCalled();
});

it('preserves the original request on uncertain retries and blocks overlapping taps', async () => {
  mockReportQueue({ status: 'WAITING', entry_id: 42 });
  let rejectRequest!: (reason: Error) => void;
  jest.mocked(apiService.submitIssue).mockImplementationOnce(() => new Promise((_, reject) => { rejectRequest = reject; }));
  await act(async () => root.render(<ReportIssueScreen />));
  await fillReason('Flat tire');
  await act(async () => { reportButton().click(); reportButton().click(); });
  expect(apiService.submitIssue).toHaveBeenCalledTimes(1);
  expect(reportButton().disabled).toBe(true);
  await act(async () => rejectRequest(new Error('Network Error')));
  const original = jest.mocked(apiService.submitIssue).mock.calls[0][0];
  mockReportQueue({ status: 'CANCELLED', entry_id: 43 });
  await act(async () => root.render(<ReportIssueScreen />));
  jest.mocked(apiService.submitIssue).mockResolvedValueOnce({ success: true });
  await act(async () => reportButton().click());
  expect(apiService.submitIssue).toHaveBeenLastCalledWith(original);
  expect(mockReplace).toHaveBeenCalledWith({ pathname: '/settings/issues', params: { submitted: '1' } });
});

it.each([null, { status: 'SERVING', entry_id: 42 }, { status: 'CANCELLED', entry_id: 43 }])('submits a general report without a waiting entry: %s', async queue => {
  mockReportQueue(queue);
  jest.mocked(apiService.submitIssue).mockResolvedValueOnce({ success: true });
  await act(async () => root.render(<ReportIssueScreen />));
  await act(async () => [...container.querySelectorAll<HTMLElement>('[role="radio"], button')].find(item => item.textContent?.includes('Others (reason)'))!.click());
  await fillReason('Concern about terminal facilities');
  expect(reportButton().disabled).toBe(false);
  await act(async () => reportButton().click());
  expect(apiService.submitIssue).toHaveBeenCalledWith(expect.objectContaining({ type: 'other', queue_entry_id: null }));
});

it('allows general reports when queue lookup fails and keeps queue requests disabled', async () => {
  mockReportQueue(null);
  jest.mocked(useApi).mockReturnValue({ data: {}, loading: false, error: 'Queue unavailable', refreshing: false, retry: jest.fn(), refresh: jest.fn().mockResolvedValue(undefined), lastSuccess: null } as any);
  await act(async () => root.render(<ReportIssueScreen />));
  await fillReason('Concern about facilities');
  expect(reportButton().disabled).toBe(true);
  await act(async () => [...container.querySelectorAll<HTMLElement>('[role="radio"], button')].find(item => item.textContent?.includes('Others (reason)'))!.click());
  expect(reportButton().disabled).toBe(false);
});

it('approves general reports with no removal confirmation', async () => {
  jest.mocked(useAuth).mockReturnValue({ isManager: true } as any);
  jest.mocked(useApi).mockReturnValue({ data: { data: [{ id: 9, type: 'other', driver_name: 'Driver', explanation: 'Terminal concern', queue_entry_id: null, queue_status: null, status: 'pending', can_approve: true, created_at: '2026-11-09T00:00:00Z' }] }, loading: false, error: null, refreshing: false, refresh: jest.fn().mockResolvedValue(undefined) } as any);
  jest.mocked(apiService.decideIssue).mockResolvedValueOnce({ success: true });
  await act(async () => root.render(<IssuesScreen />));
  await act(async () => [...container.querySelectorAll('button')].find(item => item.textContent === 'Review approval')!.click());
  expect(container.textContent).toContain('Queue status stays unchanged.');
  expect(container.textContent).not.toContain('Confirm approval and removal');
  await fillReason('We will review this concern');
  await act(async () => [...container.querySelectorAll('button')].find(item => item.textContent === 'Confirm approval')!.click());
  expect(apiService.decideIssue).toHaveBeenCalledWith(9, 'approved', 'We will review this concern', false);
});

function buttonNamed(name: string) {
  return [...container.querySelectorAll('button')].find(button => button.textContent === name)!;
}

it('walks through the welcome slides, supports Back, and completes on Get Started', async () => {
  const complete = jest.fn().mockResolvedValue(undefined);
  await act(async () => root.render(<WelcomeOnboarding onComplete={complete} />));
  expect(container.textContent).toContain('Hello, welcome to ScanTrack');
  await act(async () => buttonNamed('Next').click());
  expect(container.textContent).toContain('One QR code. A smoother check-in.');
  await act(async () => buttonNamed('Back').click());
  expect(container.textContent).toContain('Hello, welcome to ScanTrack');
  await act(async () => buttonNamed('Next').click());
  await act(async () => buttonNamed('Next').click());
  expect(container.textContent).toContain('Stay on top of your day');
  expect(complete).not.toHaveBeenCalled();
  await act(async () => buttonNamed('Get Started').click());
  expect(complete).toHaveBeenCalledTimes(1);
});

it('shows welcome on first launch, saves Skip, and sends returning users to Login', async () => {
  jest.mocked(useAuth).mockReturnValue({ isLoading: false, isSignedIn: false } as any);
  jest.mocked(AsyncStorage.getItem).mockResolvedValueOnce(null);
  jest.mocked(AsyncStorage.setItem).mockResolvedValue(undefined);
  await act(async () => root.render(<IndexScreen />));
  expect(container.textContent).toContain('Hello, welcome to ScanTrack');
  await act(async () => buttonNamed('Skip').click());
  expect(AsyncStorage.setItem).toHaveBeenCalledWith('scantrack.onboarding.completed.v1', 'true');
  expect(container.textContent).toContain('Route: /login');
  await act(async () => root.render(null));
  jest.mocked(AsyncStorage.getItem).mockResolvedValueOnce('true');
  await act(async () => root.render(<IndexScreen />));
  expect(container.textContent).toContain('Route: /login');
  expect(container.textContent).not.toContain('Hello, welcome');
});

it.each(['driver', 'manager'])('keeps signed-in %s users on their dashboard without onboarding', async role => {
  jest.mocked(useAuth).mockReturnValue({ isLoading: false, isSignedIn: true, role } as any);
  jest.mocked(AsyncStorage.getItem).mockResolvedValueOnce(null);
  await act(async () => root.render(<IndexScreen />));
  expect(container.textContent).toContain(`Route: ${role === 'manager' ? '/admin/dashboard' : '/(tabs)'}`);
  expect(container.textContent).not.toContain('Hello, welcome');
});

it('keeps Login accessible when onboarding storage fails', async () => {
  jest.mocked(useAuth).mockReturnValue({ isLoading: false, isSignedIn: false } as any);
  jest.mocked(AsyncStorage.getItem).mockRejectedValueOnce(new Error('Storage unavailable'));
  jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('Storage unavailable'));
  await act(async () => root.render(<IndexScreen />));
  expect(container.textContent).toContain('Hello, welcome');
  await act(async () => buttonNamed('Skip').click());
  expect(container.textContent).toContain('Route: /login');
});

it('attaches a selected photo to the submitted report and supports removal', async () => {
  mockReportQueue({ status: 'WAITING', entry_id: 42 });
  jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///evidence.jpg', fileName: 'evidence.jpg', mimeType: 'image/jpeg', fileSize: 1024 }] } as any);
  jest.mocked(apiService.submitIssue).mockResolvedValue({ success: true });
  await act(async () => root.render(<ReportIssueScreen />));
  await act(async () => buttonNamed('Add photo').click());
  expect(container.textContent).toContain('evidence.jpg');
  await act(async () => buttonNamed('Remove').click());
  expect(container.textContent).not.toContain('evidence.jpg');
  await act(async () => buttonNamed('Add photo').click());
  await fillReason('Flat tire with evidence');
  await act(async () => reportButton().click());
  expect(apiService.submitIssue).toHaveBeenCalledWith(expect.objectContaining({ attachments: [expect.objectContaining({ uri: 'file:///evidence.jpg', name: 'evidence.jpg', type: 'image/jpeg' })] }));
});

it('rejects oversized photos before submission', async () => {
  mockReportQueue({ status: 'WAITING', entry_id: 42 });
  jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///large.jpg', mimeType: 'image/jpeg', fileSize: 6 * 1024 * 1024 }] } as any);
  await act(async () => root.render(<ReportIssueScreen />));
  await act(async () => buttonNamed('Add photo').click());
  expect(container.textContent).toContain('Each attachment must be 5 MB or smaller.');
  expect(container.textContent).not.toContain('large.jpg');
});

it('previews manager report photos without opening a download and uses refreshed attachment URLs', async () => {
  jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  jest.mocked(useAuth).mockReturnValue({ isManager: true } as any);
  const file = { name: 'evidence.jpg', size: 1024, url: 'https://example.com/signed-photo' };
  const data = { data: [{ id: 9, type: 'other', explanation: 'Concern', status: 'approved', created_at: '2026-11-09T00:00:00Z', attachments: [file] }] };
  jest.mocked(useApi).mockReturnValue({ data, loading: false, error: null } as any);
  await act(async () => root.render(<IssuesScreen />));
  expect(container.querySelector('img')?.getAttribute('src')).toBe(file.url);
  expect(container.textContent).not.toContain('Download evidence.jpg');
  expect(Linking.openURL).not.toHaveBeenCalled();
  file.url = 'https://example.com/renewed-photo';
  await act(async () => root.render(<IssuesScreen />));
  expect(container.querySelector('img')?.getAttribute('src')).toBe(file.url);
  expect(container.textContent).not.toContain('Unable to load photo');
});

it('shows the backend attachment and recorded web review to the driver', async () => {
  jest.mocked(useAuth).mockReturnValue({ isManager: false } as any);
  jest.mocked(useApi).mockReturnValue({ data: { data: [{ id: 9, type: 'other', explanation: 'Concern', queue_entry_id: null, status: 'approved', created_at: '2026-11-09T00:00:00Z', decision_reason: 'Repair scheduled', manager_name: 'Web Manager', decided_at: '2026-11-09T01:00:00Z', attachments: [{ name: 'evidence.jpg', size: 1024, url: 'https://example.com/signed-download' }] }] }, loading: false, error: null } as any);
  jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  await act(async () => root.render(<IssuesScreen />));
  expect(container.textContent).toContain('Repair scheduled');
  expect(container.textContent).toContain('Web Manager');
  await act(async () => [...container.querySelectorAll<HTMLElement>('button, a, [role=link]')].find(item => item.textContent?.includes('Download evidence.jpg'))!.click());
  expect(Linking.openURL).toHaveBeenCalledWith('https://example.com/signed-download');
  expect(container.textContent).not.toContain('Review approval');
});
