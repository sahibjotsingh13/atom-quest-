// src/components/checkin/QuarterTimeline.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, Clock, Lock } from "lucide-react";

interface QuarterTimelineProps {
  goals: any[];
  cycle: any;
}

export function QuarterTimeline({ goals, cycle }: QuarterTimelineProps) {
  const quarters = [
    { name: "Q1", label: "Q1", period: "July", start: cycle?.q1Start, end: cycle?.q1End },
    { name: "Q2", label: "Q2", period: "October", start: cycle?.q2Start, end: cycle?.q2End },
    { name: "Q3", label: "Q3", period: "January", start: cycle?.q3Start, end: cycle?.q3End },
    { name: "Q4", label: "Q4", period: "March/April", start: cycle?.q4Start, end: cycle?.q4End },
  ];

  const now = new Date();

  const getQuarterStatus = (q: any) => {
    if (!q.start || !q.end) return { status: "unknown", isOpen: false };
    
    const start = new Date(q.start);
    const end = new Date(q.end);
    
    if (now >= start && now <= end) return { status: "open", isOpen: true };
    if (now > end) return { status: "closed", isOpen: false };
    return { status: "upcoming", isOpen: false };
  };

  const getGoalQuarterData = (goal: any, quarter: string) => {
    const ci = goal.checkIns?.find((c: any) => c.quarter === quarter);
    return {
      actual: ci?.actualValue,
      status: ci?.status,
      comment: ci?.comment,
    };
  };

  const getCompletionRate = (quarter: string) => {
    if (!goals || goals.length === 0) return 0;
    const completed = goals.filter((g) => {
      const data = getGoalQuarterData(g, quarter);
      return data.actual !== null && data.actual !== undefined;
    }).length;
    return Math.round((completed / goals.length) * 100);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {quarters.map((q) => {
        const { status, isOpen } = getQuarterStatus(q);
        const completionRate = getCompletionRate(q.name);
        const allGoalsDone = completionRate === 100 && goals.length > 0;

        return (
          <Card
            key={q.name}
            className={`${
              isOpen
                ? "ring-2 ring-primary border-primary"
                : status === "closed"
                ? "opacity-75"
                : ""
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-lg">{q.label}</span>
                {isOpen ? (
                  <Badge className="bg-green-100 text-green-700">
                    <Clock className="w-3 h-3 mr-1" /> Open
                  </Badge>
                ) : status === "closed" ? (
                  <Badge variant="outline" className="text-slate-500">
                    <Lock className="w-3 h-3 mr-1" /> Closed
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-slate-400">
                    Upcoming
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 mb-3">{q.period}</p>

              {/* Completion Progress */}
              {goals && goals.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">Progress</span>
                    <span className="font-medium">{completionRate}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        allGoalsDone ? "bg-green-500" : isOpen ? "bg-primary" : "bg-slate-400"
                      }`}
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    {goals.filter((g) => {
                      const data = getGoalQuarterData(g, q.name);
                      return data.actual !== null && data.actual !== undefined;
                    }).length}{" "}
                    of {goals.length} goals
                  </p>
                </div>
              )}

              {(!goals || goals.length === 0) && (
                <p className="text-xs text-slate-400 italic">No goals added</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
