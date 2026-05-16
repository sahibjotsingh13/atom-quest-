// src/app/(dashboard)/manager/checkins/page.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckInReview } from "@/components/manager/CheckInReview";
import { Loader2, MessageSquare, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ManagerCheckInsPage() {
  const [selectedCheckIn, setSelectedCheckIn] = useState<any>(null);
  const [filterQuarter, setFilterQuarter] = useState("all");

  const { data: checkIns, isLoading } = useQuery({
    queryKey: ["managerCheckIns"],
    queryFn: async () => {
      const res = await fetch("/api/manager/checkins");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const filteredCheckIns = checkIns?.filter((ci: any) => {
    if (filterQuarter === "all") return true;
    return ci.quarter === filterQuarter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "not_started": return <Badge variant="outline">Not Started</Badge>;
      case "on_track": return <Badge className="bg-blue-100 text-blue-700">On Track</Badge>;
      case "completed": return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
      case "at_risk": return <Badge className="bg-amber-100 text-amber-700">At Risk</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Team Check-ins</h1>
            <p className="text-slate-500">Review and provide feedback on quarterly progress</p>
          </div>
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-slate-400" />
            <Select value={filterQuarter} onValueChange={(val) => setFilterQuarter(val || "all")}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Filter..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Quarters</SelectItem>
                <SelectItem value="Q1">Q1</SelectItem>
                <SelectItem value="Q2">Q2</SelectItem>
                <SelectItem value="Q3">Q3</SelectItem>
                <SelectItem value="Q4">Q4</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          {filteredCheckIns?.map((checkIn: any) => (
            <Card
              key={checkIn.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedCheckIn(checkIn)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {checkIn.goal?.goalSheet?.employee?.firstName?.[0]}
                        {checkIn.goal?.goalSheet?.employee?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {checkIn.goal?.goalSheet?.employee?.firstName}{" "}
                        {checkIn.goal?.goalSheet?.employee?.lastName}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {checkIn.goal?.title} • {checkIn.quarter}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(checkIn.status)}
                    {checkIn.managerComment ? (
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        <MessageSquare className="w-3 h-3 mr-1" /> Replied
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 border-amber-200">
                        Pending Review
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Actual:</span>
                    <p className="font-medium">
                      {checkIn.goal?.uomType?.code === "timeline"
                        ? (checkIn.actualDate ? new Date(checkIn.actualDate).toLocaleDateString() : "No Date")
                        : checkIn.actualAchievement}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Progress:</span>
                    <p className="font-medium">{Number(checkIn.goal?.progressScore || 0).toFixed(1)}%</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Date:</span>
                    <p className="font-medium">{new Date(checkIn.checkInDate).toLocaleDateString()}</p>
                  </div>
                </div>

                {checkIn.employeeComment && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-lg text-sm">
                    <span className="text-slate-500">Comment: </span>
                    <span className="text-slate-700">{checkIn.employeeComment}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {filteredCheckIns?.length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No check-ins yet</h3>
              <p className="text-slate-500">Check-ins will appear here when employees submit them.</p>
            </div>
          )}
        </div>
      </div>

      <CheckInReview
        open={!!selectedCheckIn}
        onClose={() => setSelectedCheckIn(null)}
        checkIn={selectedCheckIn}
      />
    </AppLayout>
  );
}
