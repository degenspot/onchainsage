import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { name } from 'ejs';
import { SignalType } from 'src/notification/dto/notification-preference.dto';
import { User } from 'src/users/entities/user.entity';


@Injectable()
export class MailProvider {

  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);


  this.transporter = nodemailer.createTransport({
    host: this.configService.get<string>('MAIL_HOST'),
    port: this.configService.get<number>('MAIL_PORT'),
    secure: this.configService.get<boolean>('MAIL_SECURE'),
    auth: {
      user: this.configService.get<string>('MAIL_USER'),
      pass: this.configService.get<string>('MAIL_PASSWORD'),
    },
    private readonly mailerService:MailerService,
  });
   

    public async WelcomeEmail (user:User):Promise<void> {
        await this.mailerService.sendMail({
         to: user.email,
         from: `helpdesk from onChainSage`,
         subject: `welcome to onChainSage`,
         template: './welcome',
        context: {
            name: user.username,
            email: user.email,
            loginUrl: 'http://localhost:3000/',
        }
        })


    }

    
  async sendNotificationEmail(
    email: string, 
    signalType: SignalType, 
    message: string
  ) {
    await this.mailerService.sendMail({
      to: email,
      subject: `New ${signalType} Signal`,
      text: message
    });
  }

  async sendDigestEmail(to: string, subject: string, context: any): Promise<void> {
    try {
      // Load the appropriate template
      const templatePath = path.resolve(__dirname, '../templates/digest-email.hbs');
      const template = fs.readFileSync(templatePath, 'utf8');
      
      // Compile the template
      const compiledTemplate = handlebars.compile(template);
      const html = compiledTemplate(context);
      
      // Send the email
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