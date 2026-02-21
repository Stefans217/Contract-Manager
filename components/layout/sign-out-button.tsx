"use client"

import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="flex w-full items-center gap-2 text-sm px-2 py-1.5 cursor-default"
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </button>
  )
}
