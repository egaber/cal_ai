// Memory Service - Firestore-based memory management for family AI

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
  limit as firestoreLimit,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import {
  FamilyMemory,
  FamilyMemoryDoc,
  CreateMemoryInput,
  UpdateMemoryInput,
  MemoryQueryFilters,
  CompactMemory,
  MemoryType,
} from '@/types/memory';

/**
 * Memory Service
 * Handles all Firestore operations for the unified memory system
 */
export class MemoryService {
  /**
   * Get the Firestore collection path for family memories
   */
  private static getMemoryCollectionPath(familyId: string): string {
    return `families/${familyId}/memory`;
  }

  /**
   * Convert Firestore document to FamilyMemory
   */
  private static docToMemory(doc: FamilyMemoryDoc): FamilyMemory {
    return {
      ...doc,
      createdAt: doc.createdAt instanceof Timestamp ? doc.createdAt.toDate() : doc.createdAt,
      updatedAt: doc.updatedAt instanceof Timestamp ? doc.updatedAt.toDate() : doc.updatedAt,
      expiresAt: doc.expiresAt
        ? doc.expiresAt instanceof Timestamp
          ? doc.expiresAt.toDate()
          : doc.expiresAt
        : undefined,
    };
  }

  /**
   * Convert FamilyMemory to Firestore document
   */
  private static memoryToDoc(memory: Partial<FamilyMemory>): Record<string, unknown> {
    const doc: Record<string, unknown> = {
      ...memory,
    };

    if (memory.createdAt) {
      doc.createdAt =
        memory.createdAt instanceof Date
          ? Timestamp.fromDate(memory.createdAt)
          : memory.createdAt;
    }

    if (memory.updatedAt) {
      doc.updatedAt =
        memory.updatedAt instanceof Date
          ? Timestamp.fromDate(memory.updatedAt)
          : memory.updatedAt;
    }

    if (memory.expiresAt) {
      doc.expiresAt =
        memory.expiresAt instanceof Date
          ? Timestamp.fromDate(memory.expiresAt)
          : memory.expiresAt;
    }

    return doc;
  }

  /**
   * Create a new memory
   */
  static async createMemory(input: CreateMemoryInput): Promise<FamilyMemory> {
    const memoryId = doc(collection(db, 'temp')).id; // Generate ID
    const now = new Date();

    const memory: FamilyMemory = {
      id: memoryId,
      familyId: input.familyId,
      memoryType: input.memoryType,
      title: input.title,
      text: input.text,
      structured: input.structured,
      relatedUserIds: input.relatedUserIds,
      tags: input.tags,
      source: input.source,
      confidence: input.confidence,
      createdAt: now,
      updatedAt: now,
      expiresAt: input.expiresAt,
    };

    const memoryDoc = this.memoryToDoc(memory);
    const collectionPath = this.getMemoryCollectionPath(input.familyId);
    const docRef = doc(db, collectionPath, memoryId);

    await setDoc(docRef, memoryDoc);
    return memory;
  }

  /**
   * Get a memory by ID
   */
  static async getMemory(familyId: string, memoryId: string): Promise<FamilyMemory | null> {
    const collectionPath = this.getMemoryCollectionPath(familyId);
    const docRef = doc(db, collectionPath, memoryId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return this.docToMemory(docSnap.data() as FamilyMemoryDoc);
  }

  /**
   * Update a memory
   */
  static async updateMemory(
    familyId: string,
    memoryId: string,
    updates: UpdateMemoryInput
  ): Promise<void> {
    const collectionPath = this.getMemoryCollectionPath(familyId);
    const docRef = doc(db, collectionPath, memoryId);

    const updateData: Record<string, unknown> = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    if (updates.expiresAt) {
      updateData.expiresAt = Timestamp.fromDate(updates.expiresAt);
    }

    await updateDoc(docRef, updateData);
  }

  /**
   * Delete a memory
   */
  static async deleteMemory(familyId: string, memoryId: string): Promise<void> {
    const collectionPath = this.getMemoryCollectionPath(familyId);
    const docRef = doc(db, collectionPath, memoryId);
    await deleteDoc(docRef);
  }

  /**
   * Query memories with filters
   */
  static async queryMemories(
    familyId: string,
    filters?: MemoryQueryFilters,
    limitCount?: number
  ): Promise<FamilyMemory[]> {
    const collectionPath = this.getMemoryCollectionPath(familyId);
    const collectionRef = collection(db, collectionPath);

    const constraints: QueryConstraint[] = [];

    // Filter by memory type
    if (filters?.memoryType) {
      if (Array.isArray(filters.memoryType)) {
        constraints.push(where('memoryType', 'in', filters.memoryType));
      } else {
        constraints.push(where('memoryType', '==', filters.memoryType));
      }
    }

    // Filter by related user
    if (filters?.relatedUserId) {
      constraints.push(where('relatedUserIds', 'array-contains', filters.relatedUserId));
    }

    // Filter by source
    if (filters?.source) {
      constraints.push(where('source', '==', filters.source));
    }

    // Filter by confidence
    if (filters?.minConfidence !== undefined) {
      constraints.push(where('confidence', '>=', filters.minConfidence));
    }

    // Filter expired memories
    if (!filters?.includeExpired) {
      const now = Timestamp.now();
      // Only include memories that haven't expired or don't have expiration
      constraints.push(
        where('expiresAt', '>', now),
      );
    }

    // Order by creation date (newest first)
    constraints.push(orderBy('createdAt', 'desc'));

    // Limit results
    if (limitCount) {
      constraints.push(firestoreLimit(limitCount));
    }

    const q = query(collectionRef, ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => this.docToMemory(doc.data() as FamilyMemoryDoc));
  }

  /**
   * Get all memories for a family (use with caution for large datasets)
   */
  static async getAllMemories(familyId: string): Promise<FamilyMemory[]> {
    const collectionPath = this.getMemoryCollectionPath(familyId);
    const collectionRef = collection(db, collectionPath);
    const q = query(collectionRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => this.docToMemory(doc.data() as FamilyMemoryDoc));
  }

  /**
   * Get memories by type
   */
  static async getMemoriesByType(
    familyId: string,
    memoryType: MemoryType | MemoryType[]
  ): Promise<FamilyMemory[]> {
    return this.queryMemories(familyId, { memoryType });
  }

  /**
   * Get memories for a specific user
   */
  static async getMemoriesForUser(familyId: string, userId: string): Promise<FamilyMemory[]> {
    return this.queryMemories(familyId, { relatedUserId: userId });
  }

  /**
   * Search memories by tags
   */
  static async searchMemoriesByTags(familyId: string, tags: string[]): Promise<FamilyMemory[]> {
    const collectionPath = this.getMemoryCollectionPath(familyId);
    const collectionRef = collection(db, collectionPath);

    // Firestore can only use array-contains with one value at a time
    // For multiple tags, we need to fetch and filter client-side
    const q = query(collectionRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const memories = snapshot.docs.map((doc) => this.docToMemory(doc.data() as FamilyMemoryDoc));

    // Filter by tags
    return memories.filter((memory) => {
      if (!memory.tags || memory.tags.length === 0) return false;
      return tags.some((tag) => memory.tags!.includes(tag));
    });
  }

  /**
   * Get compact memories for LLM context (optimized for token usage)
   */
  static async getCompactMemoriesForLLM(
    familyId: string,
    userIdToNameMap: Map<string, string>,
    filters?: MemoryQueryFilters,
    maxMemories: number = 50
  ): Promise<CompactMemory[]> {
    const memories = await this.queryMemories(familyId, filters, maxMemories);

    return memories.map((memory) => ({
      type: memory.memoryType,
      text: memory.text,
      users: memory.relatedUserIds?.map((id) => userIdToNameMap.get(id) || id),
      tags: memory.tags,
    }));
  }

  /**
   * Get memory context as formatted string for LLM
   */
  static async getMemoryContextString(
    familyId: string,
    userIdToNameMap: Map<string, string>,
    filters?: MemoryQueryFilters,
    maxMemories: number = 50
  ): Promise<string> {
    const memories = await this.getCompactMemoriesForLLM(
      familyId,
      userIdToNameMap,
      filters,
      maxMemories
    );

    if (memories.length === 0) {
      return 'No relevant memories found.';
    }

    const lines: string[] = ['Family Memory Context:'];

    // Group by type for better organization
    const byType = new Map<string, CompactMemory[]>();
    memories.forEach((mem) => {
      const existing = byType.get(mem.type) || [];
      existing.push(mem);
      byType.set(mem.type, existing);
    });

    // Format each group
    byType.forEach((mems, type) => {
      lines.push(`\n${type.toUpperCase()}:`);
      mems.forEach((mem) => {
        const userInfo = mem.users && mem.users.length > 0 ? ` [${mem.users.join(', ')}]` : '';
        lines.push(`- ${mem.text}${userInfo}`);
      });
    });

    return lines.join('\n');
  }

  /**
   * Batch create multiple memories
   */
  static async batchCreateMemories(memories: CreateMemoryInput[]): Promise<FamilyMemory[]> {
    if (memories.length === 0) return [];

    const batch = writeBatch(db);
    const createdMemories: FamilyMemory[] = [];
    const now = new Date();

    for (const input of memories) {
      const memoryId = doc(collection(db, 'temp')).id;
      const memory: FamilyMemory = {
        id: memoryId,
        familyId: input.familyId,
        memoryType: input.memoryType,
        title: input.title,
        text: input.text,
        structured: input.structured,
        relatedUserIds: input.relatedUserIds,
        tags: input.tags,
        source: input.source,
        confidence: input.confidence,
        createdAt: now,
        updatedAt: now,
        expiresAt: input.expiresAt,
      };

      const collectionPath = this.getMemoryCollectionPath(input.familyId);
      const docRef = doc(db, collectionPath, memoryId);
      const memoryDoc = this.memoryToDoc(memory);

      batch.set(docRef, memoryDoc);
      createdMemories.push(memory);
    }

    await batch.commit();
    return createdMemories;
  }

  /**
   * Delete expired memories (cleanup utility)
   */
  static async deleteExpiredMemories(familyId: string): Promise<number> {
    const collectionPath = this.getMemoryCollectionPath(familyId);
    const collectionRef = collection(db, collectionPath);
    const now = Timestamp.now();

    const q = query(collectionRef, where('expiresAt', '<=', now));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return 0;
    }

    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    return snapshot.size;
  }

  /**
   * Get memory statistics
   */
  static async getMemoryStats(familyId: string): Promise<{
    total: number;
    byType: Record<MemoryType, number>;
    bySource: Record<string, number>;
  }> {
    const memories = await this.getAllMemories(familyId);

    const stats = {
      total: memories.length,
      byType: {} as Record<MemoryType, number>,
      bySource: {} as Record<string, number>,
    };

    memories.forEach((memory) => {
      // Count by type
      stats.byType[memory.memoryType] = (stats.byType[memory.memoryType] || 0) + 1;

      // Count by source
      stats.bySource[memory.source] = (stats.bySource[memory.source] || 0) + 1;
    });

    return stats;
  }
}
