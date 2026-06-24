"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Trash2, Plus, Loader2, Users, UserPlus, Crown } from "lucide-react"

interface Group {
  id: string
  group_name: string
  created_by: string
  created_at: string
  member_count: number
}

export default function GroupsPage() {
  const supabase = createClient()
  const [createdGroups, setCreatedGroups] = useState<Group[]>([])
  const [joinedGroups, setJoinedGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [groupName, setGroupName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const fetchGroups = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    // Fetch all groups the user is part of
    const { data: memberRows } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", user.id)

    const memberGroupIds = memberRows?.map((r) => r.group_id) ?? []

    // Fetch created groups
    const { data: created } = await supabase
      .from("shared_groups")
      .select("*")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false })

    // Fetch joined groups (groups where user is a member but NOT the creator)
    let joined: Group[] = []
    if (memberGroupIds.length > 0) {
      const { data: joinedData } = await supabase
        .from("shared_groups")
        .select("*")
        .in("id", memberGroupIds)
        .neq("created_by", user.id)
        .order("created_at", { ascending: false })
      joined = joinedData ?? []
    }

    // Get member counts for all groups
    const allGroupIds = [
      ...(created?.map((g) => g.id) ?? []),
      ...joined.map((g) => g.id),
    ]

    const groupsWithCounts = async (groups: typeof created) => {
      if (!groups) return []
      return Promise.all(
        groups.map(async (group) => {
          const { count } = await supabase
            .from("group_members")
            .select("*", { count: "exact", head: true })
            .eq("group_id", group.id)
          return { ...group, member_count: count ?? 0 }
        })
      )
    }

    setCreatedGroups(await groupsWithCounts(created))
    setJoinedGroups(await groupsWithCounts(joined))
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (groupName.trim().length < 3) {
      setError("Group name must be at least 3 characters")
      return
    }

    setCreating(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError("You must be logged in to create a group")
      setCreating(false)
      return
    }

    // Insert group
    const { data: newGroup, error: groupError } = await supabase
      .from("shared_groups")
      .insert({
        group_name: groupName.trim(),
        created_by: user.id,
      })
      .select()
      .single()

    if (groupError) {
      setError(`Could not create group: ${groupError.message}`)
      setCreating(false)
      return
    }

    // Add creator as first member
    const { error: memberError } = await supabase
      .from("group_members")
      .insert({
        group_id: newGroup.id,
        user_id: user.id,
      })

    if (memberError) {
      setError("Group created but could not add you as a member. Please try again.")
    } else {
      setSuccess("Group created successfully!")
      setGroupName("")
      setTimeout(() => setSuccess(null), 2000)
      await fetchGroups()
    }
    setCreating(false)
  }

  const handleDeleteGroup = async (id: string) => {
    setDeletingId(id)
    const { error: deleteError } = await supabase
      .from("shared_groups")
      .delete()
      .eq("id", id)

    if (deleteError) {
      setError("Could not delete group. Please try again.")
    } else {
      setCreatedGroups((prev) => prev.filter((g) => g.id !== id))
    }
    setDeletingId(null)
  }

  const totalGroups = createdGroups.length + joinedGroups.length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-[#003366]">My Groups ⛵</h1>
        <p className="text-[#003366]/60 mt-1 font-body">Create and manage shared expense groups</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#0077BE]/10 flex items-center justify-center text-[#0077BE]">
                <Users size={20} />
              </div>
              <div>
                <p className="text-xs font-mono text-[#003366]/50 tracking-wide">TOTAL GROUPS</p>
                <p className="text-xl font-mono font-bold text-[#003366]">{totalGroups}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#FF7F50]/10 flex items-center justify-center text-[#FF7F50]">
                <Crown size={20} />
              </div>
              <div>
                <p className="text-xs font-mono text-[#003366]/50 tracking-wide">CREATED</p>
                <p className="text-xl font-mono font-bold text-[#003366]">{createdGroups.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#40E0D0]/10 flex items-center justify-center text-[#40E0D0]">
                <UserPlus size={20} />
              </div>
              <div>
                <p className="text-xs font-mono text-[#003366]/50 tracking-wide">JOINED</p>
                <p className="text-xl font-mono font-bold text-[#003366]">{joinedGroups.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Group Form */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-heading font-bold text-[#003366] mb-4">Create a New Group</h2>
          {error && (
            <div className="p-3 mb-4 text-sm bg-[#FFDAD6] text-[#93000A] rounded-md border border-[#93000A]/20">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 mb-4 text-sm bg-[#40E0D0]/20 text-[#006A62] rounded-md border border-[#006A62]/20">
              {success}
            </div>
          )}
          <form onSubmit={handleCreateGroup} className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Group name (e.g. Goa Trip 2025)"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={creating} className="gap-2">
              {creating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Create Group
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Groups I Created */}
      <div className="space-y-3">
        <h2 className="text-lg font-heading font-bold text-[#003366]">Groups I Created 👑</h2>
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 size={32} className="animate-spin text-[#0077BE]" />
          </div>
        ) : createdGroups.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-[#003366]/50 text-lg">You haven&apos;t created any groups yet. Start a voyage! 🏝️</p>
            </CardContent>
          </Card>
        ) : (
          createdGroups.map((group) => (
            <Card key={group.id} className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-[#003366] flex items-center justify-center text-[#40E0D0] font-heading font-bold text-sm">
                    {group.group_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-body font-medium text-[#003366]">{group.group_name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="inline-flex items-center gap-1 text-xs text-[#003366]/50">
                        <Users size={12} /> {group.member_count} {group.member_count === 1 ? "member" : "members"}
                      </span>
                      <span className="text-xs text-[#003366]/40">
                        {new Date(group.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteGroup(group.id)}
                  disabled={deletingId === group.id}
                  className="text-[#BA1A1A]/60 hover:text-[#BA1A1A] hover:bg-[#FFDAD6]"
                >
                  {deletingId === group.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Groups I Joined */}
      <div className="space-y-3">
        <h2 className="text-lg font-heading font-bold text-[#003366]">Groups I Joined 🤝</h2>
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 size={32} className="animate-spin text-[#0077BE]" />
          </div>
        ) : joinedGroups.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-[#003366]/50 text-lg">You haven&apos;t joined any groups yet. Ask a friend to invite you! 🤙</p>
            </CardContent>
          </Card>
        ) : (
          joinedGroups.map((group) => (
            <Card key={group.id} className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-[#40E0D0] flex items-center justify-center text-[#003366] font-heading font-bold text-sm">
                  {group.group_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-body font-medium text-[#003366]">{group.group_name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="inline-flex items-center gap-1 text-xs text-[#003366]/50">
                      <Users size={12} /> {group.member_count} {group.member_count === 1 ? "member" : "members"}
                    </span>
                    <span className="text-xs text-[#003366]/40">
                      {new Date(group.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
