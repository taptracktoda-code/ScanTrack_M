export const issueTypeLabels = {
  vehicle_breakdown: 'Vehicle breakdown',
  leave_queue: 'Request to leave queue',
  other: 'Others',
} as const;
export type IssueType = keyof typeof issueTypeLabels;

export type DriverIssue = {
  id: number; queue_entry_id: number | null; driver_name: string;
  type: IssueType; explanation: string;
  attachments?: { name: string; size: number; url: string }[];
  status: 'pending' | 'approved' | 'rejected'; created_at: string;
  decision_reason: string | null; decided_at: string | null; manager_name: string | null;
  queue_status: string | null; can_approve: boolean;
};
export type IssuePage = { data: DriverIssue[]; current_page: number; last_page: number; pending_count: number };
