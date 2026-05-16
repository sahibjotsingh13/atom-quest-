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
        return <Badge variant="outline">Draft</Badge>;
      case "submitted":
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
            <Clock className="w-3 h-3 mr-1" /> Pending Approval
          </Badge>
        );
      case "locked":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" /> Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" /> Rejected
          </Badge>
        );
      default:
        return <Badge variant="secondary">No Sheet</Badge>;
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
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Team Dashboard</h1>
            <p className="text-slate-500">
              Manage your team&apos;s goals and progress
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{summary.totalMembers}</p>
                  <p className="text-xs text-slate-500">Team Members</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">
                    {summary.pendingApprovals}
                  </p>
                  <p className="text-xs text-slate-500">Pending Approvals</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {summary.approvedSheets}
                  </p>
                  <p className="text-xs text-slate-500">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{summary.avgTeamProgress}%</p>
                  <p className="text-xs text-slate-500">Avg Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {actionSuccess && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {actionSuccess}
            </AlertDescription>
          </Alert>
        )}

        {/* Pending Approvals Alert */}
        {summary.pendingApprovals > 0 && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              You have <strong>{summary.pendingApprovals}</strong> goal sheet(s)
              pending your approval.
            </AlertDescription>
          </Alert>
        )}

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200">
          <button
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "members"
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
            onClick={() => setActiveTab("members")}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Team Members
            </div>
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "checkins"
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
            onClick={() => setActiveTab("checkins")}
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Recent Check-ins
              {checkIns.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 h-4 min-w-[16px] flex items-center justify-center">
                  {checkIns.length}
                </Badge>
              )}
            </div>
          </button>
        </div>

        {activeTab === "members" ? (
          <>
            {/* Team Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((member) => (
                <Card
                  key={member.id}
                  className={`cursor-pointer hover:shadow-md transition-shadow ${
                    member.sheetStatus === "submitted" ? "ring-2 ring-amber-200" : ""
                  }`}
                  onClick={() => handleViewSheet(member)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                            {member.firstName[0]}
                            {member.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {member.firstName} {member.lastName}
                          </h3>
                          <p className="text-sm text-slate-500">
                            {member.employeeId}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(member.sheetStatus)}
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Goals</span>
                        <span className="font-medium">{member.goalCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Weightage</span>
                        <span className="font-medium">{member.totalWeightage}%</span>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-600">Progress</span>
                          <span className="font-medium">{member.avgProgress}%</span>
                        </div>
                        <Progress value={member.avgProgress} className="h-2" />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Check-ins</span>
                        <span className="font-medium">{member.checkinRate}%</span>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <Button variant="ghost" size="sm" className="text-slate-500">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {members.length === 0 && (
              <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  No team members
                </h3>
                <p className="text-slate-500">
                  You don&apos;t have any direct reports yet.
                </p>
              </div>
            )}
          </>
        ) : (
          /* Check-ins Feed */
          <div className="space-y-4">
            {checkIns.map((ci: any) => (
              <Card key={ci.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-[10px] bg-slate-100">
                          {ci.goal?.goalSheet?.employee?.firstName?.[0]}
                          {ci.goal?.goalSheet?.employee?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">
                            {ci.goal?.goalSheet?.employee?.firstName} {ci.goal?.goalSheet?.employee?.lastName}
                          </span>
                          <Badge variant="outline" className="text-[10px] h-4">
                            {ci.quarter}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500">{ci.goal?.title}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-[10px] text-slate-400">
                        {new Date(ci.createdAt).toLocaleDateString()}
                      </span>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 text-xs"
                        onClick={() => setReviewingCheckIn(ci)}
                      >
                        <MessageSquare className="w-3 h-3 mr-1" />
                        {ci.managerComment ? "Update Feedback" : "Review"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {checkIns.length === 0 && (
              <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
                <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  No recent activity
                </h3>
                <p className="text-slate-500">
                  Your team hasn&apos;t submitted any check-ins yet.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Review: {sheetDetail?.employee?.firstName}{" "}
              {sheetDetail?.employee?.lastName}&apos;s Goal Sheet
              {sheetDetail?.status === "submitted" && (
                <Badge className="bg-amber-100 text-amber-700 ml-2">
                  Pending Review
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {actionError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{actionError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {/* Sheet Info */}
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <div className="text-sm">
                <span className="text-slate-600">Cycle: </span>
                <span className="font-medium">{sheetDetail?.cycle?.name}</span>
              </div>
              <div className="text-sm">
                <span className="text-slate-600">Total Weightage: </span>
                <span className="font-medium">
                  {sheetDetail?.totalWeightage}%
                </span>
              </div>
              <div className="text-sm">
                <span className="text-slate-600">Goals: </span>
                <span className="font-medium">{sheetDetail?.goals?.length}</span>
              </div>
            </div>

            {/* Goals List */}
            {sheetDetail?.goals?.map((goal: any, idx: number) => (
              <Card
                key={goal.id}
                className={goal.isShared ? "border-blue-200 bg-blue-50/30" : ""}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-slate-500">
                          #{idx + 1}
                        </span>
                        {goal.isShared && (
                          <Badge
                            variant="outline"
                            className="text-blue-600 border-blue-200 text-xs"
                          >
                            Shared Goal
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {goal.thrustArea?.name}
                        </Badge>
                      </div>

                      <h4 className="font-semibold text-slate-900">
                        {goal.title}
                      </h4>
                      {goal.description && (
                        <p className="text-sm text-slate-600 mt-1">
                          {goal.description}
                        </p>
                      )}

                      <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                        <div>
                          <span className="text-slate-500">UoM:</span>
                          <p className="font-medium">{goal.uomType?.name}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Current Target:</span>
                          <p className="font-medium">
                            {goal.uomType?.code === "timeline" && goal.targetDate
                              ? new Date(goal.targetDate).toLocaleDateString()
                              : goal.targetValue}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-500">Weightage:</span>
                          <p className="font-medium">{goal.weightage}%</p>
                        </div>
                      </div>

                      {/* Inline Editing (only for pending review) */}
                      {sheetDetail?.status === "submitted" && !goal.isShared && (
                        <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <p className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4" />
                            Inline Editing (Optional)
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs text-amber-700">
                                New Target Value
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
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-amber-700">
                                New Weightage (%)
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
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Validation Warning */}
            {sheetDetail?.status === "submitted" &&
              Number(sheetDetail?.totalWeightage) !== 100 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Total weightage is {sheetDetail?.totalWeightage}%. Must equal
                    exactly 100% before approval.
                  </AlertDescription>
                </Alert>
              )}

            {/* Action Buttons */}
            {sheetDetail?.status === "submitted" && (
              <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white pb-2">
                <Button
                  variant="outline"
                  onClick={() => setShowRejectDialog(true)}
                  disabled={reviewSheet.isPending}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Return for Rework
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={
                    reviewSheet.isPending ||
                    Number(sheetDetail?.totalWeightage) !== 100
                  }
                  className="bg-green-600 hover:bg-green-700"
                >
                  {reviewSheet.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Approve & Lock
                </Button>
              </div>
            )}

            {/* Locked/Approved Actions (Unlock/Reset) */}
            {(sheetDetail?.status === "locked" || sheetDetail?.status === "approved") && (
              <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white pb-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm("Reset this sheet to draft? All approval history will be cleared.")) {
                      reviewSheet.mutate({ sheetId: sheetDetail.id, action: "reset" });
                    }
                  }}
                  disabled={reviewSheet.isPending}
                  className="text-amber-600 border-amber-200 hover:bg-amber-50"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset to Draft
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm("Unlock this sheet for further editing?")) {
                      reviewSheet.mutate({ sheetId: sheetDetail.id, action: "unlock" });
                    }
                  }}
                  disabled={reviewSheet.isPending}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Unlock className="w-4 h-4 mr-2" />
                  Unlock for Edits
                </Button>
              </div>
            )}

            {/* View-only for approved/rejected */}
            {sheetDetail?.status !== "submitted" && (
              <div className="flex justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowReviewModal(false)}
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Return for Rework</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Please provide a reason for returning this goal sheet. This will be
              visible to the employee.
            </p>
            <Textarea
              placeholder="e.g., Please reduce weightage on Goal #2 and add more specific targets..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
            {rejectionReason.length > 0 && rejectionReason.length < 10 && (
              <p className="text-sm text-red-500">
                Reason must be at least 10 characters ({rejectionReason.length}
                /10)
              </p>
            )}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={
                  reviewSheet.isPending || rejectionReason.trim().length < 10
                }
              >
                {reviewSheet.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2" />
                )}
                Return for Rework
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