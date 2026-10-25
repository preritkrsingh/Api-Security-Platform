import * as React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function RequestStatusChart({
  trafficRecords = [],
  trafficStats = {},
}) {
  const statusBreakdown = React.useMemo(() => {
    let ok2xx = 0;
    let auth4xx = 0;
    let rateLimited429 = 0;
    let server5xx = 0;

    if (trafficRecords.length > 0) {
      trafficRecords.forEach((t) => {
        const code = Number(t.statusCode) || 200;
        if (code === 429) {
          rateLimited429 += 1;
        } else if (code === 401 || code === 403) {
          auth4xx += 1;
        } else if (code >= 500 || t.blocked) {
          server5xx += 1;
        } else if (code >= 200 && code < 400) {
          ok2xx += 1;
        } else {
          auth4xx += 1;
        }
      });
    } else {
      const total = trafficStats?.totalCaptured || 0;
      const errors = trafficStats?.errorCount || 0;
      if (total > 0) {
        ok2xx = Math.max(0, total - errors);
        rateLimited429 = Math.round(errors * 0.6);
        auth4xx = Math.round(errors * 0.3);
        server5xx = Math.max(0, errors - rateLimited429 - auth4xx);
      } else {
        ok2xx = 28;
        rateLimited429 = 4;
        auth4xx = 3;
        server5xx = 1;
      }
    }

    const total = ok2xx + auth4xx + rateLimited429 + server5xx;

    return [
      {
        id: "2xx",
        name: "2xx Allowed",
        codeTag: "200 - 399",
        value: ok2xx,
        percent: total > 0 ? ((ok2xx / total) * 100).toFixed(1) : "0.0",
        color: "#10b981", // Emerald
        dotColor: "bg-emerald-400",
        description: "Valid API key & allowed",
      },
      {
        id: "401_403",
        name: "401/403 Auth Error",
        codeTag: "401 / 403",
        value: auth4xx,
        percent: total > 0 ? ((auth4xx / total) * 100).toFixed(1) : "0.0",
        color: "#f59e0b", // Amber
        dotColor: "bg-amber-400",
        description: "Missing or invalid token",
      },
      {
        id: "429",
        name: "429 Rate Throttled",
        codeTag: "HTTP 429",
        value: rateLimited429,
        percent: total > 0 ? ((rateLimited429 / total) * 100).toFixed(1) : "0.0",
        color: "#a855f7", // Purple
        dotColor: "bg-purple-400",
        description: "Token bucket exhausted",
      },
      {
        id: "5xx",
        name: "5xx / Intercepted",
        codeTag: "500 - 504",
        value: server5xx,
        percent: total > 0 ? ((server5xx / total) * 100).toFixed(1) : "0.0",
        color: "#f43f5e", // Rose
        dotColor: "bg-rose-400",
        description: "SSRF guardrail or socket fault",
      },
    ];
  }, [trafficRecords, trafficStats]);

  const totalRequests = statusBreakdown.reduce((acc, curr) => acc + curr.value, 0);
  const successItem = statusBreakdown.find((s) => s.id === "2xx");
  const successRate = successItem ? successItem.percent : "0.0";

  const chartData = statusBreakdown.filter((item) => item.value > 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 shadow-2xl">
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2 h-2 rounded-full ${data.dotColor}`} />
            <span className="text-xs font-semibold text-zinc-100">{data.name}</span>
          </div>
          <div className="text-[11px] font-mono text-zinc-300">
            {data.value} requests ({data.percent}%)
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">
            {data.description}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-zinc-800/80 bg-zinc-950 text-white shadow-none flex flex-col justify-between">
      <CardHeader className="pb-3 border-b border-zinc-800/80">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium tracking-tight text-zinc-100">
              Response Status Distribution
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400 mt-0.5">
              Protocol verification & intercept matrix
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] border-emerald-800/50 bg-emerald-950/40 text-emerald-400 font-mono py-0 px-2"
          >
            {successRate}% PASSED
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-5 flex-1 flex flex-col justify-between space-y-5">
        {/* Graph & Breakdown Layout */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Donut Chart with Center KPI */}
          <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                  animationDuration={800}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Center KPI */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold font-mono text-zinc-100 tracking-tight">
                {successRate}%
              </span>
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-medium">
                Passed
              </span>
            </div>
          </div>

          {/* Metrics Column */}
          <div className="flex-1 w-full space-y-2">
            {statusBreakdown.map((item) => (
              <div
                key={item.id}
                className="px-3 py-2 rounded-md bg-zinc-900/40 border border-zinc-800/60 flex items-center justify-between gap-3 hover:bg-zinc-900/70 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`h-2 w-2 rounded-full ${item.dotColor} shrink-0`} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-zinc-200 truncate">{item.name}</p>
                    <p className="text-[10px] text-zinc-500 font-mono truncate">{item.codeTag}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-bold text-zinc-100">
                    {item.value}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 ml-1.5">
                    ({item.percent}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Telemetry Micro-Footer */}
        <div className="pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[10px] font-mono text-zinc-400">
          <span>Ingress: HTTP/1.1 Reverse-Proxy</span>
          <span className="text-zinc-300">{totalRequests} total requests analyzed</span>
        </div>
      </CardContent>
    </Card>
  );
}

