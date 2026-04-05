import { fetchAuthSession } from 'aws-amplify/auth';

const rawApiUrl = import.meta.env.VITE_API_URL as string | undefined;
if (!rawApiUrl) throw new Error('VITE_API_URL is not set. Add it to your Amplify environment variables.');
const API_URL = rawApiUrl.replace(/\/$/, '');

async function getAuthHeader(): Promise<{ Authorization: string }> {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) throw new Error('Not authenticated');
  return { Authorization: `Bearer ${token}` };
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const authHeader = await getAuthHeader();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
