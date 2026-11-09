import { QueueMutationGuard } from './queueMutation';

describe('queue mutation recovery', () => {
  it('blocks duplicate submissions while the first action is pending', async () => {
    const guard = new QueueMutationGuard();
    let finish!: () => void;
    const action = guard.run(jest.fn(), () => new Promise<void>(resolve => { finish = resolve; }));
    const duplicate = jest.fn();
    await expect(guard.run(jest.fn(), duplicate)).rejects.toThrow('still processing');
    expect(duplicate).not.toHaveBeenCalled();
    finish(); await action;
  });

  it('requires a successful server refresh before retrying an uncertain action', async () => {
    const guard = new QueueMutationGuard();
    await expect(guard.run(jest.fn(), () => Promise.reject(new Error('timeout')))).rejects.toThrow('timeout');
    const mutate = jest.fn().mockResolvedValue('confirmed');
    await expect(guard.run(() => Promise.reject(new Error('offline')), mutate)).rejects.toThrow('unconfirmed');
    expect(mutate).not.toHaveBeenCalled();
    const events: string[] = [];
    await expect(guard.run(async () => { events.push('refresh'); }, async () => { events.push('mutation'); return 'confirmed'; })).resolves.toBe('confirmed');
    expect(events).toEqual(['refresh', 'mutation']);
  });

  it('treats server failures and incomplete acknowledgments as uncertain', async () => {
    for (const failure of [{ response: { status: 500 } }, { name: 'ScanConfirmationError', response: { status: 200 } }]) {
      const guard = new QueueMutationGuard();
      await guard.run(jest.fn(), () => Promise.reject(failure)).catch(() => {});
      const reconcile = jest.fn().mockResolvedValue(undefined);
      await guard.run(reconcile, async () => 'ok');
      expect(reconcile).toHaveBeenCalledTimes(1);
    }
  });

  it('allows a corrected validation error without requiring uncertain-state recovery', async () => {
    const guard = new QueueMutationGuard();
    await guard.run(jest.fn(), () => Promise.reject({ response: { status: 422 } })).catch(() => {});
    const reconcile = jest.fn();
    await guard.run(reconcile, async () => 'ok');
    expect(reconcile).not.toHaveBeenCalled();
  });
});
