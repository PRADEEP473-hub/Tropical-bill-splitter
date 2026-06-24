"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Anchor } from "lucide-react"

function getPasswordStrength(password: string): { label: string; color: string; width: string } {
  if (password.length === 0) return { label: "", color: "", width: "0%" }
  if (password.length < 6) return { label: "Weak", color: "bg-[#BA1A1A]", width: "33%" }
  if (password.length < 10 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return { label: "Medium", color: "bg-[#FF7F50]", width: "66%" }
  }
  return { label: "Strong", color: "bg-[#006A62]", width: "100%" }
}

export default function SignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const strength = getPasswordStrength(password)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Client-side validation
    if (!name.trim()) {
      setError("Please enter your full name")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    })

    if (signUpError) {
      if (signUpError.message.includes("already registered")) {
        setError("An account with this email already exists")
      } else {
        setError(signUpError.message)
      }
      setLoading(false)
    } else {
      setSuccess("Account created successfully! Redirecting...")
      setTimeout(() => {
        router.push("/dashboard")
        router.refresh()
      }, 1500)
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
          <CardTitle className="text-3xl text-[#003366]">Join the Crew</CardTitle>
          <CardDescription>Create your account to start splitting expenses</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm bg-[#FFDAD6] text-[#93000A] rounded-md border border-[#93000A]/20">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 text-sm bg-[#40E0D0]/20 text-[#006A62] rounded-md border border-[#006A62]/20">
                {success}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium font-mono text-[#003366] tracking-wide" htmlFor="name">FULL NAME</label>
              <Input
                id="name"
                type="text"
                placeholder="Captain Jack"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium font-mono text-[#003366] tracking-wide" htmlFor="signup-email">EMAIL ADDRESS</label>
              <Input
                id="signup-email"
                type="email"
                placeholder="sailor@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium font-mono text-[#003366] tracking-wide" htmlFor="signup-password">PASSWORD</label>
              <Input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {password.length > 0 && (
                <div className="space-y-1">
                  <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full ${strength.color} transition-all duration-300 rounded-full`} style={{ width: strength.width }} />
                  </div>
                  <p className="text-xs text-[#003366]/60">{strength.label}</p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium font-mono text-[#003366] tracking-wide" htmlFor="confirm-password">CONFIRM PASSWORD</label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? "Creating Account..." : "Sign Up"}
            </Button>
            <div className="text-sm text-center text-[#003366]/70">
              Already have an account?{" "}
              <Link href="/login" className="text-[#0077BE] font-medium hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
