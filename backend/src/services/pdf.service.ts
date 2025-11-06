/**
 * @summary PDF Generation Service for Outpass
 */

import PDFDocument from 'pdfkit';
import { IOutpass, IStudent } from '../types';
import { QRCodeService } from './qrcode.service';

export class PDFService {
  /**
   * Generate outpass PDF
   */
  static async generateOutpassPDF(
    outpass: IOutpass,
    student: IStudent
  ): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        // Header
        doc
          .fontSize(24)
          .font('Helvetica-Bold')
          .text('CAMPUS OUTPASS', { align: 'center' })
          .moveDown(0.5);

        doc
          .fontSize(12)
          .font('Helvetica')
          .text('Campus Management System', { align: 'center' })
          .moveDown(1);

        // Outpass Number
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .text(`Outpass No: ${outpass.outpassNumber}`, { align: 'center' })
          .moveDown(1);

        // Student Details Section
        doc
          .fontSize(16)
          .font('Helvetica-Bold')
          .text('Student Details', { underline: true })
          .moveDown(0.5);

        doc.fontSize(12).font('Helvetica');
        
        const studentDetails = [
          ['Name:', student.name],
          ['Roll Number:', student.rollNumber],
          ['Department:', student.department],
          ['Year:', student.year.toString()],
          ['Hostel:', student.hostel],
          ['Room Number:', student.roomNumber],
          ['Contact:', student.phone],
        ];

        studentDetails.forEach(([label, value]) => {
          doc.text(`${label} ${value}`, { continued: false });
        });

        doc.moveDown(1);

        // Outpass Details Section
        doc
          .fontSize(16)
          .font('Helvetica-Bold')
          .text('Outpass Details', { underline: true })
          .moveDown(0.5);

        doc.fontSize(12).font('Helvetica');

        const outpassDetails = [
          ['Reason:', outpass.reason],
          ['Destination:', outpass.destination],
          ['From Date:', new Date(outpass.fromDate).toLocaleString()],
          ['To Date:', new Date(outpass.toDate).toLocaleString()],
          ['Status:', outpass.status.toUpperCase()],
        ];

        if (outpass.approvedBy) {
          outpassDetails.push(['Approved By:', 'Warden']);
        }

        if (outpass.approvedAt) {
          outpassDetails.push([
            'Approved At:',
            new Date(outpass.approvedAt).toLocaleString(),
          ]);
        }

        outpassDetails.forEach(([label, value]) => {
          doc.text(`${label} ${value}`, { continued: false });
        });

        doc.moveDown(1);

        // QR Code Section
        if (outpass.qrCode) {
          doc
            .fontSize(16)
            .font('Helvetica-Bold')
            .text('QR Code', { underline: true })
            .moveDown(0.5);

          // Generate QR code buffer
          const qrBuffer = await QRCodeService.generateQRCodeBuffer(
            outpass._id?.toString() || '',
            student.id
          );

          // Add QR code image
          doc.image(qrBuffer, {
            fit: [200, 200],
            align: 'center',
          });

          doc.moveDown(0.5);
          doc
            .fontSize(10)
            .font('Helvetica')
            .text('Scan this QR code at the security gate', { align: 'center' });
        }

        doc.moveDown(2);

        // Instructions
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('Important Instructions:', { underline: true })
          .moveDown(0.5);

        doc.fontSize(10).font('Helvetica');

        const instructions = [
          '1. This outpass is valid only for the specified date and time.',
          '2. Show this outpass at the security gate while leaving and entering.',
          '3. Return to campus before the specified time.',
          '4. In case of emergency or delay, contact the warden immediately.',
          '5. Violation of outpass rules may result in disciplinary action.',
        ];

        instructions.forEach((instruction) => {
          doc.text(instruction);
        });

        doc.moveDown(2);

        // Footer
        doc
          .fontSize(8)
          .font('Helvetica')
          .text('This is a computer-generated document and does not require a signature.', {
            align: 'center',
          });

        doc
          .text(`Generated on: ${new Date().toLocaleString()}`, {
            align: 'center',
          });

        // Finalize PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate outpass report PDF (for wardens)
   */
  static async generateOutpassReport(
    outpasses: IOutpass[],
    hostel: string,
    dateRange: { from: Date; to: Date }
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        // Header
        doc
          .fontSize(20)
          .font('Helvetica-Bold')
          .text('OUTPASS REPORT', { align: 'center' })
          .moveDown(0.5);

        doc
          .fontSize(12)
          .font('Helvetica')
          .text(`Hostel: ${hostel}`, { align: 'center' })
          .text(
            `Period: ${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`,
            { align: 'center' }
          )
          .moveDown(1);

        // Summary
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('Summary', { underline: true })
          .moveDown(0.5);

        doc.fontSize(11).font('Helvetica');

        const total = outpasses.length;
        const approved = outpasses.filter((o) => o.status === 'approved').length;
        const rejected = outpasses.filter((o) => o.status === 'rejected').length;
        const pending = outpasses.filter((o) => o.status === 'pending').length;

        doc.text(`Total Outpasses: ${total}`);
        doc.text(`Approved: ${approved}`);
        doc.text(`Rejected: ${rejected}`);
        doc.text(`Pending: ${pending}`);
        doc.moveDown(1);

        // Outpass List
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('Outpass Details', { underline: true })
          .moveDown(0.5);

        doc.fontSize(9).font('Helvetica');

        outpasses.forEach((outpass, index) => {
          const student = outpass.student as IStudent;
          
          doc.text(`${index + 1}. ${outpass.outpassNumber}`);
          doc.text(`   Student: ${student.name} (${student.rollNumber})`);
          doc.text(`   Reason: ${outpass.reason}`);
          doc.text(`   Date: ${new Date(outpass.fromDate).toLocaleDateString()}`);
          doc.text(`   Status: ${outpass.status.toUpperCase()}`);
          doc.moveDown(0.5);

          // Add page break if needed
          if (doc.y > 700) {
            doc.addPage();
          }
        });

        // Footer
        doc
          .fontSize(8)
          .font('Helvetica')
          .text(`Generated on: ${new Date().toLocaleString()}`, {
            align: 'center',
          });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}


