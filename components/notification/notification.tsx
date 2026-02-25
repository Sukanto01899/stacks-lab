import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type NotificationVariant = "info" | "success" | "warning" | "error";

const variantClasses: Record<NotificationVariant, string> = {
  info: "border-primary/30 bg-primary/10 text-foreground",
  success: "border-emerald-500/30 bg-emerald-500/10 text-foreground",
  warning: "border-amber-500/30 bg-amber-500/10 text-foreground",
  error: "border-red-500/30 bg-red-500/10 text-foreground",
};

export interface NotificationProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  variant?: NotificationVariant;
  icon?: ReactNode;
  actions?: ReactNode;
}

export function Notification({
  title,
  description,
  variant = "info",
  icon,
  actions,
  className,
  ...props
}: NotificationProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-sm",
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {icon ? <div className="mt-0.5 text-base">{icon}</div> : null}
      <div className="min-w-0 flex-1 space-y-1">
        {title ? <div className="font-semibold">{title}</div> : null}
        {description ? (
          <div className="text-muted-foreground">{description}</div>
        ) : null}
      </div>
      {actions ? <div className="ml-auto flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}