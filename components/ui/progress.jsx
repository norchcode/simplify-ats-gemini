import * as React from "react";
import { cn } from "@/lib/utils";

const Progress = React.forwardRef(({ className, value = 0, ...props }, ref) => (
  <div ref={ref} className={cn("relative h-2 w-full overflow-hidden rounded-full bg-slate-700/70", className)} {...props}>
    <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
  </div>
));
Progress.displayName = "Progress";

export { Progress };
