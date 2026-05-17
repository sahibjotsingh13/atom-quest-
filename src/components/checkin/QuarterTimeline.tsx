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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {quarters.map((q) => {
        const { status, isOpen } = getQuarterStatus(q);
        const completionRate = getCompletionRate(q.name);
        const allGoalsDone = completionRate === 100 && goals.length > 0;

        return (
          <div
            key={q.name}
            className={`glass rounded-2xl transition-all duration-500 overflow-hidden ${
              isOpen
                ? "border border-accent/40 bg-accent/5 shadow-[0_8px_32px_0_rgba(48,176,208,0.15)] ring-2 ring-accent/30"
                : status === "closed"
                ? "opacity-75 bg-skin-900/40 border border-skin-800 shadow-none"
                : "bg-skin-900/60 border border-skin-800 shadow-sm"
            }`}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="font-serif-display font-bold text-xl text-skin-50">{q.label}</span>
                {isOpen ? (
                  <Badge className="bg-[#5cc8e0]/20 text-[#5cc8e0] border border-[#5cc8e0]/30 px-2.5 py-1 rounded-lg font-sans-body shadow-sm">
                    <Clock className="w-3.5 h-3.5 mr-1.5 animate-pulse" /> Open
                  </Badge>
                ) : status === "closed" ? (
                  <Badge variant="outline" className="text-skin-400 border-skin-700 bg-skin-800/50 px-2.5 py-1 rounded-lg font-sans-body">
                    <Lock className="w-3.5 h-3.5 mr-1.5" /> Closed
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-skin-500 border-skin-800 bg-skin-900/50 px-2.5 py-1 rounded-lg font-sans-body">
                    Upcoming
                  </Badge>
                )}
              </div>
              <p className="font-sans-body text-xs text-skin-400 mb-4 font-medium">{q.period}</p>

              {/* Completion Progress */}
              {goals && goals.length > 0 && (
                <div className="space-y-2 font-sans-body">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-skin-300">Progress</span>
                    <span className="text-accent-light font-bold">{completionRate}%</span>
                  </div>
                  <div className="relative w-full bg-skin-800 rounded-full h-2 overflow-hidden p-0.5 shadow-inner">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${
                        allGoalsDone ? "bg-gradient-to-r from-green-500 to-emerald-400 shadow-[0_0_12px_rgba(34,197,94,0.5)]" : isOpen ? "bg-gradient-to-r from-accent-light to-accent-dark shadow-[0_0_12px_rgba(48,176,208,0.5)]" : "bg-skin-600"
                      }`}
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                  <p className="text-xs text-skin-400 pt-1 font-medium">
                    {goals.filter((g) => {
                      const data = getGoalQuarterData(g, q.name);
                      return data.actual !== null && data.actual !== undefined;
                    }).length}{" "}
                    of {goals.length} goals completed
                  </p>
                </div>
              )}

              {(!goals || goals.length === 0) && (
                <p className="font-sans-body text-xs text-skin-500 italic py-2">No goals added</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
