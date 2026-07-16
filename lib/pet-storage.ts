export interface ChatMessage {
  role: 'user' | 'cat';
  text: string;
}

export interface PetConfig {
  apiBaseUrl: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
}

const CONFIG_KEY = 'pet-config';
const HISTORY_KEY = 'pet-history';
const MAX_HISTORY = 50;

export function loadConfig(defaults: PetConfig): PetConfig {
  if (typeof window === 'undefined') return defaults;
  try {
    const s = sessionStorage.getItem(CONFIG_KEY);
    if (s) return { ...defaults, ...JSON.parse(s) };
  } catch {}
  return defaults;
}

export function saveConfig(c: PetConfig): void {
  try { sessionStorage.setItem(CONFIG_KEY, JSON.stringify(c)); } catch {}
}

export function loadHistory(): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const s = sessionStorage.getItem(HISTORY_KEY);
    if (s) {
      const parsed = JSON.parse(s);
      return Array.isArray(parsed) ? parsed.slice(-MAX_HISTORY) : [];
    }
  } catch {}
  return [];
}

export function saveHistory(m: ChatMessage[]): void {
  try { sessionStorage.setItem(HISTORY_KEY, JSON.stringify(m.slice(-MAX_HISTORY))); } catch {}
}
