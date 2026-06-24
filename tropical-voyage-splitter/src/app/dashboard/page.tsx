import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Ship, Compass, Waves } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userName = "Sailor"
  if (user) {
    const { data } = await supabase
      .from("users")
      .select("name")
      .eq("id", user.id)
      .single()
    if (data?.name) userName = data.name
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-[#003366]">
          Welcome aboard, {userName}! ⛵
        </h1>
        <p className="text-[#003366]/60 mt-2 font-body text-lg">
          Your voyage dashboard — track expenses, manage groups, and settle up.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
          <CardContent className="p-6 flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-[#0077BE]/10 flex items-center justify-center text-[#0077BE] group-hover:bg-[#0077BE] group-hover:text-white transition-colors">
              <Ship size={24} />
            </div>
            <div>
              <p className="text-sm font-mono text-[#003366]/60 tracking-wide">NAVIGATE</p>
              <p className="text-lg font-heading font-bold text-[#003366]">My Expenses</p>
              <p className="text-sm text-[#003366]/50 mt-1">Track your personal spending</p>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
          <CardContent className="p-6 flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-[#40E0D0]/10 flex items-center justify-center text-[#40E0D0] group-hover:bg-[#40E0D0] group-hover:text-[#003366] transition-colors">
              <Compass size={24} />
            </div>
            <div>
              <p className="text-sm font-mono text-[#003366]/60 tracking-wide">EXPLORE</p>
              <p className="text-lg font-heading font-bold text-[#003366]">My Groups</p>
              <p className="text-sm text-[#003366]/50 mt-1">Manage shared trip expenses</p>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
          <CardContent className="p-6 flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-[#FF7F50]/10 flex items-center justify-center text-[#FF7F50] group-hover:bg-[#FF7F50] group-hover:text-white transition-colors">
              <Waves size={24} />
            </div>
            <div>
              <p className="text-sm font-mono text-[#003366]/60 tracking-wide">SETTLE UP</p>
              <p className="text-lg font-heading font-bold text-[#003366]">Quick Split</p>
              <p className="text-sm text-[#003366]/50 mt-1">See who owes what at a glance</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Decorative wave */}
      <div className="wave-divider opacity-50" />
    </div>
  )
}
