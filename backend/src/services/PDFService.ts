/**
 * PDF Service
 * Generates PDF documents for outpasses with QR codes
 */

import PDFDocument from 'pdfkit';
import { type IOutpass } from '../models/Outpass';
import { type IUser } from '../models/User';
import { QRService } from './QRService';

export class PDFService {
  private qrService: QRService;

  constructor() {
    this.qrService = new QRService();
  }

  /**
   * Generate outpass PDF
   */
  async generateOutpassPDF(
    outpass: any,
    student: IUser
  ): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc
          .fontSize(24)
          .font('Helvetica-Bold')
          .fillColor('#1f2937')
          .text('Campus-Pass', { align: 'center' });

        doc
          .fontSize(12)
          .font('Helvetica')
          .fillColor('#6b7280')
          .text('Smart Campus Access Management', { align: 'center' });

        doc.moveDown(1);

        // Outpass Number (Prominent)
        doc
          .fontSize(16)
          .font('Helvetica-Bold')
          .fillColor('#3b82f6')
          .text(`Outpass No: ${outpass.outpassNumber}`, { align: 'center' });

        doc.moveDown(1);

        // Status Badge
        const statusColor = this.getStatusColor(outpass.status);
        const statusText = this.getStatusText(outpass.status);
        
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .fillColor(statusColor)
          .text(`Status: ${statusText}`, { align: 'center' });

        doc.moveDown(1.5);

        // Student Information Section
        this.addSection(doc, 'Student Information');
        
        const studentInfo = [
          ['Name', student.name],
          ['Email', student.email],
          ['Phone', student.phone || 'N/A'],
          ['Hostel', student.hostel || 'N/A'],
          ['Room Number', student.roomNumber || 'N/A'],
        ];

        this.addTable(doc, studentInfo);
        doc.moveDown(1);

        // Outpass Details Section
        this.addSection(doc, 'Outpass Details');

        const outpassInfo = [
          ['Type', this.capitalizeFirst(outpass.type)],
          ['Destination', outpass.destination],
          ['Purpose', outpass.purpose],
          ['From Date', new Date(outpass.fromDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })],
          ['To Date', new Date(outpass.toDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })],
        ];

        this.addTable(doc, outpassInfo);
        doc.moveDown(1);

        // Approval Information (if approved)
        if (outpass.status === 'approved' || outpass.status === 'checked_out' || outpass.status === 'checked_in') {
          this.addSection(doc, 'Approval Information');

          const approvalInfo = [
            ['Approved By', outpass.approvedBy?.name || 'N/A'],
            ['Approved At', outpass.approvedAt ? new Date(outpass.approvedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'N/A'],
          ];

          if (outpass.wardenRemarks) {
            approvalInfo.push(['Remarks', outpass.wardenRemarks]);
          }

          this.addTable(doc, approvalInfo);
          doc.moveDown(1);
        }

        // Check-out/Check-in Information (if applicable)
        if (outpass.status === 'checked_out' || outpass.status === 'checked_in') {
          this.addSection(doc, 'Security Check Information');

          const checkInfo = [];

          if (outpass.checkedOutAt) {
            checkInfo.push(['Checked Out At', new Date(outpass.checkedOutAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })]);
            checkInfo.push(['Checked Out By', outpass.checkedOutBy?.name || 'N/A']);
          }

          if (outpass.checkedInAt) {
            checkInfo.push(['Checked In At', new Date(outpass.checkedInAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })]);
            checkInfo.push(['Checked In By', outpass.checkedInBy?.name || 'N/A']);
          }

          this.addTable(doc, checkInfo);
          doc.moveDown(1);
        }

        // QR Code Section
        if (outpass.qrCode) {
          doc.moveDown(1);
          this.addSection(doc, 'QR Code for Verification');

          // Generate QR code as buffer
          const qrBuffer = await this.qrService.generateQRCodeBuffer(outpass.qrCode);

          // Center the QR code
          const qrSize = 150;
          const pageWidth = doc.page.width;
          const qrX = (pageWidth - qrSize) / 2;

          doc.image(qrBuffer, qrX, doc.y, {
            width: qrSize,
            height: qrSize,
          });

          doc.moveDown(8);

          doc
            .fontSize(10)
            .font('Helvetica')
            .fillColor('#6b7280')
            .text('Scan this QR code at security checkpoints', { align: 'center' });
        }

        // Footer
        doc.moveDown(2);
        
        const footerY = doc.page.height - 100;
        doc.y = footerY;

        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor('#6b7280')
          .text('Important Instructions:', { align: 'left' });

        doc
          .fontSize(9)
          .text('• This outpass must be shown to security personnel when leaving and entering campus', { align: 'left' });
        doc
          .text('• Return to campus before the specified return date and time', { align: 'left' });
        doc
          .text('• Late returns may result in disciplinary action', { align: 'left' });
        doc
          .text('• This is a computer-generated document and does not require a signature', { align: 'left' });

        doc.moveDown(1);

        doc
          .fontSize(8)
          .fillColor('#9ca3af')
          .text(`Generated on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`, { align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Add section header
   */
  private addSection(doc: PDFKit.PDFDocument, title: string): void {
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#1f2937')
      .text(title);

    doc.moveDown(0.5);

    // Add underline
    const lineY = doc.y;
    doc
      .strokeColor('#e5e7eb')
      .lineWidth(1)
      .moveTo(50, lineY)
      .lineTo(doc.page.width - 50, lineY)
      .stroke();

    doc.moveDown(0.5);
  }

  /**
   * Add table with key-value pairs
   */
  private addTable(doc: PDFKit.PDFDocument, data: string[][]): void {
    const startX = 50;
    const labelWidth = 150;
    const valueWidth = doc.page.width - 100 - labelWidth;

    doc.fontSize(11).font('Helvetica');

    data.forEach(([label, value]) => {
      const startY = doc.y;

      // Label
      doc
        .fillColor('#6b7280')
        .font('Helvetica-Bold')
        .text(label + ':', startX, startY, {
          width: labelWidth,
          continued: false,
        });

      // Value
      doc
        .fillColor('#1f2937')
        .font('Helvetica')
        .text(value, startX + labelWidth, startY, {
          width: valueWidth,
          continued: false,
        });

      doc.moveDown(0.5);
    });
  }

  /**
   * Get status color
   */
  private getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      pending: '#f59e0b',
      approved: '#10b981',
      rejected: '#ef4444',
      checked_out: '#3b82f6',
      checked_in: '#6b7280',
      cancelled: '#9ca3af',
      overdue: '#dc2626',
    };
    return colors[status] || '#6b7280';
  }

  /**
   * Get status text
   */
  private getStatusText(status: string): string {
    const texts: Record<string, string> = {
      pending: 'Pending Approval',
      approved: 'Approved',
      rejected: 'Rejected',
      checked_out: 'Checked Out',
      checked_in: 'Checked In',
      cancelled: 'Cancelled',
      overdue: 'Overdue',
    };
    return texts[status] || status;
  }

  /**
   * Capitalize first letter
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Generate batch PDFs
   */
  async generateBatchPDFs(
    outpasses: any[],
    students: Map<string, IUser>
  ): Promise<Map<string, Buffer>> {
    const pdfMap = new Map<string, Buffer>();

    for (const outpass of outpasses) {
      const student = students.get(outpass.student.toString());
      if (student) {
        const pdf = await this.generateOutpassPDF(outpass, student);
        pdfMap.set(outpass._id.toString(), pdf);
      }
    }

    return pdfMap;
  }
}

export const pdfService = new PDFService();


