const VAULT_KEY = 'ai2ai_api_keys';

export type ProviderVault = {
  gpt4: string;
  claude: string;
  gemini: string;
  mistral: string;
};

const EMPTY: ProviderVault = { gpt4: '', claude: '', gemini: '', mistral: '' };

export function loadVault(): ProviderVault {
  try {
    const raw = localStorage.getItem(VAULT_KEY);
    if (!raw) return { ...EMPTY };
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY };
  }
}

export function saveVault(keys: ProviderVault): void {
  localStorage.setItem(VAULT_KEY, JSON.stringify(keys));
}

export function clearVault(): void {
  localStorage.removeItem(VAULT_KEY);
}
