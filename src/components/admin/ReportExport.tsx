// src/components/admin/ReportExport.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";

export function ReportExport() {
  const [cycleId, setCycleId] = useState("");
  const [exporting, setExporting] = useState<"excel" | "csv" | null>(null);

  const { data: cycles = [] } = useQuery({
    queryKey: ["cycles"],
    queryFn: async () => {
      const res = await fetch("/api/admin/cycles");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const handleExport = async (format: "excel" | "csv") => {
    if (!cycleId) return;
    setExporting(format);
    
    try {
      const endpoint = format === "excel" ? "/api/admin/reports/achievement" : "/api/admin/reports/csv";
      const res = await fetch(`${endpoint}?cycleId=${cycleId}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `achievement_report_${cycleId}.${format === "excel" ? "xlsx" : "csv"}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Export Achievement Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Select value={cycleId} onValueChange={(val) => setCycleId(val || "")}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select Cycle..." />
              </SelectTrigger>
              <SelectContent>
                {cycles.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => handleExport("excel")}
              disabled={!cycleId || exporting !== null}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {exporting === "excel" ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 mr-2" />
              )}
              Export Excel
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport("csv")}
              disabled={!cycleId || exporting !== null}
            >
              {exporting === "csv" ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileText className="w-4 h-4 mr-2" />
              )}
              Export CSV
            </Button>
          </div>

          {!cycleId && (
            <p className="text-sm text-slate-500">Select a cycle to export</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Report Contents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-slate-600">
            <p className="font-medium text-slate-900">The achievement report includes:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Employee ID and Name</li>
              <li>Department and Manager</li>
              <li>Goal Title and Thrust Area</li>
              <li>UoM Type and Planned Target</li>
              <li>Actual Achievement and Progress Score</li>
              <li>Weightage and Status</li>
              <li>Q1-Q4 Actual values and Status</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
