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
  onToggleMember,
}: FamilyMembersSidebarProps) => {
  return (
    <div className="rounded-3xl border border-white/60 bg-white/70 p-5 shadow-lg backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            People
          </p>
          <h3 className="text-base font-semibold text-foreground">Family members</h3>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.25em] text-primary">
          {selectedMembers.length}/{members.length}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {members.map((member) => {
          const isSelected = selectedMembers.includes(member.id);
          return (
            <button
              key={member.id}
              onClick={() => onToggleMember(member.id)}
              className={`flex w-full items-center gap-3 rounded-2xl border p-3 transition-all ${
                isSelected
                  ? 'border-primary bg-primary/10 shadow-inner shadow-primary/20'
                  : 'border-transparent bg-white/80 hover:border-border/60 hover:bg-secondary/40'
              }`}
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-full font-semibold text-white shadow ${member.color}`}
              >
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    {member.name}
                  </p>
                  {member.isYou && (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                      You
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{member.role}</p>
              </div>
              {isSelected && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                  <Check className="h-3.5 w-3.5" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
