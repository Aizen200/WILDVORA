import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY   = 'wildvora_recently_viewed';
const LIMIT = 10;

export async function addToRecentlyViewed(experience) {
  try {
    const raw  = await AsyncStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    const filtered = list.filter(e => e._id !== experience._id);
    const next = [experience, ...filtered].slice(0, LIMIT);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
}

export async function getRecentlyViewed() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
