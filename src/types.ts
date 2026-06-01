export enum AnimalStatus {
  Healthy = "Healthy",
  Pregnant = "Pregnant",
  Sick = "Sick",
  Sold = "Sold",
  Deceased = "Deceased"
}

export enum Gender {
  Ewe = "Ewe",
  Ram = "Ram",
  Male = "Male",
  Female = "Female"
}

export interface Sheep {
  id: string; // Tag ID
  name?: string;
  breed?: string;
  birthDate?: string;
  gender: Gender.Ewe | Gender.Ram;
  status: AnimalStatus;
  notes?: string;
  createdAt: any;
  updatedAt?: any;
}

export interface Lamb {
  id: string; // Firestore document ID
  tagId: string;
  motherId: string;
  birthDate: any;
  birthWeight?: number;
  gender: Gender.Male | Gender.Female;
  status?: string;
  weaningDate?: string;
  notes?: string;
  createdAt: any;
  updatedAt?: any;
}

export interface HealthRecord {
  id: string;
  animalId: string;
  date: string;
  type: string;
  medicine?: string;
  dosage?: string;
  notes?: string;
  createdAt: any;
}

export interface Reminder {
  id: string;
  animalId: string; // id of sheep or lamb, or "flock"
  title: string;
  type: 'Aşı' | 'Tedavi' | 'Vitamin' | 'Bakım' | 'Parazit';
  date: string; // YYYY-MM-DD
  notes?: string;
  completed: boolean;
  createdAt: string;
}
