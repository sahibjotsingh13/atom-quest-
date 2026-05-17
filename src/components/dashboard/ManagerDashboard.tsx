// src/components/dashboard/ManagerDashboard.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Users,
  Clock,
  CheckCircle,
  FileText,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Loader2,
  Eye,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  RotateCcw,
  MessageSquare,
  Activity,
  Sparkles,
} from "lucide-react";
import { CheckInReview } from "@/components/manager/CheckInReview";

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
  sheetId?: string;
  sheetStatus: string;
  goalCount: number;
  totalWeightage: number;
  avgProgress: number;
  checkinRate: number;
  submittedAt?: string;
}

interface TeamSummary {
  totalMembers: number;
  pendingApprovals: number;
  approvedSheets: number;
  draftSheets: number;
  noSheets: number;
  avgTeamProgress: number;
}

export function ManagerDashboard() {
  const queryClient = useQueryClient();
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [sheetDetail, setSheetDetail] = useState<any>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [edits, setEdits] = useState<
    Record<string, { targetValue?: number; weightage?: number }>
  >({});
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"members" | "checkins">("members");
  const [reviewingCheckIn, setReviewingCheckIn] = useState<any>(null);

  // Fetch team data
  const { data: teamData, isLoading } = useQuery({
    queryKey: ["managerTeam"],
    queryFn: async () => {
      const res = await fetch("/api/manager/team");
      if (!res.ok) throw new Error("Failed to fetch team");
      return res.json();
    },
  });

  // Fetch team check-ins
  const { data: checkIns = [], isLoading: isLoadingCheckIns } = useQuery({
    queryKey: ["managerCheckIns"],
    queryFn: async () => {
      const res = await fetch("/api/manager/checkins");
      if (!res.ok) throw new Error("Failed to fetch check-ins");
      return res.json();
    },
  });

  // Fetch sheet detail
  const fetchSheetDetail = async (sheetId: string) => {
    const res = await fetch(`/api/manager/sheet/${sheetId}`);
    if (!res.ok) throw new Error("Failed to fetch sheet");
    return res.json();
  };

  // Review mutation
  const reviewSheet = useMutation({
    mutationFn: async ({ sheetId, action, edits, rejectionReason }: any) => {
      const res = await fetch("/api/manager/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetId, action, edits, rejectionReason }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || err.errors?.[0] || "Failed to review");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setActionSuccess(data.message);
      setShowReviewModal(false);
      setShowRejectDialog(false);
      setEdits({});
      setRejectionReason("");
      queryClient.invalidateQueries({ queryKey: ["managerTeam"] });
      setTimeout(() => setActionSuccess(""), 5000);
    },
    onError: (err: any) => {
      setActionError(err.message);
    },
  });

  const members: TeamMember[] = teamData?.members || [];
  const summary: TeamSummary = teamData?.summary || {
    totalMembers: 0,
    pendingApprovals: 0,
    approvedSheets: 0,
    draftSheets: 0,
    noSheets: 0,
    avgTeamProgress: 0,
  };

  const handleViewSheet = async (member: TeamMember) => {
    if (!member.sheetId) return;
    setSelectedMember(member);
    try {
      const detail = await fetchSheetDetail(member.sheetId);
      setSheetDetail(detail);
      setShowReviewModal(true);
      setEdits({});
      setActionError("");
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleEditChange = (goalId: string, field: string, value: number) => {
    setEdits((prev) => ({
      ...prev,
      [goalId]: {
        ...prev[goalId],
        [field]: value,
      },
    }));
  };

  const handleApprove = () => {
    setActionError("");
    const editArray = Object.entries(edits).map(([goalId, values]) => ({
      goalId,
      ...values,
    }));
    reviewSheet.mutate({
      sheetId: sheetDetail?.id,
      action: "approve",
      edits: editArray.length > 0 ? editArray : undefined,
    });
  };

  const handleReject = () => {
    if (!rejectionReason.trim() || rejectionReason.trim().length < 10) {
      setActionError("Rejection reason must be at least 10 characters");
      return;
    }
    setActionError("");
    reviewSheet.mutate({
      sheetId: sheetDetail?.id,
      action: "reject",
      rejectionReason,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline" className="px-3 py-1 text-xs font-semibold bg-skin-100 dark:bg-skin-800 text-skin-700 dark:text-skin-200 border-skin-300 dark:border-skin-700 shadow-sm">Draft</Badge>;
      case "submitted":
        return (
          <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-3 py-1 text-xs font-semibold shadow-sm shimmer">
            <Clock className="w-3 h-3 mr-1" /> Pending Approval
          </Badge>
        );
      case "locked":
        return (
          <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 border border-green-500/30 px-3 py-1 text-xs font-semibold shadow-sm">
            <CheckCircle className="w-3 h-3 mr-1" /> Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="px-3 py-1 text-xs font-semibold shadow-sm animate-pulse">
            <XCircle className="w-3 h-3 mr-1" /> Rejected
          </Badge>
        );
      default:
        return <Badge variant="secondary" className="px-3 py-1 text-xs font-semibold shadow-sm">No Sheet</Badge>;
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[70vh]">
          <Loader2 className="w-12 h-12 animate-spin text-accent" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8 max-w-7xl mx-auto pb-16">
        {/* Top Hero Banner */}
        <div className="glass rounded-3xl p-8 shadow-2xl border border-skin-200/60 dark:border-skin-800/60 relative overflow-hidden bg-gradient-to-r from-skin-100/40 via-transparent to-accent/5 dark:from-skin-900/40 dark:via-transparent dark:to-accent/10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
          
          <div className="flex justify-between items-center gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight text-skin-900 dark:text-skin-50">Team Dashboard</h1>
                <span className="bg-accent/20 text-accent dark:text-accent-light border border-accent/30 px-3 py-1 rounded-full text-xs font-bold shadow-sm animate-pulse flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> 3D Live Portal
                </span>
              </div>
              <p className="text-skin-600 dark:text-skin-300 text-sm font-medium">
                Manage your team&apos;s strategic goal sheets, review quarterly check-ins, and track alignment
              </p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-light to-accent-dark flex items-center justify-center shadow-xl transform hover:rotate-12 transition-transform duration-300 flex-shrink-0">
              <Users className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
        </div>

        {/* 3D Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="iso-card glass rounded-2xl p-6 shadow-lg border border-skin-200/60 dark:border-skin-800/60 bg-white/40 dark:bg-skin-900/40 flex items-center gap-4 group">
            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-3xl font-extrabold text-skin-900 dark:text-skin-50">{summary.totalMembers}</p>
              <p className="text-xs text-skin-500 dark:text-skin-400 font-semibold uppercase tracking-wider mt-0.5">Team Members</p>
            </div>
          </div>

          <div className="iso-card glass rounded-2xl p-6 shadow-lg border border-skin-200/60 dark:border-skin-800/60 bg-white/40 dark:bg-skin-900/40 flex items-center gap-4 group">
            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{summary.pendingApprovals}</p>
              <p className="text-xs text-skin-500 dark:text-skin-400 font-semibold uppercase tracking-wider mt-0.5">Pending Approvals</p>
            </div>
          </div>

          <div className="iso-card glass rounded-2xl p-6 shadow-lg border border-skin-200/60 dark:border-skin-800/60 bg-white/40 dark:bg-skin-900/40 flex items-center gap-4 group">
            <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20 group-hover:scale-110 transition-transform">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-3xl font-extrabold text-green-600 dark:text-green-400">{summary.approvedSheets}</p>
              <p className="text-xs text-skin-500 dark:text-skin-400 font-semibold uppercase tracking-wider mt-0.5">Approved Sheets</p>
            </div>
          </div>

          <div className="iso-card glass rounded-2xl p-6 shadow-lg border border-skin-200/60 dark:border-skin-800/60 bg-white/40 dark:bg-skin-900/40 flex items-center gap-4 group">
            <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">{summary.avgTeamProgress}%</p>
              <p className="text-xs text-skin-500 dark:text-skin-400 font-semibold uppercase tracking-wider mt-0.5">Avg Progress</p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {actionSuccess && (
          <Alert className="glass rounded-2xl border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-300 shadow-lg animate-fade-in">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <AlertDescription className="ml-2 font-semibold">
              {actionSuccess}
            </AlertDescription>
          </Alert>
        )}

        {/* Pending Approvals Alert */}
        {summary.pendingApprovals > 0 && (
          <Alert className="glass rounded-2xl border-amber-500/50 bg-amber-500/10 text-amber-800 dark:text-amber-300 shadow-lg animate-pulse">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="ml-2 font-semibold">
              You have <strong className="text-amber-600 dark:text-amber-400 font-extrabold">{summary.pendingApprovals}</strong> goal sheet(s)
              pending your approval.
            </AlertDescription>
          </Alert>
        )}

        {/* Tab Switcher */}
        <div className="flex border-b border-skin-200 dark:border-skin-800 gap-4">
          <button
            className={`px-6 py-4 text-sm font-bold transition-all border-b-4 flex items-center gap-2 ${
              activeTab === "members"
                ? "border-accent text-accent dark:text-accent-light bg-accent/5 rounded-t-xl"
                : "border-transparent text-skin-500 hover:text-skin-900 dark:hover:text-skin-100"
            }`}
            onClick={() => setActiveTab("members")}
          >
            <Users className="w-4 h-4" />
            <span>Team Members</span>
          </button>
          <button
            className={`px-6 py-4 text-sm font-bold transition-all border-b-4 flex items-center gap-2 ${
              activeTab === "checkins"
                ? "border-accent text-accent dark:text-accent-light bg-accent/5 rounded-t-xl"
                : "border-transparent text-skin-500 hover:text-skin-900 dark:hover:text-skin-100"
            }`}
            onClick={() => setActiveTab("checkins")}
          >
            <Activity className="w-4 h-4" />
            <span>Recent Check-ins</span>
            {checkIns.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-accent text-white font-extrabold badge-bounce">
                {checkIns.length}
              </Badge>
            )}
          </button>
        </div>

        {activeTab === "members" ? (
          <>
            {/* Team Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.map((member) => (
                <div
                  key={member.id}
                  className={`iso-card glass rounded-3xl p-6 shadow-xl border transition-all duration-500 cursor-pointer hover:shadow-2xl hover:border-accent/40 bg-white/40 dark:bg-skin-900/40 relative overflow-hidden group ${
                    member.sheetStatus === "submitted" ? "border-amber-500/50 shadow-[0_8px_32px_0_rgba(245,158,11,0.15)]" : "border-skin-200/60 dark:border-skin-800/60"
                  }`}
                  onClick={() => handleViewSheet(member)}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl pointer-events-none group-hover:bg-accent/10 transition-colors"></div>

                  <div className="flex items-start justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 border-2 border-accent/20 shadow-md">
                        <AvatarFallback className="bg-gradient-to-br from-skin-400 to-skin-600 text-white font-bold text-base">
                          {member.firstName[0]}
                          {member.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-bold text-lg text-skin-900 dark:text-skin-50 group-hover:text-accent dark:group-hover:text-accent-light transition-colors">
                          {member.firstName} {member.lastName}
                        </h3>
                        <p className="text-xs text-skin-500 dark:text-skin-400 font-medium mt-0.5">
                          {member.employeeId}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(member.sheetStatus)}
                  </div>

                  <div className="space-y-4 relative z-10 border-t border-skin-200/50 dark:border-skin-800/50 pt-4">
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-skin-600 dark:text-skin-300">Total Goals</span>
                      <span className="font-bold text-skin-900 dark:text-skin-50">{member.goalCount}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-skin-600 dark:text-skin-300">Allocated Weightage</span>
                      <span className="font-bold text-accent dark:text-accent-light">{member.totalWeightage}%</span>
                    </div>
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-sm font-semibold">
                        <span className="text-skin-600 dark:text-skin-300">Average Progress</span>
                        <span className="font-bold text-skin-900 dark:text-skin-50">{member.avgProgress}%</span>
                      </div>
                      <div className="relative h-2.5 w-full bg-skin-200 dark:bg-skin-800 rounded-full overflow-hidden p-0.5 shadow-inner">
                        <div 
                          className="h-full bg-gradient-to-r from-accent-light via-accent to-accent-dark rounded-full transition-all duration-1000 ease-out shadow-sm"
                          style={{ width: `${Math.min(100, member.avgProgress)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm font-semibold pt-1">
                      <span className="text-skin-600 dark:text-skin-300">Check-in Rate</span>
                      <span className="font-bold text-green-600 dark:text-green-400">{member.checkinRate}%</span>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end relative z-10 border-t border-skin-200/50 dark:border-skin-800/50 pt-4">
                    <Button variant="ghost" size="sm" className="btn-3d text-accent dark:text-accent-light hover:bg-accent hover:text-white transition-all font-bold rounded-xl px-4 py-2 flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>View Goal Sheet</span>
                      <ChevronRight className="w-4 h-4 ml-0.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {members.length === 0 && (
              <div className="glass rounded-3xl p-16 text-center border border-dashed border-skin-300 dark:border-skin-700 bg-white/30 dark:bg-skin-900/30 shadow-xl space-y-4">
                <Users className="w-12 h-12 text-skin-300 dark:text-skin-700 mx-auto animate-pulse" />
                <h3 className="text-xl font-extrabold text-skin-900 dark:text-skin-50">
                  No Team Members Assigned
                </h3>
                <p className="text-skin-500 dark:text-skin-400 text-sm max-w-sm mx-auto">
                  You don&apos;t have any direct reports assigned to your management hierarchy yet.
                </p>
              </div>
            )}
          </>
        ) : (
          /* Check-ins Feed */
          <div className="space-y-6">
            {checkIns.map((ci: any) => (
              <div key={ci.id} className="iso-card glass rounded-3xl p-6 shadow-xl border border-skin-200/60 dark:border-skin-800/60 bg-white/40 dark:bg-skin-900/40 hover:shadow-2xl transition-all duration-500 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl pointer-events-none group-hover:bg-accent/10 transition-colors"></div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 border-2 border-accent/20 shadow-md flex-shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-skin-400 to-skin-600 text-white font-bold text-base">
                        {ci.goal?.goalSheet?.employee?.firstName?.[0]}
                        {ci.goal?.goalSheet?.employee?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg text-skin-900 dark:text-skin-50">
                          {ci.goal?.goalSheet?.employee?.firstName} {ci.goal?.goalSheet?.employee?.lastName}
                        </span>
                        <Badge variant="outline" className="bg-accent/10 text-accent dark:text-accent-light border-accent/30 px-3 py-1 rounded-lg text-xs font-bold shadow-sm">
                          {ci.quarter} Check-in
                        </Badge>
                      </div>
                      <p className="text-sm font-semibold text-skin-700 dark:text-skin-200">{ci.goal?.title}</p>
                      <p className="text-xs text-skin-500 dark:text-skin-400 line-clamp-2 pt-1">{ci.notes}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 w-full md:w-auto border-t md:border-t-0 border-skin-200/50 dark:border-skin-800/50 pt-4 md:pt-0">
                    <span className="text-xs font-semibold text-skin-400 dark:text-skin-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(ci.createdAt).toLocaleDateString()}</span>
                    </span>
                    <Button 
                      size="sm" 
                      className="btn-3d px-6 py-5 rounded-2xl bg-gradient-to-r from-accent-light to-accent-dark hover:from-accent hover:to-accent-dark text-white font-bold shadow-lg shadow-accent/20 flex items-center gap-2 w-full md:w-auto justify-center"
                      onClick={() => setReviewingCheckIn(ci)}
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>{ci.managerComment ? "Update Feedback" : "Review Check-in"}</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {checkIns.length === 0 && (
              <div className="glass rounded-3xl p-16 text-center border border-dashed border-skin-300 dark:border-skin-700 bg-white/30 dark:bg-skin-900/30 shadow-xl space-y-4">
                <Activity className="w-12 h-12 text-skin-300 dark:text-skin-700 mx-auto animate-pulse" />
                <h3 className="text-xl font-extrabold text-skin-900 dark:text-skin-50">
                  No Recent Team Activity
                </h3>
                <p className="text-skin-500 dark:text-skin-400 text-sm max-w-sm mx-auto">
                  Your team hasn&apos;t submitted any quarterly performance check-ins for review yet.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass rounded-3xl border border-skin-200/60 dark:border-skin-800/60 bg-white/90 dark:bg-skin-950/90 shadow-2xl p-8 backdrop-blur-2xl">
          <DialogHeader className="border-b border-skin-200/50 dark:border-skin-800/50 pb-6 mb-6">
            <DialogTitle className="flex items-center gap-3 text-2xl font-extrabold text-skin-900 dark:text-skin-50">
              <FileText className="w-7 h-7 text-accent" />
              <span>Reviewing {sheetDetail?.employee?.firstName} {sheetDetail?.employee?.lastName}&apos;s Goal Sheet</span>
              {sheetDetail?.status === "submitted" && (
                <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-3 py-1 rounded-xl text-xs font-bold shadow-sm animate-pulse ml-auto">
                  Pending Review
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {actionError && (
            <Alert variant="destructive" className="glass rounded-2xl border-destructive/50 bg-destructive/10 text-destructive dark:text-red-300 shadow-lg mb-6">
              <AlertTriangle className="h-5 w-5" />
              <AlertDescription className="ml-2 font-semibold">{actionError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            {/* Sheet Info Bar */}
            <div className="glass rounded-2xl p-6 bg-skin-100/50 dark:bg-skin-900/50 border border-skin-200/60 dark:border-skin-800/60 flex flex-wrap justify-between items-center gap-6 shadow-inner">
              <div className="space-y-1">
                <span className="text-xs text-skin-500 dark:text-skin-400 font-semibold uppercase tracking-wider">Performance Cycle</span>
                <p className="text-base font-bold text-skin-900 dark:text-skin-50">{sheetDetail?.cycle?.name}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-skin-500 dark:text-skin-400 font-semibold uppercase tracking-wider">Allocated Weightage</span>
                <p className="text-base font-bold text-accent dark:text-accent-light">{sheetDetail?.totalWeightage}%</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-skin-500 dark:text-skin-400 font-semibold uppercase tracking-wider">Total Objectives</span>
                <p className="text-base font-bold text-skin-900 dark:text-skin-50">{sheetDetail?.goals?.length} Goals</p>
              </div>
            </div>

            {/* Goals List */}
            <div className="space-y-6">
              {sheetDetail?.goals?.map((goal: any, idx: number) => (
                <div
                  key={goal.id}
                  className={`glass rounded-2xl p-6 border shadow-lg transition-all ${
                    goal.isShared 
                      ? "border-blue-500/30 bg-blue-500/5 dark:bg-blue-500/10 shadow-[0_8px_32px_0_rgba(59,130,246,0.05)]" 
                      : "border-skin-200/60 dark:border-skin-800/60 bg-white/40 dark:bg-skin-900/40"
                  }`}
                >
                  <div className="flex justify-between items-start gap-6">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-skin-200 dark:bg-skin-800 flex items-center justify-center text-xs font-bold text-skin-700 dark:text-skin-200 shadow-inner">
                          #{idx + 1}
                        </span>
                        {goal.isShared && (
                          <Badge variant="outline" className="text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 px-3 py-1 rounded-lg text-xs font-bold shadow-sm">
                            Shared Goal
                          </Badge>
                        )}
                        <Badge variant="secondary" className="px-3 py-1 rounded-lg text-xs font-semibold shadow-sm">
                          {goal.thrustArea?.name}
                        </Badge>
                      </div>

                      <h4 className="text-lg font-bold text-skin-900 dark:text-skin-50 tracking-tight">
                        {goal.title}
                      </h4>
                      {goal.description && (
                        <p className="text-sm text-skin-600 dark:text-skin-300 leading-relaxed">
                          {goal.description}
                        </p>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-skin-200/50 dark:border-skin-800/50 text-sm">
                        <div className="glass px-4 py-2.5 rounded-xl bg-skin-100/50 dark:bg-skin-800/50 space-y-1">
                          <span className="text-xs text-skin-500 dark:text-skin-400 font-medium block">UoM Type</span>
                          <p className="font-bold text-skin-900 dark:text-skin-100">{goal.uomType?.name}</p>
                        </div>
                        <div className="glass px-4 py-2.5 rounded-xl bg-skin-100/50 dark:bg-skin-800/50 space-y-1">
                          <span className="text-xs text-skin-500 dark:text-skin-400 font-medium block">Current Target</span>
                          <p className="font-bold text-skin-900 dark:text-skin-100">
                            {goal.uomType?.code === "timeline" && goal.targetDate
                              ? new Date(goal.targetDate).toLocaleDateString()
                              : goal.targetValue}
                          </p>
                        </div>
                        <div className="glass px-4 py-2.5 rounded-xl bg-skin-100/50 dark:bg-skin-800/50 space-y-1">
                          <span className="text-xs text-skin-500 dark:text-skin-400 font-medium block">Weightage</span>
                          <p className="font-bold text-accent dark:text-accent-light">{goal.weightage}%</p>
                        </div>
                      </div>

                      {/* Inline Editing (only for pending review) */}
                      {sheetDetail?.status === "submitted" && !goal.isShared && (
                        <div className="mt-6 p-6 glass rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-4 shadow-sm">
                          <p className="text-sm font-bold text-amber-700 dark:text-amber-300 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Inline Manager Adjustments (Optional)</span>
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold text-amber-800 dark:text-amber-200">
                                Adjusted Target Value
                              </Label>
                              <Input
                                type="number"
                                step="any"
                                defaultValue={goal.targetValue || ""}
                                onChange={(e) =>
                                  handleEditChange(
                                    goal.id,
                                    "targetValue",
                                    parseFloat(e.target.value)
                                  )
                                }
                                className="input-3d h-11 rounded-xl bg-white dark:bg-skin-900 border-skin-200 dark:border-skin-700 text-sm font-semibold"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold text-amber-800 dark:text-amber-200">
                                Adjusted Weightage (%)
                              </Label>
                              <Input
                                type="number"
                                step="0.1"
                                min="10"
                                max="100"
                                defaultValue={goal.weightage}
                                onChange={(e) =>
                                  handleEditChange(
                                    goal.id,
                                    "weightage",
                                    parseFloat(e.target.value)
                                  )
                                }
                                className="input-3d h-11 rounded-xl bg-white dark:bg-skin-900 border-skin-200 dark:border-skin-700 text-sm font-semibold"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Validation Warning */}
            {sheetDetail?.status === "submitted" &&
              Number(sheetDetail?.totalWeightage) !== 100 && (
                <Alert variant="destructive" className="glass rounded-2xl border-destructive/50 bg-destructive/10 text-destructive dark:text-red-300 shadow-lg animate-pulse">
                  <AlertTriangle className="h-5 w-5" />
                  <AlertDescription className="ml-2 font-semibold">
                    Total weightage is currently <strong className="font-extrabold">{sheetDetail?.totalWeightage}%</strong>. Must equal
                    exactly 100% before approval.
                  </AlertDescription>
                </Alert>
              )}

            {/* Action Buttons */}
            {sheetDetail?.status === "submitted" && (
              <div className="flex flex-wrap justify-end gap-4 pt-6 border-t border-skin-200/50 dark:border-skin-800/50 sticky bottom-0 bg-white/80 dark:bg-skin-950/80 backdrop-blur-md py-4 z-20 rounded-b-3xl">
                <Button
                  variant="outline"
                  className="btn-3d px-6 py-5 rounded-2xl bg-skin-100 dark:bg-skin-800 border-skin-200 dark:border-skin-700 hover:bg-destructive hover:text-white transition-all font-bold shadow-sm"
                  onClick={() => setShowRejectDialog(true)}
                  disabled={reviewSheet.isPending}
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  <span>Return for Rework</span>
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={
                    reviewSheet.isPending ||
                    Number(sheetDetail?.totalWeightage) !== 100
                  }
                  className="btn-3d px-8 py-5 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold shadow-lg shadow-green-500/20 flex items-center gap-2"
                >
                  {reviewSheet.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                  <span>Approve & Lock Sheet</span>
                </Button>
              </div>
            )}

            {/* Locked/Approved Actions (Unlock/Reset) */}
            {(sheetDetail?.status === "locked" || sheetDetail?.status === "approved") && (
              <div className="flex flex-wrap justify-end gap-4 pt-6 border-t border-skin-200/50 dark:border-skin-800/50 sticky bottom-0 bg-white/80 dark:bg-skin-950/80 backdrop-blur-md py-4 z-20 rounded-b-3xl">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm("Reset this sheet to draft? All approval history will be cleared.")) {
                      reviewSheet.mutate({ sheetId: sheetDetail.id, action: "reset" });
                    }
                  }}
                  disabled={reviewSheet.isPending}
                  className="btn-3d px-6 py-5 rounded-2xl text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500 hover:text-white transition-all font-bold shadow-sm"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  <span>Reset to Draft Mode</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm("Unlock this sheet for further editing?")) {
                      reviewSheet.mutate({ sheetId: sheetDetail.id, action: "unlock" });
                    }
                  }}
                  disabled={reviewSheet.isPending}
                  className="btn-3d px-6 py-5 rounded-2xl text-blue-600 dark:text-blue-400 border-blue-500/30 bg-blue-500/10 hover:bg-blue-500 hover:text-white transition-all font-bold shadow-sm"
                >
                  <Unlock className="w-5 h-5 mr-2" />
                  <span>Unlock for Employee Edits</span>
                </Button>
              </div>
            )}

            {/* View-only for approved/rejected */}
            {sheetDetail?.status !== "submitted" && (
              <div className="flex justify-end pt-6 border-t border-skin-200/50 dark:border-skin-800/50 sticky bottom-0 bg-white/80 dark:bg-skin-950/80 backdrop-blur-md py-4 z-20 rounded-b-3xl">
                <Button
                  variant="outline"
                  className="btn-3d px-8 py-5 rounded-2xl bg-skin-100 dark:bg-skin-800 border-skin-200 dark:border-skin-700 hover:bg-skin-200 dark:hover:bg-skin-700 transition-all font-bold shadow-sm"
                  onClick={() => setShowReviewModal(false)}
                >
                  Close Modal
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-lg glass rounded-3xl border border-skin-200/60 dark:border-skin-800/60 bg-white/90 dark:bg-skin-950/90 shadow-2xl p-8 backdrop-blur-2xl">
          <DialogHeader className="border-b border-skin-200/50 dark:border-skin-800/50 pb-4 mb-4">
            <DialogTitle className="text-xl font-extrabold text-skin-900 dark:text-skin-50 flex items-center gap-2">
              <XCircle className="w-6 h-6 text-destructive" />
              <span>Return Goal Sheet for Rework</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <p className="text-sm font-medium text-skin-600 dark:text-skin-300 leading-relaxed">
              Please provide comprehensive, actionable feedback explaining why this goal sheet requires adjustments. Your feedback will be directly visible on the employee&apos;s dashboard.
            </p>
            <div className="space-y-2">
              <Textarea
                placeholder="e.g., Please review Objective #2 to ensure the target is SMART. Also, rebalance the weightage distribution..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={5}
                className="input-3d rounded-2xl bg-white dark:bg-skin-900 border-skin-200 dark:border-skin-700 p-4 text-sm font-medium leading-relaxed resize-none focus:border-destructive"
              />
              <div className="flex justify-between items-center text-xs font-semibold px-1">
                <span className={rejectionReason.length > 0 && rejectionReason.length < 10 ? "text-destructive" : "text-skin-500 dark:text-skin-400"}>
                  Minimum 10 characters required
                </span>
                <span className="text-skin-500 dark:text-skin-400">
                  {rejectionReason.length} characters
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-4 pt-4 border-t border-skin-200/50 dark:border-skin-800/50">
              <Button
                variant="outline"
                className="btn-3d px-6 py-5 rounded-2xl bg-skin-100 dark:bg-skin-800 border-skin-200 dark:border-skin-700 hover:bg-skin-200 dark:hover:bg-skin-700 transition-all font-bold shadow-sm"
                onClick={() => setShowRejectDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="btn-3d px-8 py-5 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold shadow-lg shadow-red-500/20 flex items-center gap-2"
                onClick={handleReject}
                disabled={
                  reviewSheet.isPending || rejectionReason.trim().length < 10
                }
              >
                {reviewSheet.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                <span>Confirm Return for Rework</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Check-in Review Modal */}
      <CheckInReview
        open={!!reviewingCheckIn}
        onClose={() => setReviewingCheckIn(null)}
        checkIn={reviewingCheckIn}
      />
    </AppLayout>
  );
}