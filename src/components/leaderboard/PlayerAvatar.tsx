import SharedPlayerAvatar from "@/components/ui/PlayerAvatar";

interface PlayerAvatarProps {
  username: string;
  avatarUrl?: string | null;
}

export default function PlayerAvatar({ username, avatarUrl }: PlayerAvatarProps) {
  return <SharedPlayerAvatar name={username} avatarUrl={avatarUrl} size="md" />;
}
