import { cn } from "@/lib/utils";

interface AvatarStackProps {
  people: { name: string; avatarUrl?: string | null }[];
  max?: number;
  size?: number;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function AvatarStack({ people, max = 5, size = 28 }: AvatarStackProps) {
  const visible = people.slice(0, max);
  const overflow = Math.max(0, people.length - visible.length);
  return (
    <div className="flex items-center">
      {visible.map((person, idx) => (
        <span
          key={idx}
          className={cn(
            "inline-flex items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-semibold text-foreground",
            idx !== 0 && "-ml-2",
          )}
          style={{ width: size, height: size }}
          title={person.name}
        >
          {person.avatarUrl ? (
            <img
              src={person.avatarUrl}
              alt={person.name}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            initials(person.name) || "·"
          )}
        </span>
      ))}
      {overflow > 0 && (
        <span
          className="-ml-2 inline-flex items-center justify-center rounded-full border-2 border-card bg-secondary text-[10px] font-semibold text-secondary-foreground"
          style={{ width: size, height: size }}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}
