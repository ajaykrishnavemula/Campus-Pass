/**
 * OutpassCard Component Tests
 * 
 * Tests the OutpassCard component that displays outpass information
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OutpassCard } from '../../components/student/OutpassCard';
import { OutpassStatus } from '../../types';

describe('OutpassCard Component', () => {
  const mockOutpass = {
    _id: '123',
    reason: 'Medical appointment',
    destination: 'City Hospital',
    fromDate: '2024-01-15T10:00:00Z',
    toDate: '2024-01-15T18:00:00Z',
    status: OutpassStatus.PENDING,
    purpose: 'Medical checkup',
    contactNumber: '1234567890',
    createdAt: '2024-01-10T10:00:00Z',
  };

  describe('Rendering', () => {
    it('should render outpass details', () => {
      // ARRANGE & ACT
      render(<OutpassCard outpass={mockOutpass} />);

      // ASSERT
      expect(screen.getByText(/medical appointment/i)).toBeInTheDocument();
      expect(screen.getByText(/city hospital/i)).toBeInTheDocument();
      expect(screen.getByText(/medical checkup/i)).toBeInTheDocument();
    });

    it('should display formatted dates', () => {
      // ARRANGE & ACT
      render(<OutpassCard outpass={mockOutpass} />);

      // ASSERT
      expect(screen.getByText(/jan 15, 2024/i)).toBeInTheDocument();
    });

    it('should show contact number', () => {
      // ARRANGE & ACT
      render(<OutpassCard outpass={mockOutpass} />);

      // ASSERT
      expect(screen.getByText(/1234567890/)).toBeInTheDocument();
    });
  });

  describe('Status Display', () => {
    it('should show pending status with yellow badge', () => {
      // ARRANGE & ACT
      render(<OutpassCard outpass={mockOutpass} />);

      // ASSERT
      const badge = screen.getByText(/pending/i);
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });

    it('should show approved status with green badge', () => {
      // ARRANGE
      const approvedOutpass = {
        ...mockOutpass,
        status: OutpassStatus.APPROVED,
      };

      // ACT
      render(<OutpassCard outpass={approvedOutpass} />);

      // ASSERT
      const badge = screen.getByText(/approved/i);
      expect(badge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('should show rejected status with red badge', () => {
      // ARRANGE
      const rejectedOutpass = {
        ...mockOutpass,
        status: OutpassStatus.REJECTED,
        rejectionReason: 'Insufficient reason',
      };

      // ACT
      render(<OutpassCard outpass={rejectedOutpass} />);

      // ASSERT
      const badge = screen.getByText(/rejected/i);
      expect(badge).toHaveClass('bg-red-100', 'text-red-800');
      expect(screen.getByText(/insufficient reason/i)).toBeInTheDocument();
    });

    it('should show checked out status', () => {
      // ARRANGE
      const checkedOutOutpass = {
        ...mockOutpass,
        status: OutpassStatus.CHECKED_OUT,
        checkOutTime: '2024-01-15T10:30:00Z',
      };

      // ACT
      render(<OutpassCard outpass={checkedOutOutpass} />);

      // ASSERT
      expect(screen.getByText(/checked out/i)).toBeInTheDocument();
    });

    it('should show checked in status', () => {
      // ARRANGE
      const checkedInOutpass = {
        ...mockOutpass,
        status: OutpassStatus.CHECKED_IN,
        checkInTime: '2024-01-15T18:30:00Z',
      };

      // ACT
      render(<OutpassCard outpass={checkedInOutpass} />);

      // ASSERT
      expect(screen.getByText(/checked in/i)).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('should show cancel button for pending outpass', () => {
      // ARRANGE & ACT
      render(<OutpassCard outpass={mockOutpass} />);

      // ASSERT
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should not show cancel button for approved outpass', () => {
      // ARRANGE
      const approvedOutpass = {
        ...mockOutpass,
        status: OutpassStatus.APPROVED,
      };

      // ACT
      render(<OutpassCard outpass={approvedOutpass} />);

      // ASSERT
      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    });

    it('should call onCancel when cancel button is clicked', () => {
      // ARRANGE
      const handleCancel = vi.fn();
      render(<OutpassCard outpass={mockOutpass} onCancel={handleCancel} />);

      // ACT
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      // ASSERT
      expect(handleCancel).toHaveBeenCalledWith(mockOutpass._id);
    });

    it('should show view details button', () => {
      // ARRANGE & ACT
      render(<OutpassCard outpass={mockOutpass} />);

      // ASSERT
      expect(screen.getByRole('button', { name: /view details/i })).toBeInTheDocument();
    });

    it('should call onViewDetails when view button is clicked', () => {
      // ARRANGE
      const handleViewDetails = vi.fn();
      render(<OutpassCard outpass={mockOutpass} onViewDetails={handleViewDetails} />);

      // ACT
      const viewButton = screen.getByRole('button', { name: /view details/i });
      fireEvent.click(viewButton);

      // ASSERT
      expect(handleViewDetails).toHaveBeenCalledWith(mockOutpass._id);
    });
  });

  describe('QR Code', () => {
    it('should show QR code for approved outpass', () => {
      // ARRANGE
      const approvedOutpass = {
        ...mockOutpass,
        status: OutpassStatus.APPROVED,
        qrCode: 'QR123456',
      };

      // ACT
      render(<OutpassCard outpass={approvedOutpass} />);

      // ASSERT
      expect(screen.getByAltText(/qr code/i)).toBeInTheDocument();
    });

    it('should not show QR code for pending outpass', () => {
      // ARRANGE & ACT
      render(<OutpassCard outpass={mockOutpass} />);

      // ASSERT
      expect(screen.queryByAltText(/qr code/i)).not.toBeInTheDocument();
    });

    it('should show download QR button for approved outpass', () => {
      // ARRANGE
      const approvedOutpass = {
        ...mockOutpass,
        status: OutpassStatus.APPROVED,
        qrCode: 'QR123456',
      };

      // ACT
      render(<OutpassCard outpass={approvedOutpass} />);

      // ASSERT
      expect(screen.getByRole('button', { name: /download qr/i })).toBeInTheDocument();
    });
  });

  describe('Warden Information', () => {
    it('should show warden name when approved', () => {
      // ARRANGE
      const approvedOutpass = {
        ...mockOutpass,
        status: OutpassStatus.APPROVED,
        approvedBy: {
          name: 'Dr. Smith',
          employeeId: 'W001',
        },
        approvedAt: '2024-01-12T14:00:00Z',
      };

      // ACT
      render(<OutpassCard outpass={approvedOutpass} />);

      // ASSERT
      expect(screen.getByText(/dr. smith/i)).toBeInTheDocument();
      expect(screen.getByText(/jan 12, 2024/i)).toBeInTheDocument();
    });

    it('should show warden remarks if provided', () => {
      // ARRANGE
      const approvedOutpass = {
        ...mockOutpass,
        status: OutpassStatus.APPROVED,
        remarks: 'Approved for medical reasons',
      };

      // ACT
      render(<OutpassCard outpass={approvedOutpass} />);

      // ASSERT
      expect(screen.getByText(/approved for medical reasons/i)).toBeInTheDocument();
    });
  });

  describe('Overdue Status', () => {
    it('should show overdue warning for late return', () => {
      // ARRANGE
      const overdueOutpass = {
        ...mockOutpass,
        status: OutpassStatus.CHECKED_OUT,
        toDate: '2024-01-10T18:00:00Z', // Past date
        checkOutTime: '2024-01-10T10:00:00Z',
      };

      // ACT
      render(<OutpassCard outpass={overdueOutpass} />);

      // ASSERT
      expect(screen.getByText(/overdue/i)).toBeInTheDocument();
    });

    it('should not show overdue for on-time return', () => {
      // ARRANGE
      const onTimeOutpass = {
        ...mockOutpass,
        status: OutpassStatus.CHECKED_IN,
        checkInTime: '2024-01-15T17:00:00Z',
      };

      // ACT
      render(<OutpassCard outpass={onTimeOutpass} />);

      // ASSERT
      expect(screen.queryByText(/overdue/i)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      // ARRANGE & ACT
      render(<OutpassCard outpass={mockOutpass} />);

      // ASSERT
      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('aria-label', expect.stringContaining('outpass'));
    });

    it('should have accessible status badge', () => {
      // ARRANGE & ACT
      render(<OutpassCard outpass={mockOutpass} />);

      // ASSERT
      const badge = screen.getByText(/pending/i);
      expect(badge).toHaveAttribute('role', 'status');
    });
  });
});

// 
