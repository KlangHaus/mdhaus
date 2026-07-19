export const PREFERENCES_STORAGE_KEY = "open-mdhaus-preferences";

export interface AppPreferences {
  spellcheck: boolean;
  autoBackup: boolean;
}

const DEFAULT_PREFERENCES: AppPreferences = {
  spellcheck: true,
  autoBackup: false,
};

export function loadPreferences(): AppPreferences {
  try {
    const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!stored) {
      return { ...DEFAULT_PREFERENCES };
    }

    const parsed = JSON.parse(stored) as Partial<AppPreferences>;
    return {
      spellcheck: parsed.spellcheck !== false,
      autoBackup: parsed.autoBackup === true,
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function savePreferences(preferences: Partial<AppPreferences>) {
  const current = loadPreferences();
  localStorage.setItem(
    PREFERENCES_STORAGE_KEY,
    JSON.stringify({ ...current, ...preferences }),
  );
}
