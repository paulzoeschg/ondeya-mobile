import AsyncStorage from '@react-native-async-storage/async-storage';

// 2026-05-14 (Bug F): Profile-Store für Name und Avatar. Brauchen wir, damit
// der Profil-Tab-Icon (Avatar oder Fallback) reaktiv auf Änderungen reagieren
// kann. Speicher-Key bleibt der bestehende @ondeya_profile aus profile.tsx.

const STORAGE_KEY = '@ondeya_profile';

export type ProfileData = {
  name: string;
  avatarUri: string | null;
};

const defaultProfile: ProfileData = {
  name: '',
  avatarUri: null,
};

let profile: ProfileData = { ...defaultProfile };
let loaded = false;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((l) => l());

export async function loadProfile(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ProfileData>;
      profile = {
        name: typeof parsed.name === 'string' ? parsed.name : '',
        avatarUri: typeof parsed.avatarUri === 'string' ? parsed.avatarUri : null,
      };
    }
  } catch (e) {
    console.log('Profile load error:', e);
  } finally {
    loaded = true;
    notify();
  }
}

export function getProfile(): ProfileData {
  return { ...profile };
}

export function isProfileLoaded(): boolean {
  return loaded;
}

export function setProfile(updates: Partial<ProfileData>): void {
  profile = { ...profile, ...updates };
  notify();
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile)).catch((e) => {
    console.log('Profile save error:', e);
  });
}

export function subscribeProfile(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
