// API keys are stored locally on device only — never sent to our servers in plain text.
// They are passed directly to the edge function which uses them to call the AI provider.
const STORAGE_KEY = 'kindle-your-start:api-keys:v1';

export interface ApiKeys {
  openaiApiKey: string;
  openrouterApiKey: string;
}

function load(): ApiKeys {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { openaiApiKey: '', openrouterApiKey: '' };
    return JSON.parse(raw) as ApiKeys;
  } catch {
    return { openaiApiKey: '', openrouterApiKey: '' };
  }
}

function save(keys: ApiKeys): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch {
    // Private browsing or quota exceeded — silently ignore
  }
}

export function getApiKeys(): ApiKeys {
  return load();
}

export function setApiKeys(keys: Partial<ApiKeys>): void {
  save({ ...load(), ...keys });
}

export function clearApiKeys(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
