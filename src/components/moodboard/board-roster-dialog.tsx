"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import type { TeamMemberContext } from "@/lib/types";

interface BoardRosterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamMembers: TeamMemberContext[];
  teamId?: string | null;
}

export function BoardRosterDialog({
  open,
  onOpenChange,
  teamMembers,
  teamId = null,
}: BoardRosterDialogProps) {
  const hasRoster = teamMembers.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white text-slate-900">
        <DialogHeader>
          <DialogTitle className="text-slate-900">Team members</DialogTitle>
          <DialogDescription className="text-slate-600">
            Browse the roster and jump into a teammate&apos;s profile.
          </DialogDescription>
        </DialogHeader>
        {hasRoster ? (
          <div className="space-y-4">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Link
                      href={`/user/${member.id}`}
                      className="text-sm font-semibold text-slate-900 underline-offset-4 hover:underline"
                      onClick={() => onOpenChange(false)}
                    >
                      {member.name}
                    </Link>
                    <div className="text-xs text-slate-500">
                      {member.email || "No email on file"}
                    </div>
                  </div>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
                  >
                    <Link href={`/user/${member.id}`}>Open profile</Link>
                  </Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {member.roles?.length ? (
                    member.roles.map((role) => (
                      <Badge
                        key={`${member.id}-${role}`}
                        variant="outline"
                        className="border-slate-300 bg-white text-slate-700 capitalize"
                      >
                        {role}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">
                      No roles assigned
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            This team doesn&apos;t have any members yet.
          </p>
        )}
        {teamId ? (
          <div className="pt-4">
            <Button
              className="w-full bg-slate-900 text-white hover:bg-slate-800"
              asChild
            >
              <Link href={`/teams/${teamId}`}>View team page</Link>
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export default BoardRosterDialog;
