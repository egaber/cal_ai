// Memory system types for storing user, family, and place information

export interface UserMemory {
  id: string;
  userId: string;
  fact: string;
  category: 'preference' | 'habit' | 'constraint' | 'goal' | 'other';
  importance: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

export interface FamilyMemory {
  id: string;
  fact: string;
  category: 'preference' | 'habit' | 'constraint' | 'tradition' | 'other';
  importance: 'low' | 'medium' | 'high';
  affectedMembers: string[]; // family member IDs
  createdAt: string;
  updatedAt: string;
}

export interface Place {
  id: string;
  name: string;
  address: string;
  type: 'home' | 'work' | 'school' | 'kindergarten' | 'other';
  coordinates?: {
    lat: number;
    lng: number;
  };
  associatedMemberId?: string; // which family member this place is for
  createdAt: string;
  updatedAt: string;
}

export interface TravelInfo {
  id: string;
  fromPlaceId: string;
  toPlaceId: string;
  method: 'drive' | 'walk' | 'public_transport' | 'bike';
  durationMinutes: number;
  requiresAdult: boolean; // if a child needs parent accompaniment
  accompaniedByMemberId?: string; // which parent usually accompanies
  createdAt: string;
  updatedAt: string;
}

export interface MemoryData {
  userMemories: UserMemory[];
  familyMemories: FamilyMemory[];
  places: Place[];
  travelInfo: TravelInfo[];
}
