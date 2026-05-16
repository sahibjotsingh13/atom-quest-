// src/components/goals/WeightageChart.tsx
"use client";

interface WeightageChartProps {
  goals: Array<{ weightage: number; title: string; thrustArea?: { name: string } }>;
}

export function WeightageChart({ goals }: WeightageChartProps) {
  const colors = ["#2563eb", "#059669", "#d97706", "#dc2626", "#7c3aed", "#db2777", "#0891b2", "#65a30d"];
  
  const total = goals.reduce((sum, g) => sum + Number(g.weightage), 0);

  if (goals.length === 0) {
    return (
      <div className="w-24 h-24 rounded-full border-4 border-slate-200 flex items-center justify-center">
        <span className="text-xs text-slate-400">0%</span>
      </div>
    );
  }

  let cumulativePercent = 0;

  return (
    <div className="relative w-24 h-24">
      <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="18"
          cy="18"
          r="15.915"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="3"
        />
        {/* Segments */}
        {goals.map((goal, i) => {
          const percent = (Number(goal.weightage) / 100) * 100;
          const dashArray = `${percent} ${100 - percent}`;
          const dashOffset = -cumulativePercent;
          cumulativePercent += percent;
          
          return (
            <circle
              key={i}
              cx="18"
              cy="18"
              r="15.915"
              fill="none"
              stroke={colors[i % colors.length]}
              strokeWidth="3"
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              className="transition-all duration-500"
            />
          );
        })}
        {/* Remaining */}
        {total < 100 && (
          <circle
            cx="18"
            cy="18"
            r="15.915"
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="3"
            strokeDasharray={`${100 - total} ${total}`}
            strokeDashoffset={-total}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-slate-700">{total.toFixed(0)}%</span>
      </div>
    </div>
  );
}
