// src/components/goals/GoalCard.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, Calendar, Edit2, Trash2, Lock, CheckCircle2, Circle } from "lucide-react";

interface GoalCardProps {
  goal: any;
  index: number;
  isEditable: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onCheckIn: () => void;
}

export function GoalCard({ goal, index, isEditable, onEdit, onDelete, onCheckIn }: GoalCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "not_started": return "bg-skin-100 text-skin-700 dark:bg-skin-800 dark:text-skin-200 border-skin-300 dark:border-skin-700";
      case "on_track": return "bg-accent/10 text-accent dark:text-accent-light border-accent/30";
      case "completed": return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30";
      case "at_risk": return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
      case "delayed": return "bg-destructive/10 text-destructive dark:text-red-400 border-destructive/30";
      default: return "bg-skin-100 text-skin-700 dark:bg-skin-800 dark:text-skin-200 border-skin-300 dark:border-skin-700";
    }
  };

  const formatTarget = () => {
    if (goal.uomType?.code === "timeline" && goal.targetDate) {
      return new Date(goal.targetDate).toLocaleDateString();
    }
    if (goal.uomType?.code?.includes("percentage")) {
      return `${goal.targetValue}%`;
    }
    return goal.targetValue?.toLocaleString();
  };

  return (
    <div 
      className={`goal-stack-item glass rounded-2xl p-6 transition-all duration-500 hover:shadow-2xl hover:border-accent/40 relative overflow-hidden ${
        goal.isShared 
          ? "border-blue-500/30 bg-blue-500/5 dark:bg-blue-500/10 shadow-[0_8px_32px_0_rgba(59,130,246,0.1)]" 
          : "bg-white/60 dark:bg-skin-900/60 shadow-[0_8px_32px_0_rgba(160,126,111,0.05)]"
      }`}
    >
      {/* Decorative Shimmer / Glow */}
      <div className="absolute -right-20 -top-20 w-40 h-40 bg-accent/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex justify-between items-start gap-6 relative z-10">
        <div className="flex-1 space-y-4">
          {/* Header Row */}
          <div className="flex items-center gap-3 depth-1">
            <span className="w-8 h-8 rounded-xl bg-skin-200 dark:bg-skin-800 flex items-center justify-center text-sm font-bold text-skin-700 dark:text-skin-200 shadow-inner">
              #{index + 1}
            </span>
            {goal.isShared && (
              <Badge variant="outline" className="text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 px-3 py-1 rounded-lg shadow-sm">
                <Lock className="w-3.5 h-3.5 mr-1.5" /> Shared Goal
              </Badge>
            )}
            <Badge className={`px-3 py-1 rounded-lg border text-xs font-semibold capitalize shadow-sm ${getStatusColor(goal.status)}`}>
              {goal.status?.replace("_", " ") || "Not Started"}
            </Badge>
          </div>

          {/* Title & Description */}
          <div className="depth-2 space-y-1.5">
            <h3 className="text-xl font-bold text-skin-900 dark:text-skin-50 tracking-tight">{goal.title}</h3>
            {goal.description && (
              <p className="text-sm text-skin-600 dark:text-skin-300 line-clamp-2 leading-relaxed">{goal.description}</p>
            )}
          </div>

          {/* Details Grid */}
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm depth-1 pt-2 border-t border-skin-200/50 dark:border-skin-800/50">
            <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-xl bg-skin-100/50 dark:bg-skin-800/50">
              <Target className="w-4 h-4 text-accent" />
              <span className="text-skin-500 dark:text-skin-400 font-medium">Target:</span>
              <span className="font-bold text-skin-900 dark:text-skin-100">{formatTarget()}</span>
            </div>
            <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-xl bg-skin-100/50 dark:bg-skin-800/50">
              <TrendingUp className="w-4 h-4 text-accent" />
              <span className="text-skin-500 dark:text-skin-400 font-medium">Weightage:</span>
              <span className="font-bold text-accent dark:text-accent-light">{goal.weightage}%</span>
            </div>
            {goal.thrustArea && (
              <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-xl bg-skin-100/50 dark:bg-skin-800/50">
                <Calendar className="w-4 h-4 text-accent" />
                <span className="font-semibold text-skin-800 dark:text-skin-200">{goal.thrustArea.name}</span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {goal.progressScore !== null && goal.progressScore !== undefined && (
            <div className="space-y-2 pt-2 depth-2">
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-skin-600 dark:text-skin-300">Overall Progress</span>
                <span className="text-accent dark:text-accent-light">{Number(goal.progressScore).toFixed(1)}%</span>
              </div>
              <div className="relative h-3 w-full bg-skin-200 dark:bg-skin-800 rounded-full overflow-hidden p-0.5 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-accent-light via-accent to-accent-dark rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(255,112,67,0.5)]"
                  style={{ width: `${Math.min(100, Math.max(0, Number(goal.progressScore)))}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Quarter Indicators */}
          <div className="flex flex-wrap gap-2 pt-2 depth-1">
            {["Q1", "Q2", "Q3", "Q4"].map((q) => {
              const actual = goal[`${q.toLowerCase()}Actual`];
              const hasCheckIn = actual !== null && actual !== undefined;
              return (
                <div
                  key={q}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-transform hover:scale-105 ${
                    hasCheckIn
                      ? "bg-gradient-to-r from-green-500/20 to-green-500/10 text-green-700 dark:text-green-300 border border-green-500/30"
                      : "bg-skin-100/80 dark:bg-skin-800/80 text-skin-500 dark:text-skin-400 border border-skin-200 dark:border-skin-700"
                  }`}
                >
                  {hasCheckIn ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" /> : <Circle className="w-3.5 h-3.5" />}
                  <span>{q}</span>
                  {hasCheckIn && <span className="font-bold ml-1 bg-green-500/20 px-1.5 py-0.5 rounded text-[10px]">{actual}</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 depth-3 border-l border-skin-200/50 dark:border-skin-800/50 pl-6 my-auto">
          {isEditable && !goal.isShared && (
            <>
              <Button 
                size="sm" 
                variant="outline" 
                className="btn-3d w-12 h-12 rounded-xl bg-skin-100 dark:bg-skin-800 border-skin-200 dark:border-skin-700 hover:bg-accent hover:text-white transition-all shadow-sm"
                onClick={onEdit}
                title="Edit Goal"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="btn-3d w-12 h-12 rounded-xl bg-skin-100 dark:bg-skin-800 border-skin-200 dark:border-skin-700 hover:bg-destructive hover:text-white transition-all shadow-sm"
                onClick={onDelete}
                title="Delete Goal"
              >
                <Trash2 className="w-4 h-4 text-destructive group-hover:text-white" />
              </Button>
            </>
          )}
          {!isEditable && (
            <Button 
              size="sm" 
              className="btn-3d px-6 py-5 rounded-xl bg-gradient-to-r from-accent-light to-accent-dark hover:from-accent hover:to-accent-dark text-white font-bold shadow-lg shadow-accent/20"
              onClick={onCheckIn}
            >
              Check-in
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
