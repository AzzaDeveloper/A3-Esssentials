import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Moodboard, Facet } from "@/lib/types";
import { MoreHorizontal, Trash2, Loader2 } from "lucide-react";

interface MoodboardCardProps {
  board: Moodboard;
  className?: string;
  onDelete?: () => void;
  deleting?: boolean;
}

const FACET_LABELS: Record<Facet, string> = {
  focus: "Focus",
  energy: "Energy",
  social: "Social",
  calm: "Calm",
};

function FacetBar({ facet, value = 0 }: { facet: Facet; value?: number }) {
  const pct = Math.round(((value + 1) / 2) * 100); // -1..1 -> 0..100
  const hue = Math.max(0, Math.min(120, Math.round(60 + value * 60))); // red(-1)->0, yellow(0)->60, green(1)->120
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 text-xs text-stone-400">{FACET_LABELS[facet]}</span>
      <div className="h-2 flex-1 rounded-full bg-stone-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: `hsl(${hue}deg 70% 45%)` }}
        />
      </div>
      <span className="w-8 text-xs tabular-nums text-stone-400">{pct}%</span>
    </div>
  );
}

export function MoodboardCard({ board, className, onDelete, deleting = false }: MoodboardCardProps) {
  const initials = board.name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <Card
      className={cn(
        "group hover:shadow-lg transition-shadow bg-stone-900/60 border-stone-700/50",
        className,
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border-2 border-background">
            {board.coverUrl ? (
              <AvatarImage src={board.coverUrl} alt={board.name} />
            ) : null}
            <AvatarFallback className="text-xs">
              {initials || "MB"}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-base md:text-lg font-semibold leading-tight">
              {board.name}
            </CardTitle>
            <div className="text-xs text-stone-400 mt-0.5">
              {board.type === "team" ? `${board.teamName ?? "Team"} • ` : "Personal • "}
              Updated {new Date(board.updatedAt).toLocaleDateString()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1">
            {board.tags?.slice(0, 3).map((t) => (
              <Badge key={t} variant="secondary" className="bg-stone-800 text-stone-200">
                {t}
              </Badge>
            ))}
          </div>
          {onDelete ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-stone-400 hover:text-stone-100 hover:bg-stone-800"
                  disabled={deleting}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-5 w-5" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40" sideOffset={8} onClick={(event) => event.stopPropagation()}>
                <DropdownMenuLabel>Board actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-500 focus:text-red-500"
                  disabled={deleting}
                  onSelect={(event) => {
                    event.preventDefault();
                    if (deleting) return;
                    onDelete?.();
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Hero preview image */}
        <div className="overflow-hidden rounded-md border border-stone-800 bg-stone-950/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={(board.previewUrls && board.previewUrls[0]) || `https://picsum.photos/seed/${board.id}/640/320`}
            alt={`${board.name} preview`}
            className="w-full h-32 md:h-36 object-cover"
            loading="lazy"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(FACET_LABELS) as Facet[]).map((facet) => (
            <FacetBar key={facet} facet={facet} value={board.facets?.[facet] ?? 0} />
          ))}
        </div>

          <div className="flex items-center justify-between gap-3">
          <div className="flex -space-x-2">
            {(board.participants ?? []).slice(0, 4).map((p) => {
              const initials = p.name
                .split(/\s+/)
                .slice(0, 2)
                .map((s) => s[0]?.toUpperCase())
                .join("");
              return (
                <Avatar key={p.id} className="h-8 w-8 border-2 border-background">
                  {p.avatarUrl ? (
                    <AvatarImage src={p.avatarUrl} alt={p.name} />
                  ) : null}
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
              );
            })}
            {board.participants && board.participants.length > 4 ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium text-muted-foreground">
                +{board.participants.length - 4}
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-4 gap-1.5 items-center">
            {(board.previewUrls ?? []).slice(0, 4).map((u, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={u + i}
                src={u}
                alt="preview"
                className="size-10 rounded-sm object-cover border border-stone-800"
              />
            ))}
            {!(board.previewUrls && board.previewUrls.length) && (
              <>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="size-10 rounded-sm border border-stone-800 bg-gradient-to-br from-stone-800 to-stone-900"
                  />
                ))}
              </>
            )}
          </div>
        </div>
        {board.previewUrls && board.previewUrls.length > 0 ? (
          <div className="flex items-center gap-1 text-xs text-stone-400">
            <span className="relative inline-flex size-1.5">
              <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
              <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500"></span>
            </span>
            Live preview updating
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default MoodboardCard;
