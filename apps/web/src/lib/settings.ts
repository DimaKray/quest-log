/** Налаштування користувача живуть окремо від прогресу: скидання прогресу їх не чіпає. */
export const SETTINGS_KEY = "questlog:settings:v1";

export interface Settings {
  sound: boolean;
}

export const defaultSettings = (): Settings => ({ sound: true });

/** Звук увімкнений, якщо його явно не вимкнули (стійко до пошкоджених даних). */
export const soundOn = (settings: Partial<Settings> | null | undefined): boolean =>
  settings?.sound !== false;