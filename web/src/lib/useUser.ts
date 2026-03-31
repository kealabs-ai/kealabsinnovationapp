import { useState } from 'react';

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

const STORAGE_KEY = 'keaflow-user';

const DEFAULT: UserProfile = { name: '', email: '', role: '' };

function load(): UserProfile {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : DEFAULT;
  } catch { return DEFAULT; }
}

export function useUser() {
  const [user, setUser] = useState<UserProfile>(load);

  const save = (data: UserProfile) => {
    setUser(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  return { user, save };
}
