import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class MailProvider {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger('MailProvider');

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'),
      secure: this.configService.get<boolean>('MAIL_SECURE'),
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
    });
  }

  public async sendWelcomeEmail(user: User): Promise<void> {
    await this.transporter.sendMail({
      to: user.email,
      subject: 'Welcome to OnChain Sage',
      text: `Hello ${user.username}, welcome to OnChain Sage!`,
      html: `<p>Hello ${user.username}, welcome to OnChain Sage!</p>`,
    });
  }

  async sendNotificationEmail(email: string, signalType: string, message: string): Promise<void> {
    await this.transporter.sendMail({
      to: email,
      subject: `New ${signalType} Signal`,
      text: message,
      html: `<p>${message}</p>`,
    });
  }

  async sendDigestEmail(to: string, subject: string, context: any): Promise<void> {
    try {
      const templatePath = path.resolve(__dirname, '../templates/digest-email.hbs');
      const template = fs.readFileSync(templatePath, 'utf8');
      const compiledTemplate = handlebars.compile(template);
      const html = compiledTemplate(context);
      await this.transporter.sendMail({
        from: `"OnChain Sage" <${this.configService.get<string>('MAIL_FROM')}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`Digest email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send digest email to ${to}: ${error.message}`, error.stack);
      throw error;
    }
  }
}