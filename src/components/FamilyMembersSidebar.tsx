import { useState, useRef } from 'react';
import { FamilyMember } from '@/types/calendar';
import { User, Upload } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface FamilyMembersSidebarProps {
  members: FamilyMember[];
  selectedMembers: string[];
  onToggleMember: (memberId: string) => void;
  onAvatarUpload: (memberId: string, avatarDataUrl: string) => void;
}

export const FamilyMembersSidebar = ({
  members,
  selectedMembers,
  onToggleMember,
  onAvatarUpload,
}: FamilyMembersSidebarProps) => {
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleFileSelect = (memberId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size should be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      onAvatarUpload(memberId, dataUrl);
      setUploadingFor(null);
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = (memberId: string) => {
    fileInputRefs.current[memberId]?.click();
  };

  const getMemberInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-lg backdrop-blur">
      <h3 className="mb-3 text-sm font-semibold text-foreground/70">Family Members</h3>
      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member.id}
            className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
              selectedMembers.includes(member.id)
                ? 'bg-primary/10'
                : 'hover:bg-muted/50'
            }`}
          >
            {/* Avatar with upload button */}
            <div className="relative">
              <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                {member.avatar ? (
                  <AvatarImage src={member.avatar} alt={member.name} />
                ) : (
                  <AvatarFallback className={`text-xs ${member.color} text-white`}>
                    {getMemberInitials(member.name)}
                  </AvatarFallback>
                )}
              </Avatar>
              
              {/* Upload button - shows on hover */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerFileInput(member.id);
                }}
                className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-primary/90"
                title="Upload photo"
              >
                <Upload className="h-2.5 w-2.5" />
              </button>

              {/* Hidden file input */}
              <input
                ref={(el) => (fileInputRefs.current[member.id] = el)}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileSelect(member.id, e)}
              />
            </div>

            {/* Member info - clickable to toggle */}
            <button
              onClick={() => onToggleMember(member.id)}
              className="flex flex-1 items-center gap-2 text-left"
            >
              <div className={`h-2 w-2 rounded-full ${member.color}`} />
              <span className={`flex-1 text-sm ${
                selectedMembers.includes(member.id)
                  ? 'font-medium text-primary'
                  : 'text-muted-foreground'
              }`}>
                {member.name}
              </span>
              {member.isYou && (
                <span className="text-xs text-muted-foreground">(You)</span>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
