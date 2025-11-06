/**
 * @summary QR Code Generation Service
 */

import QRCode from 'qrcode';
import crypto from 'crypto';
import config from '../config';

export class QRCodeService {
  /**
   * Generate QR code for outpass
   */
  static async generateQRCode(outpassId: string, studentId: string): Promise<string> {
    try {
      // Create QR data with signature for security
      const timestamp = Date.now();
      const signature = this.generateSignature(outpassId, studentId, timestamp);
      
      const qrData = {
        outpassId,
        studentId,
        timestamp,
        signature,
      };

      // Generate QR code as data URL
      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 300,
        margin: 1,
      });

      return qrCodeDataURL;
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${error}`);
    }
  }

  /**
   * Verify QR code data
   */
  static verifyQRCode(qrData: string): { valid: boolean; data?: any; error?: string } {
    try {
      const parsed = JSON.parse(qrData);
      const { outpassId, studentId, timestamp, signature } = parsed;

      // Verify signature
      const expectedSignature = this.generateSignature(outpassId, studentId, timestamp);
      
      if (signature !== expectedSignature) {
        return { valid: false, error: 'Invalid QR code signature' };
      }

      // Check if QR code is not too old (24 hours)
      const age = Date.now() - timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (age > maxAge) {
        return { valid: false, error: 'QR code has expired' };
      }

      return { valid: true, data: parsed };
    } catch (error) {
      return { valid: false, error: 'Invalid QR code format' };
    }
  }

  /**
   * Generate signature for QR code
   */
  private static generateSignature(outpassId: string, studentId: string, timestamp: number): string {
    const data = `${outpassId}:${studentId}:${timestamp}`;
    return crypto
      .createHmac('sha256', config.jwt.secret)
      .update(data)
      .digest('hex');
  }

  /**
   * Generate QR code as buffer (for PDF generation)
   */
  static async generateQRCodeBuffer(outpassId: string, studentId: string): Promise<Buffer> {
    try {
      const timestamp = Date.now();
      const signature = this.generateSignature(outpassId, studentId, timestamp);
      
      const qrData = {
        outpassId,
        studentId,
        timestamp,
        signature,
      };

      const buffer = await QRCode.toBuffer(JSON.stringify(qrData), {
        errorCorrectionLevel: 'H',
        type: 'png',
        width: 300,
      });

      return buffer;
    } catch (error) {
      throw new Error(`Failed to generate QR code buffer: ${error}`);
    }
  }
}


