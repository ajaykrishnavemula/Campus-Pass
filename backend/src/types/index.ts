/**
 * @author AjayKrishna
 * @summary Types used in API Logic.
 */
export interface LoginRequestPayload {
  id: string;
  password: string;
}

export interface ResponsePayload {
  user: any;
  data: any;
}

export interface VerificationPayload {
  type: number;
  id: string;
  inApprovedBy?: string;
  outApprovedBy?: string;
}

export interface CreateUserPayload {
  role: number;
  id: string;
  password: string;
  name: string;
  photoUrl?: string;
}

export interface SystemStatusPayload {
  allow: boolean;
  lastUpdated?: Date;
}

export interface WardenStudentsPayload {
  hostel: string;
}

export interface StudentHistoryPayload {
  id: string;
}

export interface DateQueryPayload {
  from: string;
  to: string;
}

export interface OutGoingStudentsPayload {
  hostel?: string;
  date: string;
}

export enum PurposeType {
  saloon = 0,
  groceries = 1,
  medical = 2,
  sports = 3,
  localPilgrimage = 4,
  other = 5,
}

export interface SetStatusType {
  id: string[];
  status: boolean;
}

export interface ErrorMessageType {
  code: string;
  message: string;
}
