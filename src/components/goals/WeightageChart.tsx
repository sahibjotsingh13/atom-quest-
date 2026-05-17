// src/components/goals/WeightageChart.tsx
"use client";

interface WeightageChartProps {
  goals: Array<{ weightage: number; title: string; thrustArea?: { name: string } }>;
}

export function WeightageChart({ goals }: WeightageChartProps) {
  // Premium 3D Portal Palette Colors
  const colors = [
    "#ff7043", // accent
    "#a07e6f", // skin-500
    "#ffab91", // accent-light
    "#8d6e63", // skin-600
    "#d84315", // accent-dark
    "#d2bab0", // skin-400
    "#6d4c41", // skin-700
    "#e0cec7", // skin-300
  ];
  
  const total = goals.reduce((sum, g) => sum + Number(g.weightage), 0);

  if (goals.length === 0) {
    return (
      <div className="progress-ring-3d w-28 h-28 rounded-full glass border-4 border-skin-200 dark:border-skin-800 flex items-center justify-center shadow-lg">
        <span className="text-sm font-bold text-skin-400 dark:text-skin-500">0%</span>
      </div>
    );
  }

  let cumulativePercent = 0;

  return (
    <div className="progress-ring-3d relative w-28 h-28 flex items-center justify-center group">
      {/* 3D Holographic Glow Base */}
      <div className="absolute inset-0 rounded-full bg-accent/10 blur-xl group-hover:bg-accent/20 transition-all duration-500"></div>

      <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90 filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)] relative z-10">
        {/* Background circle */}
        <circle
          cx="18"
          cy="18"
          r="15.915"
          fill="none"
          stroke="rgba(160,126,111,0.15)"
          strokeWidth="3.5"
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
              strokeWidth="3.5"
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              className="transition-all duration-1000 ease-out hover:stroke-[4.5] cursor-pointer"
              strokeLinecap="round"
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
            stroke="rgba(255,112,67,0.1)"
            strokeWidth="3.5"
            strokeDasharray={`${100 - total} ${total}`}
            strokeDashoffset={-total}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center relative z-20 pointer-events-none">
        <span className="text-lg font-extrabold bg-gradient-to-r from-skin-900 to-accent dark:from-skin-50 dark:to-accent-light bg-clip-text text-transparent">
          {total.toFixed(0)}%
        </span>
        <span className="text-[9px] font-semibold text-skin-500 dark:text-skin-400 uppercase tracking-widest">Allocated</span>
      </div>
    </div>
  );
}
