// Storage service for persisting calendar and memory data to local JSON files

import { CalendarEvent, FamilyMember } from '@/types/calendar';
import { MemoryData, UserMemory, FamilyMemory, Place, TravelInfo } from '@/types/memory';
import { GoogleCalendarSettings } from '@/types/googleCalendar';

const STORAGE_KEYS = {
  EVENTS: 'cal_ai_events',
  FAMILY_MEMBERS: 'cal_ai_family_members',
  MEMORY_DATA: 'cal_ai_memory_data',
  SETTINGS: 'cal_ai_settings',
  GOOGLE_CALENDAR_SETTINGS: 'cal_ai_google_calendar_settings',
};

export interface AppSettings {
  selectedMembers: string[];
  viewMode: 'day' | 'week' | 'workweek' | 'month';
}

// Storage Service Class
export class StorageService {
  // Calendar Events
  static saveEvents(events: CalendarEvent[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    } catch (error) {
      console.error('Failed to save events:', error);
    }
  }

  static loadEvents(): CalendarEvent[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EVENTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load events:', error);
      return [];
    }
  }

  // Family Members
  static saveFamilyMembers(members: FamilyMember[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.FAMILY_MEMBERS, JSON.stringify(members));
    } catch (error) {
      console.error('Failed to save family members:', error);
    }
  }

  static loadFamilyMembers(): FamilyMember[] | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FAMILY_MEMBERS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load family members:', error);
      return null;
    }
  }

  // Memory Data
  static saveMemoryData(memoryData: MemoryData): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MEMORY_DATA, JSON.stringify(memoryData));
    } catch (error) {
      console.error('Failed to save memory data:', error);
    }
  }

  static loadMemoryData(): MemoryData {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MEMORY_DATA);
      return data ? JSON.parse(data) : {
        userMemories: [],
        familyMemories: [],
        places: [],
        travelInfo: [],
      };
    } catch (error) {
      console.error('Failed to load memory data:', error);
      return {
        userMemories: [],
        familyMemories: [],
        places: [],
        travelInfo: [],
      };
    }
  }

  // User Memories
  static addUserMemory(memory: UserMemory): void {
    const memoryData = this.loadMemoryData();
    memoryData.userMemories.push(memory);
    this.saveMemoryData(memoryData);
  }

  static updateUserMemory(memoryId: string, updates: Partial<UserMemory>): void {
    const memoryData = this.loadMemoryData();
    const index = memoryData.userMemories.findIndex(m => m.id === memoryId);
    if (index !== -1) {
      memoryData.userMemories[index] = {
        ...memoryData.userMemories[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.saveMemoryData(memoryData);
    }
  }

  static deleteUserMemory(memoryId: string): void {
    const memoryData = this.loadMemoryData();
    memoryData.userMemories = memoryData.userMemories.filter(m => m.id !== memoryId);
    this.saveMemoryData(memoryData);
  }

  // Family Memories
  static addFamilyMemory(memory: FamilyMemory): void {
    const memoryData = this.loadMemoryData();
    memoryData.familyMemories.push(memory);
    this.saveMemoryData(memoryData);
  }

  static updateFamilyMemory(memoryId: string, updates: Partial<FamilyMemory>): void {
    const memoryData = this.loadMemoryData();
    const index = memoryData.familyMemories.findIndex(m => m.id === memoryId);
    if (index !== -1) {
      memoryData.familyMemories[index] = {
        ...memoryData.familyMemories[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.saveMemoryData(memoryData);
    }
  }

  static deleteFamilyMemory(memoryId: string): void {
    const memoryData = this.loadMemoryData();
    memoryData.familyMemories = memoryData.familyMemories.filter(m => m.id !== memoryId);
    this.saveMemoryData(memoryData);
  }

  // Places
  static addPlace(place: Place): void {
    const memoryData = this.loadMemoryData();
    memoryData.places.push(place);
    this.saveMemoryData(memoryData);
  }

  static updatePlace(placeId: string, updates: Partial<Place>): void {
    const memoryData = this.loadMemoryData();
    const index = memoryData.places.findIndex(p => p.id === placeId);
    if (index !== -1) {
      memoryData.places[index] = {
        ...memoryData.places[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.saveMemoryData(memoryData);
    }
  }

  static deletePlace(placeId: string): void {
    const memoryData = this.loadMemoryData();
    memoryData.places = memoryData.places.filter(p => p.id !== placeId);
    // Also delete related travel info
    memoryData.travelInfo = memoryData.travelInfo.filter(
      t => t.fromPlaceId !== placeId && t.toPlaceId !== placeId
    );
    this.saveMemoryData(memoryData);
  }

  // Travel Info
  static addTravelInfo(travelInfo: TravelInfo): void {
    const memoryData = this.loadMemoryData();
    memoryData.travelInfo.push(travelInfo);
    this.saveMemoryData(memoryData);
  }

  static updateTravelInfo(travelId: string, updates: Partial<TravelInfo>): void {
    const memoryData = this.loadMemoryData();
    const index = memoryData.travelInfo.findIndex(t => t.id === travelId);
    if (index !== -1) {
      memoryData.travelInfo[index] = {
        ...memoryData.travelInfo[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.saveMemoryData(memoryData);
    }
  }

  static deleteTravelInfo(travelId: string): void {
    const memoryData = this.loadMemoryData();
    memoryData.travelInfo = memoryData.travelInfo.filter(t => t.id !== travelId);
    this.saveMemoryData(memoryData);
  }

  // Settings
  static saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  static loadSettings(): AppSettings | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load settings:', error);
      return null;
    }
  }

  // Utility: Export all data as JSON
  static exportAllData(): string {
    const data = {
      events: this.loadEvents(),
      familyMembers: this.loadFamilyMembers(),
      memoryData: this.loadMemoryData(),
      settings: this.loadSettings(),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  }

  // Utility: Import data from JSON
  static importData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.events) this.saveEvents(data.events);
      if (data.familyMembers) this.saveFamilyMembers(data.familyMembers);
      if (data.memoryData) this.saveMemoryData(data.memoryData);
      if (data.settings) this.saveSettings(data.settings);
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  // Google Calendar Settings
  static saveGoogleCalendarSettings(settings: GoogleCalendarSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.GOOGLE_CALENDAR_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save Google Calendar settings:', error);
    }
  }

  static loadGoogleCalendarSettings(): GoogleCalendarSettings | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GOOGLE_CALENDAR_SETTINGS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load Google Calendar settings:', error);
      return null;
    }
  }

  // Utility: Clear all data
  static clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
}
