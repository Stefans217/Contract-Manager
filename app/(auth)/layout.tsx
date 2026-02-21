import { Toaster } from "@/components/ui/toaster"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      {children}
      <Toaster />
    </div>
  )
}
