// src/components/goals/WeightageChart.tsx
"use client";

interface WeightageChartProps {
  goals: Array<{ weightage: number; title: string; thrustArea?: { name: string } }>;
}

export function WeightageChart({ goals }: WeightageChartProps) {
  // 3-Flow-Shader Cyan Palette Colors
  const colors = [
    "#30b0d0", // accent-default
    "#5cc8e0", // accent-light
    "#1a8ca8", // accent-dark
    "#4a8fa8", // skin-400
    "#6bb3cc", // skin-300
    "#2d5a73", // skin-500
    "#9dd1e0", // skin-200
    "#1e3a4d", // skin-600
  ];
  
  const total = goals.reduce((sum, g) => sum + Number(g.weightage), 0);

  if (goals.length === 0) {
    return (
      <div className="progress-ring-3d w-28 h-28 rounded-full glass flex items-center justify-center" style={{ border: "3px solid rgba(255,255,255,0.06)" }}>
        <span className="font-sans-body" style={{ fontSize: "0.875rem", fontWeight: 700, color: "rgba(237,232,228,0.4)" }}>0%</span>
      </div>
    );
  }

  let cumulativePercent = 0;

  return (
    <div className="progress-ring-3d relative w-28 h-28 flex items-center justify-center group">
      {/* 3D Holographic Glow Base */}
      <div className="absolute inset-0 rounded-full blur-xl transition-all duration-500" style={{ background: "rgba(48,176,208,0.08)" }}></div>

      <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90 filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)] relative z-10">
        {/* Background circle */}
        <circle
          cx="18"
          cy="18"
          r="15.915"
          fill="none"
          stroke="rgba(255,255,255,0.06)"
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
            stroke="rgba(48,176,208,0.08)"
            strokeWidth="3.5"
            strokeDasharray={`${100 - total} ${total}`}
            strokeDashoffset={-total}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
        <span className="font-serif-display" style={{ fontSize: "1.125rem", fontWeight: 800, background: "linear-gradient(135deg, #5cc8e0, #1a8ca8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          {total.toFixed(0)}%
        </span>
        <span className="font-sans-body" style={{ fontSize: "0.5625rem", fontWeight: 600, color: "rgba(237,232,228,0.4)", textTransform: "uppercase", letterSpacing: "0.15em" }}>Allocated</span>
      </div>
    </div>
  );
}
