/**
 * Email Service
 * Handles email notifications for outpass events
 */

import nodemailer, { Transporter } from 'nodemailer';
import { type IOutpass } from '../models/Outpass';
import { type IUser } from '../models/User';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

export class EmailService {
  private transporter: Transporter | null = null;
  private fromEmail: string = '';

  /**
   * Initialize email service
   */
  initialize(config: EmailConfig): void {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    });

    this.fromEmail = config.from;
  }

  /**
   * Check if email service is configured
   */
  isConfigured(): boolean {
    return this.transporter !== null;
  }

  /**
   * Send email
   */
  private async sendEmail(
    to: string,
    subject: string,
    html: string
  ): Promise<void> {
    if (!this.transporter) {
      console.warn('Email service not configured. Skipping email send.');
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromEmail,
        to,
        subject,
        html,
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Send outpass approved email
   */
  async sendOutpassApprovedEmail(
    student: IUser,
    outpass: any,
    wardenName: string
  ): Promise<void> {
    const subject = `Outpass Approved - ${outpass.outpassNumber}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .label { font-weight: bold; color: #6b7280; }
          .value { color: #111827; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Outpass Approved</h1>
          </div>
          <div class="content">
            <p>Dear ${student.name},</p>
            <p>Your outpass request has been <strong>approved</strong> by ${wardenName}.</p>
            
            <div class="details">
              <h3>Outpass Details</h3>
              <div class="detail-row">
                <span class="label">Outpass Number:</span>
                <span class="value">${outpass.outpassNumber}</span>
              </div>
              <div class="detail-row">
                <span class="label">Type:</span>
                <span class="value">${outpass.type}</span>
              </div>
              <div class="detail-row">
                <span class="label">Destination:</span>
                <span class="value">${outpass.destination}</span>
              </div>
              <div class="detail-row">
                <span class="label">From:</span>
                <span class="value">${new Date(outpass.fromDate).toLocaleString()}</span>
              </div>
              <div class="detail-row">
                <span class="label">To:</span>
                <span class="value">${new Date(outpass.toDate).toLocaleString()}</span>
              </div>
              ${outpass.wardenRemarks ? `
              <div class="detail-row">
                <span class="label">Remarks:</span>
                <span class="value">${outpass.wardenRemarks}</span>
              </div>
              ` : ''}
            </div>

            <p><strong>Important:</strong> Please show this outpass to security personnel when leaving and returning to campus.</p>
            
            <p>Stay safe and return on time!</p>
          </div>
          <div class="footer">
            <p>Campus-Pass - Smart Campus Access Management</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail(student.email, subject, html);
  }

  /**
   * Send outpass rejected email
   */
  async sendOutpassRejectedEmail(
    student: IUser,
    outpass: any,
    wardenName: string,
    reason: string
  ): Promise<void> {
    const subject = `Outpass Rejected - ${outpass.outpassNumber}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .reason-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Outpass Rejected</h1>
          </div>
          <div class="content">
            <p>Dear ${student.name},</p>
            <p>Your outpass request has been <strong>rejected</strong> by ${wardenName}.</p>
            
            <div class="details">
              <h3>Outpass Details</h3>
              <p><strong>Outpass Number:</strong> ${outpass.outpassNumber}</p>
              <p><strong>Destination:</strong> ${outpass.destination}</p>
              <p><strong>Requested Period:</strong> ${new Date(outpass.fromDate).toLocaleString()} - ${new Date(outpass.toDate).toLocaleString()}</p>
            </div>

            <div class="reason-box">
              <h4>Rejection Reason:</h4>
              <p>${reason}</p>
            </div>

            <p>If you have any questions, please contact your warden.</p>
          </div>
          <div class="footer">
            <p>Campus-Pass - Smart Campus Access Management</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail(student.email, subject, html);
  }

  /**
   * Send outpass overdue email
   */
  async sendOutpassOverdueEmail(
    student: IUser,
    outpass: any
  ): Promise<void> {
    const subject = `⚠️ Outpass Overdue - ${outpass.outpassNumber}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .warning-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Outpass Overdue</h1>
          </div>
          <div class="content">
            <p>Dear ${student.name},</p>
            
            <div class="warning-box">
              <h3>Your outpass is overdue!</h3>
              <p><strong>Outpass Number:</strong> ${outpass.outpassNumber}</p>
              <p><strong>Expected Return:</strong> ${new Date(outpass.toDate).toLocaleString()}</p>
              <p><strong>Status:</strong> Overdue</p>
            </div>

            <p><strong>Action Required:</strong> Please return to campus immediately and check in with security.</p>
            
            <p><strong>Note:</strong> Late returns may result in disciplinary action and affect future outpass approvals.</p>
          </div>
          <div class="footer">
            <p>Campus-Pass - Smart Campus Access Management</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail(student.email, subject, html);
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(user: IUser): Promise<void> {
    const subject = 'Welcome to Campus-Pass';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Campus-Pass! 🎉</h1>
          </div>
          <div class="content">
            <p>Dear ${user.name},</p>
            <p>Your account has been successfully created!</p>
            
            <p><strong>Account Details:</strong></p>
            <ul>
              <li>Email: ${user.email}</li>
              <li>Role: ${this.getRoleName(user.role)}</li>
              ${user.hostel ? `<li>Hostel: ${user.hostel}</li>` : ''}
            </ul>

            <p>You can now log in to the Campus-Pass system and start managing your outpasses.</p>
            
            <p>If you have any questions, please contact your hostel warden.</p>
          </div>
          <div class="footer">
            <p>Campus-Pass - Smart Campus Access Management</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail(user.email, subject, html);
  }

  /**
   * Send password changed email
   */
  async sendPasswordChangedEmail(user: IUser): Promise<void> {
    const subject = 'Password Changed Successfully';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .warning-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Password Changed</h1>
          </div>
          <div class="content">
            <p>Dear ${user.name},</p>
            <p>Your password has been successfully changed.</p>
            
            <div class="warning-box">
              <p><strong>Security Notice:</strong> If you did not make this change, please contact your administrator immediately.</p>
            </div>

            <p>Changed at: ${new Date().toLocaleString()}</p>
          </div>
          <div class="footer">
            <p>Campus-Pass - Smart Campus Access Management</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail(user.email, subject, html);
  }

  /**
   * Get role name
   */
  private getRoleName(role: number): string {
    const roles: Record<number, string> = {
      0: 'Student',
      1: 'Admin',
      2: 'Warden',
      3: 'Security',
    };
    return roles[role] || 'Unknown';
  }

  /**
   * Send test email
   */
  async sendTestEmail(to: string): Promise<void> {
    const subject = 'Campus-Pass - Test Email';
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <h1>Test Email</h1>
        <p>This is a test email from Campus-Pass.</p>
        <p>If you received this, email service is working correctly!</p>
      </body>
      </html>
    `;

    await this.sendEmail(to, subject, html);
  }
}

export const emailService = new EmailService();


