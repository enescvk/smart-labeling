
/// <reference types="vite/client" />
/// <reference types="react" />
/// <reference types="react-dom" />
/// <reference types="@tanstack/react-query" />

// Fix for BadgeProps in PendingInvitations.tsx
declare module "@/components/ui/badge" {
  export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "secondary" | "destructive" | "outline";
    children?: React.ReactNode;
  }
}
