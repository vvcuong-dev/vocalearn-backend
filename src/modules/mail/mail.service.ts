import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAME, JOB_NAME } from '../../constants/queue.constant';
import { ForgotPasswordJobData } from './interface/forgot-password.interface';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    @InjectQueue(QUEUE_NAME.MAIL) private readonly mailQueue: Queue,
  ) {}

  async queueForgotPasswordEmail(data: ForgotPasswordJobData): Promise<void> {
    await this.mailQueue.add(JOB_NAME.FORGOT_PASSWORD, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 3000 }, // thử lại sau 3 giây nếu thất bại, với số lần thử tối đa là 3
      removeOnComplete: true,
      removeOnFail: false,
    });
    this.logger.log(`Queued forgot-password email to ${data.toEmail}`);
  }
}
