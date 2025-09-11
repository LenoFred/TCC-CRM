export interface Event {
  id: string;
  name: string;
  date: string;
  type: string;
  category: string;
  status: "Active" | "Completed" | "Cancelled";
  expectedAttendance: number;
  groupName?: string;
  actualAttendance?: number;
  checkedInMembers?: number[];
  absentMembers?: number[];
  guests?: number[];
}
