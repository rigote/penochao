"use client"

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import { cn } from "@/lib/utils"

interface ChartContainerProps {
  children: React.ReactNode
  className?: string
  height?: number
}

export function ChartContainer({ children, className, height = 300 }: ChartContainerProps) {
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  )
}

// Custom Tooltip
interface TooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    color: string
  }>
  label?: string
  formatter?: (value: number) => string
}

export function ChartTooltip({ active, payload, label, formatter }: TooltipProps) {
  if (!active || !payload?.length) return null

  const formatValue = formatter || ((v: number) => v.toLocaleString("pt-BR"))

  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-sm">
      {label && <p className="font-medium text-foreground mb-2">{label}</p>}
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">{formatValue(entry.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Area Chart for trends
interface AreaChartData {
  name: string
  [key: string]: string | number
}

interface SimpleAreaChartProps {
  data: AreaChartData[]
  dataKey: string
  color?: string
  gradientId?: string
  height?: number
  showGrid?: boolean
  showXAxis?: boolean
  showYAxis?: boolean
  formatter?: (value: number) => string
}

export function SimpleAreaChart({
  data,
  dataKey,
  color = "#8b5cf6",
  gradientId = "colorGradient",
  height = 200,
  showGrid = false,
  showXAxis = true,
  showYAxis = false,
  formatter,
}: SimpleAreaChartProps) {
  return (
    <ChartContainer height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />}
        {showXAxis && (
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
        )}
        {showYAxis && (
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
        )}
        <Tooltip content={<ChartTooltip formatter={formatter} />} />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          fillOpacity={1}
          fill={`url(#${gradientId})`}
        />
      </AreaChart>
    </ChartContainer>
  )
}

// Bar Chart for comparisons
interface BarChartData {
  name: string
  [key: string]: string | number
}

interface SimpleBarChartProps {
  data: BarChartData[]
  bars: Array<{
    dataKey: string
    color: string
    name?: string
  }>
  height?: number
  showLegend?: boolean
  formatter?: (value: number) => string
}

export function SimpleBarChart({
  data,
  bars,
  height = 300,
  showLegend = true,
  formatter,
}: SimpleBarChartProps) {
  return (
    <ChartContainer height={height}>
      <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
        />
        <Tooltip content={<ChartTooltip formatter={formatter} />} />
        {showLegend && (
          <Legend
            wrapperStyle={{ paddingTop: "20px" }}
            iconType="circle"
            iconSize={8}
          />
        )}
        {bars.map((bar, index) => (
          <Bar
            key={index}
            dataKey={bar.dataKey}
            name={bar.name || bar.dataKey}
            fill={bar.color}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ChartContainer>
  )
}

// Donut Chart for distribution
interface DonutChartData {
  name: string
  value: number
  color: string
}

interface DonutChartProps {
  data: DonutChartData[]
  height?: number
  innerRadius?: number
  outerRadius?: number
  showLabels?: boolean
  centerLabel?: {
    value: string
    label: string
  }
}

export function DonutChart({
  data,
  height = 250,
  innerRadius = 60,
  outerRadius = 90,
  showLabels = false,
  centerLabel,
}: DonutChartProps) {
  return (
    <ChartContainer height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          dataKey="value"
          label={showLabels}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
        {centerLabel && (
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-foreground"
          >
            <tspan
              x="50%"
              dy="-0.5em"
              fontSize="24"
              fontWeight="bold"
              className="fill-foreground"
            >
              {centerLabel.value}
            </tspan>
            <tspan
              x="50%"
              dy="1.5em"
              fontSize="12"
              className="fill-muted-foreground"
            >
              {centerLabel.label}
            </tspan>
          </text>
        )}
      </PieChart>
    </ChartContainer>
  )
}

// Mini Sparkline for inline charts
interface SparklineProps {
  data: number[]
  color?: string
  height?: number
  width?: number
}

export function Sparkline({ data, color = "#8b5cf6", height = 40, width = 100 }: SparklineProps) {
  const chartData = data.map((value, index) => ({ value, index }))

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`sparkline-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fillOpacity={1}
            fill={`url(#sparkline-${color})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// Re-export recharts components for convenience
export {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
}
