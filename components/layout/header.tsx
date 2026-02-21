import { auth } from "@/lib/auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SignOutButton } from "@/components/layout/sign-out-button"

export async function Header({ title }: { title?: string }) {
  const session = await auth()
  const user = session?.user
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U"

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur px-6">
      {title && (
        <h1 className="text-lg font-semibold text-foreground hidden lg:block">{title}</h1>
      )}
      <div className="flex-1 lg:flex-none" />
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 outline-none">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.image ?? ""} alt={user?.name ?? ""} />
              <AvatarFallback className="bg-zinc-800 text-zinc-200 text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.name ?? "User"}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <SignOutButton />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
