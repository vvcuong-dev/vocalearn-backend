import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import * as nodemailer from 'nodemailer';
import { QUEUE_NAME, JOB_NAME } from '../../constants/queue.constant';
import { mailConfig } from '../../configs/mail.config';

@Processor(QUEUE_NAME.MAIL)
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    super();
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: mailConfig.gmailUser,
        pass: mailConfig.gmailAppPassword,
      },
    });
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case JOB_NAME.FORGOT_PASSWORD:
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        await this.handleForgotPassword(job.data);
        break;
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handleForgotPassword(data: {
    toEmail: string;
    userName: string;
    resetLink: string;
  }): Promise<void> {
    const { toEmail, userName, resetLink } = data;

    await this.transporter.sendMail({
      from: `"VocaLearn" <${mailConfig.gmailUser}>`,
      to: toEmail,
      subject: 'Yêu cầu đặt lại mật khẩu',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: auto;">
          <h2>Xin chào ${userName},</h2>
          <p>Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản VocaLearn.</p>
          <p>Nhấn vào nút bên dưới để đặt lại mật khẩu (link có hiệu lực trong 15 phút):</p>
          <a href="${resetLink}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">
            Đặt lại mật khẩu
          </a>
          <p>Nếu bạn không yêu cầu điều này, hãy bỏ qua email này.</p>
        </div>
      `,
    });

    this.logger.log(`Forgot-password email sent to ${toEmail}`);
  }
}
