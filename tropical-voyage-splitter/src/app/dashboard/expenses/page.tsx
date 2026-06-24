"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Trash2, Plus, Loader2, IndianRupee, TrendingUp, Hash, Calculator } from "lucide-react"

const CATEGORIES = [
  { value: "Food", emoji: "🍽️" },
  { value: "Transport", emoji: "🚗" },
  { value: "Entertainment", emoji: "🎬" },
  { value: "Shopping", emoji: "🛍️" },
  { value: "Utilities", emoji: "💡" },
  { value: "Health", emoji: "🏥" },
  { value: "Other", emoji: "📦" },
]

interface Expense {
  id: string
  description: string
  amount: number
  category: string
  created_at: string
}

export default function ExpensesPage() {
  const supabase = createClient()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("Food")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchExpenses = useCallback(async () => {
    const { data, error } = await supabase
      .from("personal_expenses")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      setError("Could not load your expenses. Please try again.")
    } else {
      setExpenses(data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!description.trim()) {
      setError("Please describe your expense")
      return
    }
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount greater than 0")
      return
    }

    setAdding(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError("You must be logged in to add expenses")
      setAdding(false)
      return
    }

    const { error: insertError } = await supabase
      .from("personal_expenses")
      .insert({
        user_id: user.id,
        description: description.trim(),
        amount: numAmount,
        category,
      })

    if (insertError) {
      setError("Could not add expense. Please try again.")
    } else {
      setSuccess("Expense added successfully!")
      setDescription("")
      setAmount("")
      setCategory("Food")
      setTimeout(() => setSuccess(null), 2000)
      await fetchExpenses()
    }
    setAdding(false)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    const { error: deleteError } = await supabase
      .from("personal_expenses")
      .delete()
      .eq("id", id)

    if (deleteError) {
      setError("Could not delete expense. Please try again.")
    } else {
      setExpenses((prev) => prev.filter((exp) => exp.id !== id))
    }
    setDeletingId(null)
  }

  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const thisMonth = expenses
    .filter((e) => {
      const d = new Date(e.created_at)
      const now = new Date()
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    .reduce((sum, e) => sum + Number(e.amount), 0)
  const avgExpense = expenses.length > 0 ? totalSpent / expenses.length : 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-[#003366]">My Expenses 💰</h1>
        <p className="text-[#003366]/60 mt-1 font-body">Track your personal spending</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#0077BE]/10 flex items-center justify-center text-[#0077BE]">
                <IndianRupee size={20} />
              </div>
              <div>
                <p className="text-xs font-mono text-[#003366]/50 tracking-wide">TOTAL SPENT</p>
                <p className="text-xl font-mono font-bold text-[#003366]">₹{totalSpent.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#40E0D0]/10 flex items-center justify-center text-[#40E0D0]">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-xs font-mono text-[#003366]/50 tracking-wide">THIS MONTH</p>
                <p className="text-xl font-mono font-bold text-[#003366]">₹{thisMonth.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#FF7F50]/10 flex items-center justify-center text-[#FF7F50]">
                <Hash size={20} />
              </div>
              <div>
                <p className="text-xs font-mono text-[#003366]/50 tracking-wide">EXPENSES</p>
                <p className="text-xl font-mono font-bold text-[#003366]">{expenses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#006A62]/10 flex items-center justify-center text-[#006A62]">
                <Calculator size={20} />
              </div>
              <div>
                <p className="text-xs font-mono text-[#003366]/50 tracking-wide">AVERAGE</p>
                <p className="text-xl font-mono font-bold text-[#003366]">₹{avgExpense.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Expense Form */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-heading font-bold text-[#003366] mb-4">Add New Expense</h2>
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
          <form onSubmit={handleAddExpense} className="flex flex-col md:flex-row gap-3">
            <Input
              placeholder="What did you spend on?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex-1"
            />
            <Input
              type="number"
              placeholder="Amount (₹)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full md:w-32"
              step="0.01"
              min="0.01"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-10 rounded-md border border-[#0077BE]/30 bg-white/80 px-3 text-sm text-[#003366] focus:outline-none focus:ring-2 focus:ring-[#40E0D0]"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.emoji} {cat.value}
                </option>
              ))}
            </select>
            <Button type="submit" disabled={adding} className="gap-2">
              {adding ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Add Expense
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Expenses List */}
      <div className="space-y-3">
        <h2 className="text-lg font-heading font-bold text-[#003366]">Recent Expenses</h2>
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 size={32} className="animate-spin text-[#0077BE]" />
          </div>
        ) : expenses.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-[#003366]/50 text-lg">No expenses yet. Start tracking your spending! 🏝️</p>
            </CardContent>
          </Card>
        ) : (
          expenses.map((expense) => {
            const cat = CATEGORIES.find((c) => c.value === expense.category)
            return (
              <Card key={expense.id} className="hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">{cat?.emoji ?? "📦"}</div>
                    <div>
                      <p className="font-body font-medium text-[#003366]">{expense.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center rounded-full bg-[#0077BE]/10 px-2.5 py-0.5 text-xs font-mono text-[#0077BE]">
                          {expense.category}
                        </span>
                        <span className="text-xs text-[#003366]/40">
                          {new Date(expense.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-lg font-mono font-bold text-[#003366]">₹{Number(expense.amount).toFixed(2)}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(expense.id)}
                      disabled={deletingId === expense.id}
                      className="text-[#BA1A1A]/60 hover:text-[#BA1A1A] hover:bg-[#FFDAD6]"
                    >
                      {deletingId === expense.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
