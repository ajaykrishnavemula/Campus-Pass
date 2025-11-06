/**
 * @summary Email Service for sending notifications
 */

import nodemailer, { Transporter } from 'nodemailer';
import { OutpassEmailData, EmailOptions } from '../types';
import logger from '../utils/logger';

export class EmailService {
  private static transporter: Transporter;

  /**
   * Initialize email transporter
   */
  static initialize() {
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    logger.info('Email service initialized');
  }

  /**
   * Send email
   */
  static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!this.transporter) {
        this.initialize();
      }

      const mailOptions = {
        from: `Campus-Pass <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${options.to}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send email: ${error}`);
      return false;
    }
  }

  /**
   * Send outpass approval email
   */
  static async sendOutpassApprovalEmail(
    email: string,
    data: OutpassEmailData
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
          .details { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #4CAF50; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          .status { display: inline-block; padding: 5px 15px; border-radius: 20px; background: #4CAF50; color: white; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Outpass Approved!</h1>
          </div>
          <div class="content">
            <p>Dear ${data.studentName},</p>
            <p>Your outpass request has been <span class="status">APPROVED</span></p>
            
            <div class="details">
              <h3>Outpass Details:</h3>
              <p><strong>Outpass Number:</strong> ${data.outpassNumber}</p>
              <p><strong>Reason:</strong> ${data.reason}</p>
              <p><strong>From:</strong> ${data.fromDate}</p>
              <p><strong>To:</strong> ${data.toDate}</p>
              ${data.approvedBy ? `<p><strong>Approved By:</strong> ${data.approvedBy}</p>` : ''}
            </div>
            
            <p><strong>Important Instructions:</strong></p>
            <ul>
              <li>Show this email or your QR code at the security gate</li>
              <li>Return before the specified time</li>
              <li>Contact emergency number if delayed</li>
            </ul>
          </div>
          <div class="footer">
            <p>This is an automated email from Campus-Pass System</p>
            <p>Please do not reply to this email</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `Outpass Approved - ${data.outpassNumber}`,
      html,
    });
  }

  /**
   * Send outpass rejection email
   */
  static async sendOutpassRejectionEmail(
    email: string,
    data: OutpassEmailData
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f44336; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
          .details { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #f44336; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          .status { display: inline-block; padding: 5px 15px; border-radius: 20px; background: #f44336; color: white; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Outpass Request Update</h1>
          </div>
          <div class="content">
            <p>Dear ${data.studentName},</p>
            <p>Your outpass request has been <span class="status">REJECTED</span></p>
            
            <div class="details">
              <h3>Outpass Details:</h3>
              <p><strong>Outpass Number:</strong> ${data.outpassNumber}</p>
              <p><strong>Reason:</strong> ${data.reason}</p>
              <p><strong>From:</strong> ${data.fromDate}</p>
              <p><strong>To:</strong> ${data.toDate}</p>
              ${data.rejectionReason ? `<p><strong>Rejection Reason:</strong> ${data.rejectionReason}</p>` : ''}
            </div>
            
            <p>If you have any questions, please contact your warden.</p>
          </div>
          <div class="footer">
            <p>This is an automated email from Campus-Pass System</p>
            <p>Please do not reply to this email</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `Outpass Request Update - ${data.outpassNumber}`,
      html,
    });
  }

  /**
   * Send outpass created notification
   */
  static async sendOutpassCreatedEmail(
    email: string,
    data: OutpassEmailData
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
          .details { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #2196F3; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          .status { display: inline-block; padding: 5px 15px; border-radius: 20px; background: #FF9800; color: white; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📝 Outpass Request Submitted</h1>
          </div>
          <div class="content">
            <p>Dear ${data.studentName},</p>
            <p>Your outpass request has been submitted and is <span class="status">PENDING</span> approval.</p>
            
            <div class="details">
              <h3>Outpass Details:</h3>
              <p><strong>Outpass Number:</strong> ${data.outpassNumber}</p>
              <p><strong>Reason:</strong> ${data.reason}</p>
              <p><strong>From:</strong> ${data.fromDate}</p>
              <p><strong>To:</strong> ${data.toDate}</p>
            </div>
            
            <p>You will receive an email notification once your request is reviewed.</p>
          </div>
          <div class="footer">
            <p>This is an automated email from Campus-Pass System</p>
            <p>Please do not reply to this email</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `Outpass Request Submitted - ${data.outpassNumber}`,
      html,
    });
  }

  /**
   * Send overdue warning email
   */
  static async sendOverdueWarningEmail(
    email: string,
    studentName: string,
    outpassNumber: string
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #FF5722; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
          .warning { background: #fff3cd; border-left: 4px solid #FF5722; padding: 15px; margin: 10px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Outpass Overdue Warning</h1>
          </div>
          <div class="content">
            <p>Dear ${studentName},</p>
            
            <div class="warning">
              <h3>⚠️ Important Notice</h3>
              <p>Your outpass (${outpassNumber}) has exceeded the approved return time.</p>
              <p><strong>Please return to campus immediately.</strong></p>
            </div>
            
            <p>Failure to return on time may result in:</p>
            <ul>
              <li>Disciplinary action</li>
              <li>Restriction on future outpass requests</li>
              <li>Notification to parents/guardians</li>
            </ul>
            
            <p>If you are facing any emergency, please contact the warden immediately.</p>
          </div>
          <div class="footer">
            <p>This is an automated email from Campus-Pass System</p>
            <p>Please do not reply to this email</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `⚠️ Outpass Overdue - ${outpassNumber}`,
      html,
    });
  }
}


