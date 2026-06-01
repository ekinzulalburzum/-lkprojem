import React, { createContext, useContext, useEffect, useState } from 'react';
import { Sheep, Lamb, HealthRecord, AnimalStatus, Gender, Reminder } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface LocalUser {
  displayName: string;
  email: string;
  farmName: string;
  photoURL?: string;
}

interface FirebaseContextType {
  user: LocalUser | null;
  loading: boolean;
  authError: string | null;
  setAuthError: (err: string | null) => void;
  db: any; // Compatibility placeholder
  auth: any; // Compatibility placeholder
  login: (displayName: string, farmName: string) => Promise<void>;
  logout: () => Promise<void>;
  handleError: (error: any, op: OperationType, path: string | null) => void;
  // Local CRUD API
  sheep: Sheep[];
  lambs: Lamb[];
  healthRecords: HealthRecord[];
  reminders: Reminder[];
  addSheep: (item: Sheep) => void;
  updateSheep: (id: string, updates: Partial<Sheep>) => void;
  deleteSheep: (id: string) => void;
  addLamb: (item: Omit<Lamb, 'id'>) => void;
  updateLamb: (id: string, updates: Partial<Lamb>) => void;
  deleteLamb: (id: string) => void;
  addHealthRecord: (item: Omit<HealthRecord, 'id'>) => void;
  deleteHealthRecord: (id: string) => void;
  addReminder: (item: Omit<Reminder, 'id' | 'createdAt' | 'completed'>) => void;
  updateReminder: (id: string, updates: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;
  toggleReminder: (id: string) => void;
  importBackup: (backupStr: string) => boolean;
  exportBackup: () => string;
}

const FirebaseContext = createContext<FirebaseContextType | null>(null);

// Initial mock local data to have a gorgeous onboarding feel
const INITIAL_SHEEP: Sheep[] = [
  {
    id: "TR34D671",
    name: "Kıvırcık",
    breed: "Merinos",
    birthDate: "2024-03-10",
    gender: Gender.Ewe,
    status: AnimalStatus.Healthy,
    notes: "İlk doğumunu sağlıklı yaptı. Anaç koyun.",
    createdAt: new Date("2026-01-10").toISOString(),
  },
  {
    id: "TR34D672",
    name: "Karabaş",
    breed: "Akkaraman",
    birthDate: "2023-11-24",
    gender: Gender.Ewe,
    status: AnimalStatus.Pregnant,
    notes: "Doğuma yaklaşık 2 hafta kaldı. Aşıları tamam.",
    createdAt: new Date("2026-01-12").toISOString(),
  },
  {
    id: "TR34D673",
    name: "Kral",
    breed: "İvesi",
    birthDate: "2023-05-15",
    gender: Gender.Ram,
    status: AnimalStatus.Healthy,
    notes: "Sürü lideri koç, damızlık.",
    createdAt: new Date("2026-01-15").toISOString(),
  }
];

const INITIAL_LAMBS: Lamb[] = [
  {
    id: "lamb_1",
    tagId: "TR-KUZU-001",
    motherId: "TR34D671",
    birthDate: new Date("2026-05-01T10:30:00Z").toISOString(),
    birthWeight: 3.8,
    gender: Gender.Female,
    status: "Annesini emiyor, sağlıklı büyüme gösteriyor.",
    createdAt: new Date("2026-05-01").toISOString(),
  },
  {
    id: "lamb_2",
    tagId: "TR-KUZU-002",
    motherId: "TR34D672",
    birthDate: new Date("2026-04-15T15:20:00Z").toISOString(),
    birthWeight: 4.2,
    gender: Gender.Male,
    status: "Sütten kesildi, yeme alıştı.",
    createdAt: new Date("2026-04-15").toISOString(),
  }
];

const INITIAL_HEALTH: HealthRecord[] = [
  {
    id: "h_1",
    animalId: "TR34D672",
    date: "2026-05-10",
    type: "Aşı",
    medicine: "Enterotoksemi (Çiftleme Aşısı)",
    dosage: "2 cc",
    notes: "Doğum öncesi koruyucu aşı.",
    createdAt: new Date("2026-05-10").toISOString(),
  },
  {
    id: "h_2",
    animalId: "TR-KUZU-001",
    date: "2026-05-08",
    type: "Vitamin",
    medicine: "E-Selenyum",
    dosage: "1 cc",
    notes: "Kuzu beyaz kas hastalığı önlemi.",
    createdAt: new Date("2026-05-08").toISOString(),
  }
];

const INITIAL_REMINDERS: Reminder[] = [
  {
    id: "rem_1",
    animalId: "TR34D672",
    title: "Karabaş - Gebelik Sonu Tetanoz Aşısı",
    type: "Aşı",
    date: "2026-06-05",
    notes: "Doğuma 10 gün kala yapılacak koruyucu aşı.",
    completed: false,
    createdAt: new Date().toISOString()
  },
  {
    id: "rem_2",
    animalId: "TR-KUZU-001",
    title: "Kuzu 001 - Şap Aşısı Koruma Dozu",
    type: "Aşı",
    date: "2026-06-15",
    notes: "İlk dozu takiben yapılacak takviye.",
    completed: false,
    createdAt: new Date().toISOString()
  },
  {
    id: "rem_3",
    animalId: "flock",
    title: "Sürü Geneli - İç & Dış Parazit Mücadelesi",
    type: "Parazit",
    date: "2026-06-10",
    notes: "Tüm sürünün parazit banyosu.",
    completed: false,
    createdAt: new Date().toISOString()
  }
];

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [sheep, setSheep] = useState<Sheep[]>([]);
  const [lambs, setLambs] = useState<Lamb[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    // Load auth
    const savedUser = localStorage.getItem('kuzu_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    // Load dynamic herd collections
    const rawSheep = localStorage.getItem('kuzu_sheep');
    if (rawSheep) {
      setSheep(JSON.parse(rawSheep));
    } else {
      setSheep(INITIAL_SHEEP);
      localStorage.setItem('kuzu_sheep', JSON.stringify(INITIAL_SHEEP));
    }

    const rawLambs = localStorage.getItem('kuzu_lambs');
    if (rawLambs) {
      setLambs(JSON.parse(rawLambs));
    } else {
      setLambs(INITIAL_LAMBS);
      localStorage.setItem('kuzu_lambs', JSON.stringify(INITIAL_LAMBS));
    }

    const rawHealth = localStorage.getItem('kuzu_health');
    if (rawHealth) {
      setHealthRecords(JSON.parse(rawHealth));
    } else {
      setHealthRecords(INITIAL_HEALTH);
      localStorage.setItem('kuzu_health', JSON.stringify(INITIAL_HEALTH));
    }

    const rawReminders = localStorage.getItem('kuzu_reminders');
    if (rawReminders) {
      setReminders(JSON.parse(rawReminders));
    } else {
      setReminders(INITIAL_REMINDERS);
      localStorage.setItem('kuzu_reminders', JSON.stringify(INITIAL_REMINDERS));
    }

    setLoading(false);
  }, []);

  // Update localStorage helper
  const saveStateToStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const login = async (displayName: string, farmName: string) => {
    setAuthError(null);
    try {
      const newUser: LocalUser = {
        displayName: displayName || "Bilinmeyen Çiftçi",
        farmName: farmName || "Benim Çiftliğim",
        email: "yerel@kuzutakip.com",
        photoURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120"
      };
      setUser(newUser);
      localStorage.setItem('kuzu_user', JSON.stringify(newUser));
    } catch (e: any) {
      setAuthError("Giriş yapılırken yerel bir hata oluştu: " + e.message);
    }
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('kuzu_user');
  };

  const handleError = (error: unknown, operationType: OperationType, path: string | null) => {
    console.error(`Local Op Error: [${operationType}] at ${path}`, error);
  };

  // --- CRUD ACTIONS ---

  const addSheep = (item: Sheep) => {
    const updated = [...sheep, { ...item, createdAt: new Date().toISOString() }];
    setSheep(updated);
    saveStateToStorage('kuzu_sheep', updated);
  };

  const updateSheep = (id: string, updates: Partial<Sheep>) => {
    const updated = sheep.map(s => s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s);
    setSheep(updated);
    saveStateToStorage('kuzu_sheep', updated);
  };

  const deleteSheep = (id: string) => {
    const updated = sheep.filter(s => s.id !== id);
    setSheep(updated);
    saveStateToStorage('kuzu_sheep', updated);
  };

  const addLamb = (item: Omit<Lamb, 'id'>) => {
    const newL: Lamb = {
      ...item,
      id: "lamb_" + Date.now(),
      createdAt: new Date().toISOString()
    };
    const updated = [...lambs, newL];
    setLambs(updated);
    saveStateToStorage('kuzu_lambs', updated);
  };

  const updateLamb = (id: string, updates: Partial<Lamb>) => {
    const updated = lambs.map(l => l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l);
    setLambs(updated);
    saveStateToStorage('kuzu_lambs', updated);
  };

  const deleteLamb = (id: string) => {
    const updated = lambs.filter(l => l.id !== id);
    setLambs(updated);
    saveStateToStorage('kuzu_lambs', updated);
  };

  const addHealthRecord = (item: Omit<HealthRecord, 'id'>) => {
    const newH: HealthRecord = {
      ...item,
      id: "health_" + Date.now(),
      createdAt: new Date().toISOString()
    };
    const updated = [...healthRecords, newH];
    setHealthRecords(updated);
    saveStateToStorage('kuzu_health', updated);
  };

  const deleteHealthRecord = (id: string) => {
    const updated = healthRecords.filter(h => h.id !== id);
    setHealthRecords(updated);
    saveStateToStorage('kuzu_health', updated);
  };

  const addReminder = (item: Omit<Reminder, 'id' | 'createdAt' | 'completed'>) => {
    const newR: Reminder = {
      ...item,
      id: "rem_" + Date.now(),
      completed: false,
      createdAt: new Date().toISOString()
    };
    const updated = [...reminders, newR];
    setReminders(updated);
    saveStateToStorage('kuzu_reminders', updated);
  };

  const updateReminder = (id: string, updates: Partial<Reminder>) => {
    const updated = reminders.map(r => r.id === id ? { ...r, ...updates } : r);
    setReminders(updated);
    saveStateToStorage('kuzu_reminders', updated);
  };

  const deleteReminder = (id: string) => {
    const updated = reminders.filter(r => r.id !== id);
    setReminders(updated);
    saveStateToStorage('kuzu_reminders', updated);
  };

  const toggleReminder = (id: string) => {
    const updated = reminders.map(r => r.id === id ? { ...r, completed: !r.completed } : r);
    setReminders(updated);
    saveStateToStorage('kuzu_reminders', updated);
  };

  const exportBackup = (): string => {
    const backupObj = {
      sheep,
      lambs,
      healthRecords,
      reminders,
      user,
      version: "1.1.0",
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(backupObj, null, 2);
  };

  const importBackup = (backupStr: string): boolean => {
    try {
      const parsed = JSON.parse(backupStr);
      if (parsed.sheep && Array.isArray(parsed.sheep)) {
        setSheep(parsed.sheep);
        saveStateToStorage('kuzu_sheep', parsed.sheep);
      }
      if (parsed.lambs && Array.isArray(parsed.lambs)) {
        setLambs(parsed.lambs);
        saveStateToStorage('kuzu_lambs', parsed.lambs);
      }
      if (parsed.healthRecords && Array.isArray(parsed.healthRecords)) {
        setHealthRecords(parsed.healthRecords);
        saveStateToStorage('kuzu_health', parsed.healthRecords);
      }
      if (parsed.reminders && Array.isArray(parsed.reminders)) {
        setReminders(parsed.reminders);
        saveStateToStorage('kuzu_reminders', parsed.reminders);
      }
      if (parsed.user) {
        setUser(parsed.user);
        saveStateToStorage('kuzu_user', parsed.user);
      }
      return true;
    } catch (e) {
      console.error("Backup yükleme hatası:", e);
      return false;
    }
  };

  return (
    <FirebaseContext.Provider value={{
      user,
      loading,
      authError,
      setAuthError,
      db: {}, // mocked
      auth: {}, // mocked
      login,
      logout,
      handleError,
      sheep,
      lambs,
      healthRecords,
      reminders,
      addSheep,
      updateSheep,
      deleteSheep,
      addLamb,
      updateLamb,
      deleteLamb,
      addHealthRecord,
      deleteHealthRecord,
      addReminder,
      updateReminder,
      deleteReminder,
      toggleReminder,
      importBackup,
      exportBackup
    }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error('useFirebase must be used within a FirebaseProvider');
  return context;
};
