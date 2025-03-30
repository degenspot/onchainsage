import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { name } from 'ejs';
import { SignalType } from 'src/notification/dto/notification-preference.dto';
import { User } from 'src/users/entities/user.entity';


@Injectable()
export class MailProvider {
    constructor (
        //inject the mailer Service
        private readonly mailerService:MailerService,
    ) {}


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



}