// utils/emailService.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  // Generate 6-digit OTP
  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send email using Resend
  private static async sendEmail(to: string, template: EmailTemplate) {
    try {
      if (!process.env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY is not configured');
      }

      // In development, send to the registered email address
      const recipient = process.env.NODE_ENV === 'development' && process.env.DEV_EMAIL_RECIPIENT 
        ? process.env.DEV_EMAIL_RECIPIENT 
        : to;

      const { data, error } = await resend.emails.send({
        from: process.env.FROM_EMAIL || 'SafeTails <onboarding@resend.dev>',
        to: [recipient],
        subject: `${process.env.NODE_ENV === 'development' ? '[DEV] ' : ''}${template.subject}`,
        html: template.html,
      });

      if (error) {
        console.error('Resend error:', error);
        throw new Error(`Email sending failed: ${error.message}`);
      }

      console.log('Email sent successfully:', data?.id);
      return { success: true, messageId: data?.id };
    } catch (error) {
      console.error('EmailService error:', error);
      throw error;
    }
  }

  // Send OTP email for email verification
  static async sendOTPEmail(email: string, otp: string, name: string) {
    const template: EmailTemplate = {
      subject: '🐾 SafeTails - Verify Your Email Address',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your SafeTails Account</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🐾 SafeTails</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Pet Care Community</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #333; margin-top: 0;">Welcome to SafeTails, ${name}! 🎉</h2>
            
            <p>Thank you for joining our pet care community. To complete your registration and secure your account, please verify your email address using the OTP below:</p>
            
            <div style="background: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
              <p style="margin: 0; color: #666; font-size: 14px;">Your verification code is:</p>
              <h1 style="color: #667eea; font-size: 36px; margin: 10px 0; letter-spacing: 8px; font-weight: bold;">${otp}</h1>
              <p style="margin: 0; color: #666; font-size: 12px;">This code will expire in 10 minutes</p>
            </div>
            
            <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #1976d2;"><strong>Security Note:</strong> Never share this code with anyone. SafeTails will never ask for your OTP via phone or other channels.</p>
            </div>
            
            <p>If you didn't create an account with SafeTails, please ignore this email or contact our support team.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <div style="text-align: center; color: #666; font-size: 14px;">
              <p>Best regards,<br>The SafeTails Team</p>
              <p style="font-size: 12px; margin-top: 20px;">
                This is an automated message. Please do not reply to this email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Welcome to SafeTails, ${name}! Your email verification code is: ${otp}. This code will expire in 10 minutes. Never share this code with anyone.`
    };

    return await this.sendEmail(email, template);
  }

  // Send welcome email after successful registration
  static async sendWelcomeEmail(email: string, name: string) {
    const template: EmailTemplate = {
      subject: '🎉 Welcome to SafeTails - Your Pet Care Journey Begins!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to SafeTails</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🐾 SafeTails</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Pet Care Community</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #333; margin-top: 0;">Welcome aboard, ${name}! 🎉</h2>
            
            <p>Congratulations! Your SafeTails account has been successfully created and verified. You're now part of our amazing pet care community!</p>
            
            <div style="background: #f0f8ff; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <h3 style="color: #667eea; margin-top: 0;">🚀 What's Next?</h3>
              <ul style="color: #555; padding-left: 20px;">
                <li>Complete your profile to connect with other pet owners</li>
                <li>Share posts about your furry friends</li>
                <li>Find veterinarians in your area</li>
                <li>Get advice from our community of pet lovers</li>
                <li>Discover pet-friendly places nearby</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">Start Exploring 🐕</a>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #856404; border-radius: 4px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;"><strong>💡 Pro Tip:</strong> Add a profile picture and fill out your bio to get more engagement from the community!</p>
            </div>
            
            <p>If you have any questions or need assistance, don't hesitate to reach out to our support team.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <div style="text-align: center; color: #666; font-size: 14px;">
              <p>Happy tails! 🐾<br>The SafeTails Team</p>
              <p style="font-size: 12px; margin-top: 20px;">
                This is an automated message. Please do not reply to this email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Welcome to SafeTails, ${name}! Your account has been successfully created. Start exploring our pet care community at ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`
    };

    return await this.sendEmail(email, template);
  }

  // Send password reset email
  static async sendPasswordResetEmail(email: string, name: string, resetToken: string) {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const template: EmailTemplate = {
      subject: '🔐 SafeTails - Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your SafeTails Password</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🐾 SafeTails</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Pet Care Community</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
            
            <p>Hello ${name},</p>
            <p>We received a request to reset your SafeTails account password. Click the button below to create a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">Reset Password 🔐</a>
            </div>
            
            <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #721c24;"><strong>⚠️ Security Notice:</strong> This link will expire in 1 hour. If you didn't request this reset, please ignore this email and contact support if you're concerned.</p>
            </div>
            
            <p style="font-size: 14px; color: #666;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px; font-size: 12px;">${resetUrl}</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <div style="text-align: center; color: #666; font-size: 14px;">
              <p>Stay safe! 🐾<br>The SafeTails Team</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Hello ${name}, we received a request to reset your SafeTails password. Click this link to reset: ${resetUrl}. This link expires in 1 hour.`
    };

    return await this.sendEmail(email, template);
  }

  // Send general notification email
  static async sendNotificationEmail(email: string, name: string, subject: string, message: string) {
    const template: EmailTemplate = {
      subject: `🐾 SafeTails - ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🐾 SafeTails</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Pet Care Community</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #333; margin-top: 0;">${subject}</h2>
            
            <p>Hello ${name},</p>
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
              ${message}
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <div style="text-align: center; color: #666; font-size: 14px;">
              <p>Best regards,<br>The SafeTails Team</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Hello ${name}, ${subject}: ${message}`
    };

    return await this.sendEmail(email, template);
  }
}
