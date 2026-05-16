// src/app/(dashboard)/employee/checkins/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, CalendarDays, CheckCircle, Clock } from "lucide-react";
import { QuarterTimeline } from "@/components/checkin/QuarterTimeline";

export default function EmployeeCheckInsPage() {
  const { data: sheet, isLoading } = useQuery({
    queryKey: ["goalSheet"],
    queryFn: async () => {
      const res = await fetch("/api/employee/sheet");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const goals = sheet?.goals || [];
  const isLocked = sheet?.status === "locked";

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Check-ins</h1>
          <p className="text-slate-500">Track your quarterly progress</p>
        </div>

        {!isLocked && (
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-600" />
              <p className="text-amber-800">
                Your goal sheet is pending approval. Check-ins will be available after manager approval.
              </p>
            </CardContent>
          </Card>
        )}

        {isLocked && (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" />
                  Quarterly Progress Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QuarterTimeline goals={goals} cycle={sheet?.cycle} />
              </CardContent>
            </Card>

            {/* Goal Check-in Status */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Goal Details</h2>
              {goals.map((goal: any, idx: number) => (
                <Card key={goal.id}>
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold">
                          #{idx + 1} {goal.title}
                        </h3>
                        <p className="text-sm text-slate-500">{goal.uomType?.name}</p>
                      </div>
                      <Badge className={goal.status === "completed" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}>
                        {goal.status.replace("_", " ")}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      {["Q1", "Q2", "Q3", "Q4"].map((q) => {
                        const actual = goal[`${q.toLowerCase()}Actual`];
                        const qStatus = goal[`${q.toLowerCase()}Status`];
                        const hasFeedback = goal[`${q.toLowerCase()}Comment`];

                        return (
                          <div
                            key={q}
                            className={`p-3 rounded-lg border ${
                              actual !== null && actual !== undefined
                                ? "bg-green-50 border-green-200"
                                : "bg-slate-50 border-slate-200"
                            }`}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-sm">{q}</span>
                              {actual !== null && actual !== undefined ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <Clock className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            {actual !== null && actual !== undefined ? (
                              <>
                                <p className="text-sm font-medium">
                                  {goal.uomType?.code === "timeline"
                                    ? new Date(actual).toLocaleDateString()
                                    : actual}
                                </p>
                                <p className="text-xs text-slate-500 capitalize">{qStatus}</p>
                                {hasFeedback && (
                                  <p className="text-xs text-green-600 mt-1">✓ Manager feedback</p>
                                )}
                              </>
                            ) : (
                              <p className="text-xs text-slate-400">Not checked in</p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {goal.progressScore && (
                      <div className="mt-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-600">Overall Progress</span>
                          <span className="font-medium">{Number(goal.progressScore).toFixed(1)}%</span>
                        </div>
                        <Progress value={Number(goal.progressScore)} className="h-2" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
