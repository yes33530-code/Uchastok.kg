'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Props {
  data: { name: string; color: string; count: number }[]
}

export function StageChart({ data }: Props) {
  const filtered = data.filter(d => d.count > 0)
  if (filtered.length === 0) return <p className="text-sm text-gray-400 text-center py-8">Нет данных</p>

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={filtered} layout="vertical" margin={{ left: 0, right: 10 }}>
        <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11 }}
          width={130}
          tickFormatter={v => v.length > 18 ? v.slice(0, 18) + '…' : v}
        />
        <Tooltip formatter={(value) => [value, 'Участков']} />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {filtered.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
