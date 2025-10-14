import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { Family, getFamily } from '@/services/familyService';
import { FamilyMember } from '@/types/calendar';
import { useAuth } from './AuthContext';

interface FamilyContextType {
  family: Family | null;
  familyMembers: FamilyMember[];
  loading: boolean;
  refreshFamily: () => Promise<void>;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export function FamilyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);

  const loadFamily = async () => {
    if (!user?.familyId) {
      setFamily(null);
      setLoading(false);
      return;
    }

    try {
      const familyData = await getFamily(user.familyId);
      if (familyData) {
        // Mark the current user in family members
        const updatedMembers = familyData.members.map(member => ({
          ...member,
          isYou: member.id === user.uid
        }));
        setFamily({ ...familyData, members: updatedMembers });
      }
    } catch (error) {
      console.error('Error loading family:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFamily();
  }, [user?.familyId]);

  const refreshFamily = async () => {
    await loadFamily();
  };

  const familyMembers = family?.members || [];

  return (
    <FamilyContext.Provider value={{ family, familyMembers, loading, refreshFamily }}>
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  const context = useContext(FamilyContext);
  if (context === undefined) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
}
