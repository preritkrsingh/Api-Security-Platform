import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendType = "positive",
  className,
  onClick,
}) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "relative overflow-hidden border border-zinc-800/80 bg-zinc-950 text-white shadow-none transition-colors duration-150",
        onClick ? "cursor-pointer hover:border-zinc-700 hover:bg-zinc-900/30" : "",
        className
      )}
    >
      <CardContent className="p-4 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-zinc-400">
            {title}
          </span>
          {Icon && (
            <Icon className="h-4 w-4 text-zinc-400" />
          )}
        </div>

        <div className="my-2.5">
          <div className="text-2xl font-semibold tracking-tight text-zinc-100 font-mono">
            {value}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-900">
          <span className="text-[11px] text-zinc-500 truncate max-w-[170px]">
            {subtitle}
          </span>
          {trend && (
            <div className="flex items-center gap-0.5 font-mono text-[11px]">
              {trendType === "positive" ? (
                <span className="flex items-center text-emerald-400 font-medium">
                  <ArrowUpRight className="h-3 w-3 mr-0.5" />
                  {trend}
                </span>
              ) : trendType === "negative" ? (
                <span className="flex items-center text-rose-400 font-medium">
                  <ArrowDownRight className="h-3 w-3 mr-0.5" />
                  {trend}
                </span>
              ) : (
                <span className="flex items-center text-zinc-500">
                  <Minus className="h-3 w-3 mr-0.5" />
                  {trend}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
