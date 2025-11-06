/**
 * QR Code Service
 * Handles QR code generation for outpasses
 */

import QRCode from 'qrcode';
import { type IOutpass } from '../models/Outpass';

export interface QRCodeData {
  outpassId: string;
  outpassNumber: string;
  studentId: string;
  studentName: string;
  fromDate: string;
  toDate: string;
  status: string;
  timestamp: number;
}

export class QRService {
  /**
   * Generate QR code for outpass
   */
  async generateQRCode(outpass: any): Promise<string> {
    const data: QRCodeData = {
      outpassId: outpass._id.toString(),
      outpassNumber: outpass.outpassNumber,
      studentId: typeof outpass.student === 'object' ? outpass.student._id.toString() : outpass.student.toString(),
      studentName: typeof outpass.student === 'object' ? outpass.student.name : '',
      fromDate: outpass.fromDate.toISOString(),
      toDate: outpass.toDate.toISOString(),
      status: outpass.status,
      timestamp: Date.now(),
    };

    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(data), {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
    });

    return qrCodeDataURL;
  }

  /**
   * Generate QR code as buffer (for PDF generation)
   */
  async generateQRCodeBuffer(outpass: any): Promise<Buffer> {
    const data: QRCodeData = {
      outpassId: outpass._id.toString(),
      outpassNumber: outpass.outpassNumber,
      studentId: typeof outpass.student === 'object' ? outpass.student._id.toString() : outpass.student.toString(),
      studentName: typeof outpass.student === 'object' ? outpass.student.name : '',
      fromDate: outpass.fromDate.toISOString(),
      toDate: outpass.toDate.toISOString(),
      status: outpass.status,
      timestamp: Date.now(),
    };

    // Generate QR code as buffer
    const qrCodeBuffer = await QRCode.toBuffer(JSON.stringify(data), {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
    });

    return qrCodeBuffer;
  }

  /**
   * Verify QR code data
   */
  verifyQRCode(qrData: string): QRCodeData {
    try {
      const data = JSON.parse(qrData) as QRCodeData;

      // Validate required fields
      if (
        !data.outpassId ||
        !data.outpassNumber ||
        !data.studentId ||
        !data.fromDate ||
        !data.toDate
      ) {
        throw new Error('Invalid QR code data');
      }

      // Check if QR code is not too old (24 hours)
      const now = Date.now();
      const qrAge = now - data.timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (qrAge > maxAge) {
        throw new Error('QR code has expired');
      }

      return data;
    } catch (error) {
      throw new Error('Invalid QR code');
    }
  }

  /**
   * Generate QR code for multiple outpasses (batch)
   */
  async generateBatchQRCodes(outpasses: any[]): Promise<Map<string, string>> {
    const qrCodes = new Map<string, string>();

    for (const outpass of outpasses) {
      try {
        const qrCode = await this.generateQRCode(outpass);
        qrCodes.set(outpass._id.toString(), qrCode);
      } catch (error) {
        console.error(`Failed to generate QR code for outpass ${outpass._id}:`, error);
      }
    }

    return qrCodes;
  }
}

export const qrService = new QRService();


