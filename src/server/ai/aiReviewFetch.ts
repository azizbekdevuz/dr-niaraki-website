import 'server-only';

/**
 * Fetch with timeout covering headers and full response body consumption.
 * The abort timer is cleared only after `consume` completes.
 */
export async function fetchWithTimeout<T>(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  consume: (response: Response) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    return await consume(response);
  } finally {
    clearTimeout(timer);
  }
}

export type ChatMessage = { role: 'system' | 'user'; content: string };

export async function openAiCompatibleChat(opts: {
  url: string;
  apiKey?: string;
  extraHeaders?: Record<string, string>;
  model: string;
  messages: ChatMessage[];
  timeoutMs: number;
  responseFormatJson?: boolean;
}): Promise<string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...opts.extraHeaders,
  };
  if (opts.apiKey) {
    headers.Authorization = `Bearer ${opts.apiKey}`;
  }

  const body: Record<string, unknown> = {
    model: opts.model,
    messages: opts.messages,
    temperature: 0.2,
  };
  if (opts.responseFormatJson) {
    body.response_format = { type: 'json_object' };
  }

  return fetchWithTimeout(
    opts.url,
    { method: 'POST', headers, body: JSON.stringify(body) },
    opts.timeoutMs,
    async (res) => {
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Provider HTTP ${res.status}: ${text.slice(0, 300)}`);
      }

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Provider returned empty completion');
      }
      return content;
    },
  );
}
