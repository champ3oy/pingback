import { FunctionOptions } from './types';

export interface FunctionMetadata {
  name: string;
  type: 'cron' | 'task';
  schedule?: string;
  options: FunctionOptions;
}

export interface RegistrationResponse {
  jobs: Array<{ name: string; status: string }>;
}

export class RegistrationClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {}

  async register(
    functions: FunctionMetadata[],
    options?: { projectId?: string; endpointUrl?: string },
  ): Promise<RegistrationResponse> {
    const body: Record<string, unknown> = { functions };
    if (options?.projectId) body.project_id = options.projectId;
    if (options?.endpointUrl) body.endpoint_url = options.endpointUrl;
    const response = await fetch(`${this.baseUrl}/api/v1/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Registration failed (${response.status}): ${text}`);
    }

    return response.json() as Promise<RegistrationResponse>;
  }
}
