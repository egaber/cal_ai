import { Check } from "lucide-react";
import { FamilyMember } from "@/types/calendar";

interface FamilyMembersSidebarProps {
  members: FamilyMember[];
  selectedMembers: string[];
  onToggleMember: (memberId: string) => void;
}

export const FamilyMembersSidebar = ({ 
  members, 
  selectedMembers, 
  onToggleMember 
}: FamilyMembersSidebarProps) => {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <h3 className="mb-4 text-sm font-semibold text-foreground">Family Members</h3>
      <div className="space-y-2">
        {members.map((member) => {
          const isSelected = selectedMembers.includes(member.id);
          return (
            <button
              key={member.id}
              onClick={() => onToggleMember(member.id)}
              className={`flex w-full items-center gap-3 rounded-lg border p-3 transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-background hover:bg-secondary'
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold text-white ${member.color}`}
              >
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-foreground">
                  {member.name} {member.isYou && '(You)'}
                </div>
                <div className="text-xs text-muted-foreground">{member.role}</div>
              </div>
              {isSelected && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
