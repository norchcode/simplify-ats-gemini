import * as React from "react";
import { cn } from "@/lib/utils";

function Tabs({ className, children, ...props }) {
  return (
    <div className={cn("w-full", className)} {...props}>
      {children}
    </div>
  );
}

function TabsList({ className, ...props }) {
  return <div className={cn("grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/5 p-1", className)} {...props} />;
}

function TabsTrigger({ className, active, ...props }) {
  return (
    <button
      className={cn(
        "rounded-lg px-3 py-2 text-sm font-semibold transition",
        active ? "bg-indigo-500 text-white" : "text-slate-300 hover:bg-slate-800/60",
        className
      )}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger };
