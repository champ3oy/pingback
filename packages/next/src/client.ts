export class PingbackClient {
  private platformUrl: string;
  private apiKey: string;

  constructor(options: { apiKey: string; platformUrl?: string }) {
    this.apiKey = options.apiKey;
    this.platformUrl = options.platformUrl || 'https://api.pingback.lol';
  }

  async trigger(taskName: string, payload?: any): Promise<{ executionId: string }> {
    const response = await fetch(`${this.platformUrl}/api/v1/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ task: taskName, payload }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to trigger task "${taskName}" (${response.status}): ${text}`);
    }

    return response.json() as Promise<{ executionId: string }>;
  }
}
