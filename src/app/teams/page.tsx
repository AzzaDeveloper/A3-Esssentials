"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Users, Search, Settings, UserPlus, Crown, Star, MoreVertical, Edit, Trash2, LogOut, Inbox } from "lucide-react"
import { ProfileMenu } from "@/components/profile-menu"
import type { Team, TeamInvitation } from "@/lib/types"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"

// Client state
type TeamUI = Team & { role?: "Owner" | "Member"; isStarred?: boolean }

export default function TeamsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [teams, setTeams] = useState<TeamUI[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [invites, setInvites] = useState<TeamInvitation[]>([])
  const [teamMeta, setTeamMeta] = useState<Record<string, { name: string; memberCount: number }>>({})
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteTeamId, setInviteTeamId] = useState<string | null>(null)
  const [inviteeId, setInviteeId] = useState("")
  const [inviting, setInviting] = useState(false)
  const canCreate = name.trim().length > 0 && !creating

  async function handleCreate() {
    if (!name.trim()) { toast.error("Team name is required"); return }
    setCreating(true)
    try {
      const res = await fetch("/api/teams", { method: "POST", headers: { "content-type":"application/json" }, body: JSON.stringify({ name: name.trim(), description: description.trim() }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.ok) {
        if (data?.error === 'limit_reached') toast.error("Team limit reached (10)")
        else if (data?.error === 'unauthorized') toast.error("Please sign in to create a team")
        else toast.error("Failed to create team")
        return
      }
      toast.success("Team created")
      setName("")
      setDescription("")
      await load()
    } finally {
      setCreating(false)
    }
  }

  async function load() {
    try {
      setLoading(true)
      const [tRes, iRes] = await Promise.all([
        fetch("/api/teams", { cache: "no-store" }),
        fetch("/api/teams/invitations", { cache: "no-store" }),
      ])
      const t = await tRes.json()
      const i = await iRes.json()
      if (t?.ok) {
        const ui: TeamUI[] = (t.items as Team[]).map((x) => ({
          ...x,
          role: user?.uid && x.ownerId === user.uid ? "Owner" : "Member",
          isStarred: false,
        }))
        setTeams(ui)
      }
      if (i?.ok) setInvites(i.items as TeamInvitation[])
    } catch (e: any) {
      toast.error("Failed to load teams")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Load team metadata for invitations (names, counts)
  useEffect(() => {
    const toFetch = Array.from(new Set(invites.map(i => i.teamId))).filter(id => !teamMeta[id])
    if (toFetch.length === 0) return
    ;(async () => {
      const entries: [string, { name: string; memberCount: number }][] = []
      await Promise.all(toFetch.map(async (id) => {
        try {
          const res = await fetch(`/api/teams/${id}`, { cache: "no-store" })
          const data = await res.json().catch(() => ({}))
          if (res.ok && data?.ok && data.team) {
            entries.push([id, { name: data.team.name as string, memberCount: data.team.memberCount as number }])
          }
        } catch {}
      }))
      if (entries.length) setTeamMeta(prev => ({ ...prev, ...Object.fromEntries(entries) }))
    })()
  }, [invites])

  async function handleInvite() {
    if (!inviteTeamId || !inviteeId.trim()) { toast.error("Provide a user ID"); return }
    setInviting(true)
    try {
      const res = await fetch('/api/teams/invitations', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ teamId: inviteTeamId, inviteeId: inviteeId.trim() }) })
      const data = await res.json().catch(()=>({}))
      if (!res.ok || !data?.ok) {
        const err = data?.error || 'failed'
        if (err === 'already_member') toast.error('User is already a member')
        else if (err === 'forbidden') toast.error('Only members can invite')
        else toast.error('Failed to send invite')
        return
      }
      toast.success('Invitation sent')
      setInviteOpen(false)
      setInviteeId("")
    } finally {
      setInviting(false)
    }
  }

  async function acceptInvite(id: string) {
    const res = await fetch(`/api/teams/invitations/${id}`, { method: 'PATCH', headers: { 'content-type':'application/json' }, body: JSON.stringify({ action: 'accept' }) })
    const data = await res.json().catch(()=>({}))
    if (!res.ok || !data?.ok) {
      const err = data?.error
      if (err === 'limit_reached') toast.error('Your plan limit for teams is reached')
      else toast.error('Failed to accept invitation')
      return
    }
    toast.success('Joined team')
    await load()
  }

  async function declineInvite(id: string) {
    const res = await fetch(`/api/teams/invitations/${id}`, { method: 'PATCH', headers: { 'content-type':'application/json' }, body: JSON.stringify({ action: 'decline' }) })
    const data = await res.json().catch(()=>({}))
    if (!res.ok || !data?.ok) { toast.error('Failed to decline'); return }
    toast.success('Invitation declined')
    setInvites(prev => prev.filter(i => i.id !== id))
  }

  async function leaveTeam(teamId: string) {
    const res = await fetch(`/api/teams/${teamId}/leave`, { method: 'POST' })
    const data = await res.json().catch(()=>({}))
    if (!res.ok || !data?.ok) {
      const err = data?.error
      if (err === 'owner_cannot_leave_with_members') toast.error('Transfer ownership or remove members first')
      else toast.error('Failed to leave team')
      return
    }
    toast.success('Left team')
    await load()
  }

  // Recompute roles when auth state or teams change
  useEffect(() => {
    if (!user) return;
    setTeams((prev) => prev.map((t) => ({ ...t, role: t.ownerId === user.uid ? "Owner" : "Member" })));
  }, [user])

  const filteredTeams = useMemo(() =>
    teams.filter(
      (team) =>
        team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (team.description ?? "").toLowerCase().includes(searchQuery.toLowerCase()),
    ), [teams, searchQuery])

  return (
    <div className="min-h-screen bg-stone-950 text-white relative overflow-hidden">
      {/* subtle gradient/backdrop to match profile menu */}
      <div className="absolute inset-0 bg-gradient-to-br from-stone-900/60 via-stone-950 to-stone-950" />
      <div className="absolute top-24 left-16 w-44 h-44 bg-stone-800/30 rounded-full blur-3xl" />
      <div className="absolute bottom-24 right-24 w-56 h-56 bg-stone-700/25 rounded-full blur-3xl" />
      <div className="absolute top-1/2 right-1/3 w-28 h-28 bg-stone-600/20 rounded-full blur-2xl" />

      <ProfileMenu />
      <div className="relative z-10 mx-auto max-w-7xl p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-balance text-white">Teams</h1>
              <p className="text-stone-300 text-pretty">
                Collaborate with your team members and discover new opportunities
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-fit" disabled={creating}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Team
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Team</DialogTitle>
                  <DialogDescription>Set up a new team to collaborate with your colleagues.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label htmlFor="team-name" className="text-sm font-medium">
                      Team Name
                    </label>
                    <Input id="team-name" placeholder="Enter team name..." value={name} onChange={(e)=>setName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="team-description" className="text-sm font-medium">
                      Description
                    </label>
                    <Input id="team-description" placeholder="What does this team do?" value={description} onChange={(e)=>setDescription(e.target.value)} />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleCreate} disabled={!canCreate}>
                      {creating ? 'Creating...' : 'Create Team'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search */}
          <div className="mt-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <Tabs defaultValue="my-teams" className="space-y-6">
          <TabsList className="w-full max-w-md">
            <TabsTrigger value="my-teams">My Teams</TabsTrigger>
            <TabsTrigger value="discover">Join Team</TabsTrigger>
          </TabsList>

          {/* My Teams Tab */}
          <TabsContent value="my-teams" className="space-y-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">
                My Teams {loading ? "(…)" : `(${teams.length})`}
              </h2>
            </div>

            {/* Loading skeleton */}
            {loading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="bg-stone-900/60 border-stone-700/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                      <Skeleton className="mt-2 h-4 w-64" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-2">
                          {Array.from({ length: 3 }).map((__, j) => (
                            <Skeleton key={j} className="h-8 w-8 rounded-full border-2 border-background" />
                          ))}
                        </div>
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-9 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredTeams.map((team) => (
                  <Card key={team.id} className="group hover:shadow-lg transition-shadow bg-stone-900/60 border-stone-700/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg text-balance">{team.name}</CardTitle>
                        {team.isStarred && <Star className="h-4 w-4 text-amber-300 fill-amber-300 drop-shadow" />}
                      </div>
                      <div className="flex items-center gap-1">
                        {team.role === "Owner" && <Crown className="h-4 w-4 text-accent" />}
                        <Badge
                          variant={team.role === "Owner" ? "default" : "secondary"}
                          className={team.role === "Owner" ? "bg-gradient-to-r from-pink-500 to-violet-500 text-white border-0" : ""}
                        >
                          {team.role}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setInviteTeamId(team.id); setInviteOpen(true); }}>
                              <UserPlus className="mr-2 h-4 w-4" />
                              Invite Member
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/teams/${team.id}`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              View Team
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Settings className="mr-2 h-4 w-4" />
                              Settings
                            </DropdownMenuItem>
                            <Separator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                if (team.role === 'Owner' && team.memberCount > 1) {
                                  toast.error('Owner cannot leave while team has members')
                                  return
                                }
                                leaveTeam(team.id)
                              }}
                            >
                              {team.role === "Owner" ? (
                                <>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {team.memberCount > 1 ? 'Cannot Leave (Owner)' : 'Delete Team'}
                                </>
                              ) : (
                                <>
                                  <LogOut className="mr-2 h-4 w-4" />
                                  Leave Team
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <CardDescription className="text-pretty">{team.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Team Members Preview */}
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {Array.from({ length: Math.min(3, team.memberCount) }).map((_, index) => (
                          <span key={index} className={team.isStarred ? "p-0.5 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500" : ""}>
                            <Avatar className="h-8 w-8 border-2 border-background">
                              <AvatarImage src={"/placeholder.svg"} alt="member" />
                              <AvatarFallback className="text-xs">{index + 1}</AvatarFallback>
                            </Avatar>
                          </span>
                        ))}
                        {team.memberCount > 3 && (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium text-muted-foreground">
                            +{team.memberCount - 3}
                          </div>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">{team.memberCount} members</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 min-w-0">
                      <Button className="flex-1" size="sm" onClick={() => router.push(`/teams/${team.id}`)}>
                        View Team
                      </Button>
                      <Button className="flex-1" variant="secondary" size="sm" onClick={() => { setInviteTeamId(team.id); setInviteOpen(true); }}>
                        <UserPlus className="h-4 w-4 mr-1" /> Invite
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
            )}

            {!loading && filteredTeams.length === 0 && (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No teams found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? "Try adjusting your search terms" : "You haven't joined any teams yet"}
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Team
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Your First Team</DialogTitle>
                      <DialogDescription>
                        Get started by creating your first team to collaborate with others.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label htmlFor="team-name" className="text-sm font-medium">
                          Team Name
                        </label>
                        <Input id="team-name" placeholder="Enter team name..." value={name} onChange={(e)=>setName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="team-description" className="text-sm font-medium">
                          Description
                        </label>
                        <Input id="team-description" placeholder="What does this team do?" value={description} onChange={(e)=>setDescription(e.target.value)} />
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <DialogClose asChild>
                          <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button onClick={handleCreate} disabled={!canCreate}>
                          {creating ? 'Creating...' : 'Create Team'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </TabsContent>

          {/* Join Team Tab */}
          <TabsContent value="discover" className="space-y-6">
            <div className="flex items-center gap-2">
              <Inbox className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Join Team</h2>
            </div>

            {invites.length === 0 && (
              <div className="text-center py-12">
                <Inbox className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No invitations</h3>
                <p className="text-muted-foreground">When someone invites you, it will show up here.</p>
              </div>
            )}

            {invites.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {invites.map((inv) => (
                  <Card key={inv.id} className="bg-stone-900/60 border-stone-700/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{teamMeta[inv.teamId]?.name || 'Team Invitation'}</CardTitle>
                      <CardDescription>Invited to join team {teamMeta[inv.teamId]?.name ? '' : inv.teamId}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between gap-2">
                      <span className="text-sm text-muted-foreground">{teamMeta[inv.teamId]?.memberCount ?? '—'} members</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => declineInvite(inv.id)}>Decline</Button>
                        <Button size="sm" onClick={() => acceptInvite(inv.id)}>Accept</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Invite Member Dialog */}
        <Dialog open={inviteOpen} onOpenChange={(v)=>{ setInviteOpen(v); if(!v){ setInviteeId(""); setInviteTeamId(null) } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Member</DialogTitle>
              <DialogDescription>Enter a user ID to invite to this team.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <Input placeholder="User ID (UID)" value={inviteeId} onChange={(e)=>setInviteeId(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleInvite} disabled={inviting || !inviteeId.trim()}>
                {inviting ? 'Sending…' : 'Send Invite'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
