"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Anchor } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError("Invalid email or password")
      setLoading(false)
    } else {
      router.push("/dashboard")
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#F7F9FF] to-[#F5F5DC]">
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-[#0077BE]/10 to-transparent pointer-events-none" />
      
      <Card className="w-full max-w-md relative z-10 glass-panel">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 bg-[#003366] rounded-xl flex items-center justify-center text-[#40E0D0] shadow-lg">
              <Anchor size={28} />
            </div>
          </div>
          <CardTitle className="text-3xl text-[#003366]">Welcome Aboard</CardTitle>
          <CardDescription>Sign in to manage your voyage expenses</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm bg-[#FFDAD6] text-[#93000A] rounded-md border border-[#93000A]/20">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium font-mono text-[#003366] tracking-wide" htmlFor="email">EMAIL ADDRESS</label>
              <Input
                id="email"
                type="email"
                placeholder="sailor@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium font-mono text-[#003366] tracking-wide" htmlFor="password">PASSWORD</label>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full text-lg h-12" 
              disabled={loading}
              variant="ticket"
            >
              {loading ? "Signing In..." : "Sign In"}
            </Button>
            <div className="text-sm text-center text-[#003366]/70">
              New to the crew?{" "}
              <Link href="/signup" className="text-[#0077BE] font-medium hover:underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
