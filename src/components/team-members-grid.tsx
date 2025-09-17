"use client"

import { useEffect, useMemo, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Loader2, Plus, Search } from "lucide-react"

interface GridMember {
  id: string
  displayName: string
  photoURL: string | null
  tag: string | null
  bio: string | null
  summary: string | null
  email: string | null
  roles: string[]
  teamRoles: string[]
}

interface TeamMembersGridProps {
  teamId: string
  members: GridMember[]
  canManageRoles: boolean
  viewerId: string
}

function roleColor(role: string): string {
  let hash = 0
  for (let i = 0; i < role.length; i += 1) {
    hash = role.charCodeAt(i) + ((hash << 5) - hash)
    hash |= 0
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue} 70% 45%)`
}

const TEAM_ROLE_TEXT_COLOR = "#ffffff"

export function TeamMembersGrid({ teamId, members: initialMembers, canManageRoles, viewerId }: TeamMembersGridProps) {
  const [members, setMembers] = useState(initialMembers)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [showRoleManager, setShowRoleManager] = useState(false)
  const [search, setSearch] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setMembers(initialMembers)
  }, [initialMembers])

  const selectedMember = useMemo(
    () => members.find((m) => m.id === selectedMemberId) ?? null,
    [members, selectedMemberId]
  )

  const canEditSelected = selectedMember ? (canManageRoles || selectedMember.id === viewerId) : false

  const availableRoles = useMemo(() => {
    const set = new Set<string>()
    members.forEach((member) => {
      member.roles.forEach((role) => set.add(role))
      member.teamRoles.forEach((role) => set.add(role))
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [members])

  const filteredRoles = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return availableRoles
    return availableRoles.filter((role) => role.toLowerCase().includes(term))
  }, [availableRoles, search])

  const closeDialog = () => {
    setSelectedMemberId(null)
    setShowRoleManager(false)
    setSearch("")
    setError(null)
  }

  async function handleAssignRole(roleName: string) {
    if (!selectedMember || !(canManageRoles || selectedMember.id === viewerId)) return
    const role = roleName.trim()
    if (!role) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/teams/${teamId}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: selectedMember.id, roleName: role }),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        setError(payload?.error ?? "Unable to update role")
        return
      }
      const payload = await res.json()
      if (!payload?.ok) {
        setError(payload?.error ?? "Unable to update role")
        return
      }
      setMembers((prev) =>
        prev.map((member) =>
          member.id === selectedMember.id
            ? {
                ...member,
                roles: (payload.roles as string[]) ?? member.roles,
                teamRoles: (payload.teamRoles as string[]) ?? member.teamRoles,
              }
            : member
        )
      )
      setSearch("")
      setShowRoleManager(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-4">
        {members.map((member) => {
          const initials = member.displayName.slice(0, 1).toUpperCase()
          const primaryRole = member.teamRoles[0] ?? member.roles[0] ?? null
          return (
            <button
              key={member.id}
              type="button"
              onClick={() => setSelectedMemberId(member.id)}
              className={cn(
                "flex items-center gap-3 rounded-lg border border-stone-700/60 bg-stone-900/50 px-3 py-2 text-left transition-colors",
                "hover:bg-stone-800/70 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-cyan-400"
              )}
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={member.photoURL ?? undefined} alt={member.displayName} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-[8rem] flex-col">
                <span className="text-sm font-medium text-white">{member.displayName}</span>
                <span className="text-xs text-stone-400">{member.id === viewerId ? "You" : member.tag ? `@${member.tag}` : "Team member"}</span>
                {primaryRole && (
                  <span className="mt-1 text-xs font-medium">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]"
                      style={{ backgroundColor: roleColor(primaryRole), color: TEAM_ROLE_TEXT_COLOR }}
                    >
                      {primaryRole}
                    </span>
                  </span>
                )}
              </div>
            </button>
          )
        })}
        {members.length === 0 && (
          <p className="text-sm text-stone-400">No team members yet.</p>
        )}
      </div>

      <Dialog open={!!selectedMember} onOpenChange={(open) => { if (!open) closeDialog() }}>
        <DialogContent className="bg-stone-950 text-white border-stone-700/60">
          {selectedMember && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold">{selectedMember.displayName}</DialogTitle>
                <DialogDescription className="text-sm text-stone-400">
                  {selectedMember.summary || selectedMember.bio || "Team member"}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={selectedMember.photoURL ?? undefined} alt={selectedMember.displayName} />
                  <AvatarFallback>{selectedMember.displayName.slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-1 flex-col gap-3">
                  <div className="space-y-1 text-sm text-stone-300">
                    {selectedMember.email && <div>Email: <span className="text-stone-100">{selectedMember.email}</span></div>}
                    <div>Profile: @{selectedMember.tag || selectedMember.id}</div>
                    {selectedMember.bio && <div className="text-stone-400">{selectedMember.bio}</div>}
                  </div>
                  <Button
                    asChild
                    className="w-fit bg-cyan-500 font-semibold text-stone-950 hover:bg-cyan-400"
                  >
                    <a href={`/user/${selectedMember.tag || selectedMember.id}`}>View profile</a>
                  </Button>
                </div>
              </div>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">Team roles</h4>
                  {canEditSelected && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowRoleManager((prev) => !prev)}
                      className="h-8 w-8 rounded-full border border-stone-700/60 text-stone-200 hover:bg-stone-800"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedMember.teamRoles.length > 0 ? (
                    selectedMember.teamRoles.map((role) => (
                      <Badge
                        key={`team-${role}`}
                        className="px-2 py-1 text-[11px] font-medium"
                        style={{ backgroundColor: roleColor(role), color: TEAM_ROLE_TEXT_COLOR }}
                      >
                        {role}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-stone-400">No team roles assigned yet.</span>
                  )}
                </div>
              </section>

              {canEditSelected && showRoleManager && (
                <div className="space-y-3 rounded-lg border border-stone-700/60 bg-stone-900/60 p-3">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-stone-500" />
                    <Input
                      placeholder="Search or create a role"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      className="h-8 bg-stone-950 text-sm text-white placeholder:text-stone-500"
                    />
                  </div>
                  <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
                    {filteredRoles.map((role) => (
                      <Button
                        key={role}
                        variant="ghost"
                        className="w-full justify-start text-sm text-stone-200 hover:bg-stone-800"
                        disabled={selectedMember.teamRoles.includes(role) && selectedMember.roles.includes(role)}
                        onClick={() => handleAssignRole(role)}
                      >
                        <span
                          className="mr-2 h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: roleColor(role) }}
                        />
                        {role}
                      </Button>
                    ))}
                    {filteredRoles.length === 0 && (
                      <p className="text-sm text-stone-500">No roles found. Create a new one below.</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <Button
                      className="w-full bg-cyan-500 text-white hover:bg-cyan-400"
                      onClick={() => handleAssignRole(search.trim())}
                      disabled={saving || !search.trim()}
                    >
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {search.trim() ? `Create "${search.trim()}" role` : "Create new role"}
                    </Button>
                  </div>
                  {error && <p className="text-sm text-red-400">{error}</p>}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
