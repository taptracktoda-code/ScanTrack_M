export class QueueMutationGuard {
  private running = false;
  private uncertain = false;

  async run<T>(reconcile: () => Promise<unknown>, mutate: () => Promise<T>): Promise<T> {
    if (this.running) throw new Error('Another queue action is still processing. Please wait.');
    this.running = true;
    try {
      if (this.uncertain) {
        try { await reconcile(); }
        catch { throw new Error('The last action is unconfirmed. Reconnect and refresh the queue before trying again.'); }
        this.uncertain = false;
      }
      try { return await mutate(); }
      catch (error: any) {
        if (!error?.response || error.response.status >= 500 || error.name === 'ScanConfirmationError') this.uncertain = true;
        throw error;
      }
    } finally { this.running = false; }
  }
}
