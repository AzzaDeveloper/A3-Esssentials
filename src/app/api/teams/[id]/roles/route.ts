import { NextResponse } from "next/server"
import { firebaseAdmin } from "@/lib/firebase-admin"
import { currentUserServer } from "@/lib/auth-server"
import { getFirestore, Timestamp } from "firebase-admin/firestore"

type RoleMap = Record<string, string[]>

function normalizeRoleMap(value: unknown): RoleMap {
  if (!value || typeof value !== "object") return {}
  const entries = Object.entries(value as Record<string, unknown>)
  const result: RoleMap = {}
  for (const [key, raw] of entries) {
    if (!key) continue
    if (Array.isArray(raw)) {
      result[key] = raw.filter((v) => typeof v === "string" && v.trim().length > 0) as string[]
      continue
    }
    if (typeof raw === "string") {
      result[key] = [raw]
    }
  }
  return result
}

function normalizeRoleName(value: unknown): string | null {
  if (!value) return null
  const str = String(value).trim()
  if (!str) return null
  if (str.length > 60) return str.slice(0, 60)
  return str
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  firebaseAdmin()
  const viewer = await currentUserServer()
  if (!viewer) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })

  const { id } = await ctx.params
  if (!id) return NextResponse.json({ ok: false, error: "missing_team" }, { status: 400 })

  const body = await req.json().catch(() => ({})) as { memberId?: string; roleName?: string }
  const memberId = String(body?.memberId ?? "").trim()
  const roleName = normalizeRoleName(body?.roleName)

  if (!memberId) return NextResponse.json({ ok: false, error: "missing_member" }, { status: 400 })
  if (!roleName) return NextResponse.json({ ok: false, error: "missing_role" }, { status: 400 })

  const db = getFirestore()
  const ref = db.collection("teams").doc(id)

  try {
    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      if (!snap.exists) throw new Error("not_found")
      const data = snap.data() as any
      const ownerId = data.ownerId as string | undefined
      const members: string[] = Array.isArray(data.members) ? data.members : []

      if (!members.includes(memberId)) throw new Error("member_not_in_team")
      const canManage = ownerId === viewer.uid || memberId === viewer.uid
      if (!canManage) throw new Error("forbidden")

      const roleMap = normalizeRoleMap(data.role)
      const teamRoleMap = normalizeRoleMap(data.teamRole)

      const currentRoles = new Set(roleMap[memberId] ?? [])
      const currentTeamRoles = new Set(teamRoleMap[memberId] ?? [])
      currentRoles.add(roleName)
      currentTeamRoles.add(roleName)

      const updatedRoleMap = { ...roleMap, [memberId]: Array.from(currentRoles) }
      const updatedTeamRoleMap = { ...teamRoleMap, [memberId]: Array.from(currentTeamRoles) }

      tx.update(ref, {
        role: updatedRoleMap,
        teamRole: updatedTeamRoleMap,
        updatedAt: Timestamp.now(),
      })

      return {
        roles: updatedRoleMap[memberId],
        teamRoles: updatedTeamRoleMap[memberId],
      }
    })

    return NextResponse.json({ ok: true, ...result })
  } catch (error: any) {
    const message = error?.message
    if (message === "not_found") {
      return NextResponse.json({ ok: false, error: "team_not_found" }, { status: 404 })
    }
    if (message === "member_not_in_team") {
      return NextResponse.json({ ok: false, error: "member_not_in_team" }, { status: 400 })
    }
    if (message === "forbidden") {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 })
    }
    return NextResponse.json({ ok: false, error: "unknown_error" }, { status: 500 })
  }
}

