import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Info } from 'lucide-react';

interface ChartData {
  date: string;
  leads: number;
  adSpend: number;
}

interface PerformanceChartProps {
  data: ChartData[];
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  return (
    <div className="bg-card rounded-2xl p-6 border border-border/50">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="font-semibold text-lg text-foreground">Leads vs Ad Spend</h3>
          <p className="text-sm text-muted-foreground">Performance over time</p>
        </div>
        <div className="group relative">
          <Info className="w-5 h-5 text-muted-foreground cursor-help" />
          <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-popover border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
            <p className="text-sm text-foreground">
              When leads increase faster than ad spend, your campaigns are profitable.
            </p>
          </div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              yAxisId="leads"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              yAxisId="spend"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
            />
            <Legend 
              verticalAlign="top" 
              height={36}
              formatter={(value) => (
                <span style={{ color: 'hsl(var(--foreground))', fontSize: '14px' }}>
                  {value === 'leads' ? 'Leads' : 'Ad Spend'}
                </span>
              )}
            />
            <Line 
              yAxisId="leads"
              type="monotone" 
              dataKey="leads" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
            />
            <Line 
              yAxisId="spend"
              type="monotone" 
              dataKey="adSpend" 
              stroke="#10b981" 
              strokeWidth={3}
              dot={{ fill: '#10b981', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, fill: '#10b981' }}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
