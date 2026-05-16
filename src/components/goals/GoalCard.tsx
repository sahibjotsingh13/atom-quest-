// src/components/goals/GoalCard.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, Calendar, Edit2, Trash2, Lock } from "lucide-react";

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
      case "not_started": return "bg-slate-100 text-slate-700";
      case "on_track": return "bg-blue-100 text-blue-700";
      case "completed": return "bg-green-100 text-green-700";
      case "at_risk": return "bg-amber-100 text-amber-700";
      case "delayed": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-700";
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
    <Card className={goal.isShared ? "border-blue-200 bg-blue-50/30" : ""}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-medium text-slate-500">#{index + 1}</span>
              {goal.isShared && (
                <Badge variant="outline" className="text-blue-600 border-blue-200">
                  <Lock className="w-3 h-3 mr-1" /> Shared
                </Badge>
              )}
              <Badge className={getStatusColor(goal.status)}>
                {goal.status?.replace("_", " ") || "Not Started"}
              </Badge>
            </div>

            {/* Title & Description */}
            <h3 className="text-lg font-semibold text-slate-900 mb-1">{goal.title}</h3>
            {goal.description && (
              <p className="text-sm text-slate-600 mb-3">{goal.description}</p>
            )}

            {/* Details Grid */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm mb-4">
              <div className="flex items-center gap-1.5">
                <Target className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">Target:</span>
                <span className="font-medium">{formatTarget()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">Weightage:</span>
                <span className="font-medium">{goal.weightage}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">{goal.thrustArea?.name}</span>
              </div>
            </div>

            {/* Progress */}
            {goal.progressScore !== null && goal.progressScore !== undefined && (
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Progress</span>
                  <span className="font-medium">{Number(goal.progressScore).toFixed(1)}%</span>
                </div>
                <Progress value={Number(goal.progressScore)} className="h-2" />
              </div>
            )}

            {/* Quarter Indicators */}
            <div className="flex gap-2">
              {["Q1", "Q2", "Q3", "Q4"].map((q) => {
                const actual = goal[`${q.toLowerCase()}Actual`];
                return (
                  <div
                    key={q}
                    className={`px-3 py-1 rounded text-xs font-medium ${
                      actual !== null && actual !== undefined
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {q}: {actual !== null && actual !== undefined ? "✓" : "○"}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 ml-4">
            {isEditable && !goal.isShared && (
              <>
                <Button size="sm" variant="ghost" onClick={onEdit}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={onDelete}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </>
            )}
            {!isEditable && (
              <Button size="sm" onClick={onCheckIn}>
                Check-in
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
