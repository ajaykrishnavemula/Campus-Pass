import { apiService } from './api';
import type { 
  Outpass, 
  OutpassFormData, 
  OutpassFilters,
  ApiResponse,
  PaginatedResponse,
  StudentStats,
  WardenStats,
  SecurityStats
} from '../types';

class OutpassService {
  // Student Operations
  
  // Create new outpass
  async createOutpass(data: OutpassFormData): Promise<ApiResponse<Outpass>> {
    return await apiService.post<Outpass>('/student/outpass', data);
  }

  // Get student's outpasses
  async getMyOutpasses(filters?: OutpassFilters): Promise<PaginatedResponse<Outpass>> {
    return await apiService.getPaginated<Outpass>('/student/outpass', filters);
  }

  // Get single outpass by ID
  async getOutpassById(id: string): Promise<ApiResponse<Outpass>> {
    return await apiService.get<Outpass>(`/student/outpass/${id}`);
  }

  // Cancel outpass
  async cancelOutpass(id: string): Promise<ApiResponse<Outpass>> {
    return await apiService.patch<Outpass>(`/student/outpass/${id}/cancel`);
  }

  // Get student statistics
  async getStudentStats(): Promise<ApiResponse<StudentStats>> {
    return await apiService.get<StudentStats>('/student/stats');
  }

  // Download outpass PDF
  async downloadOutpassPDF(id: string): Promise<void> {
    await apiService.downloadFile(`/student/outpass/${id}/pdf`, `outpass-${id}.pdf`);
  }

  // Warden Operations
  
  // Get pending outpass requests
  async getPendingRequests(filters?: OutpassFilters): Promise<PaginatedResponse<Outpass>> {
    return await apiService.getPaginated<Outpass>('/warden/outpass/pending', filters);
  }

  // Get all outpasses (for warden)
  async getAllOutpasses(filters?: OutpassFilters): Promise<PaginatedResponse<Outpass>> {
    return await apiService.getPaginated<Outpass>('/warden/outpass', filters);
  }

  // Approve outpass
  async approveOutpass(id: string, remarks?: string): Promise<ApiResponse<Outpass>> {
    return await apiService.patch<Outpass>(`/warden/outpass/${id}/approve`, { remarks });
  }

  // Reject outpass
  async rejectOutpass(id: string, reason: string): Promise<ApiResponse<Outpass>> {
    return await apiService.patch<Outpass>(`/warden/outpass/${id}/reject`, { reason });
  }

  // Get warden statistics
  async getWardenStats(): Promise<ApiResponse<WardenStats>> {
    return await apiService.get<WardenStats>('/warden/stats');
  }

  // Get overdue outpasses
  async getOverdueOutpasses(): Promise<ApiResponse<Outpass[]>> {
    return await apiService.get<Outpass[]>('/warden/outpass/overdue');
  }

  // Security Operations
  
  // Verify outpass by QR code
  async verifyOutpass(qrCode: string): Promise<ApiResponse<Outpass>> {
    return await apiService.post<Outpass>('/security/verify', { qrCode });
  }

  // Alias for verifyOutpass (for clarity in QR scanner)
  async verifyQRCode(qrData: string): Promise<ApiResponse<Outpass>> {
    return this.verifyOutpass(qrData);
  }

  // Check out student
  async checkOut(outpassId: string): Promise<ApiResponse<Outpass>> {
    return await apiService.post<Outpass>(`/security/checkout/${outpassId}`);
  }

  // Check in student
  async checkIn(outpassId: string): Promise<ApiResponse<Outpass>> {
    return await apiService.post<Outpass>(`/security/checkin/${outpassId}`);
  }

  // Get active outpasses
  async getActiveOutpasses(): Promise<ApiResponse<Outpass[]>> {
    return await apiService.get<Outpass[]>('/security/active');
  }

  // Get security statistics
  async getSecurityStats(): Promise<ApiResponse<SecurityStats>> {
    return await apiService.get<SecurityStats>('/security/stats');
  }

  // Get overdue outpasses (security view)
  async getSecurityOverdueOutpasses(): Promise<ApiResponse<Outpass[]>> {
    return await apiService.get<Outpass[]>('/security/overdue');
  }

  // Get recent activity (check-ins/check-outs)
  async getRecentActivity(filters?: OutpassFilters): Promise<PaginatedResponse<Outpass>> {
    return await apiService.getPaginated<Outpass>('/security/activity', filters);
  }

  // Get check-in/check-out history
  async getCheckInOutHistory(filters?: OutpassFilters): Promise<PaginatedResponse<Outpass>> {
    return await apiService.getPaginated<Outpass>('/security/history', filters);
  }

  // Common Operations
  
  // Search outpasses
  async searchOutpasses(query: string): Promise<ApiResponse<Outpass[]>> {
    return await apiService.get<Outpass[]>('/outpass/search', { q: query });
  }

  // Get outpass by number
  async getOutpassByNumber(outpassNumber: string): Promise<ApiResponse<Outpass>> {
    return await apiService.get<Outpass>(`/outpass/number/${outpassNumber}`);
  }
}

export const outpassService = new OutpassService();

