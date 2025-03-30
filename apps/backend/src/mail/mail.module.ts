import { Global, Module } from '@nestjs/common';
import { MailProvider } from './providers/mail.provider';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { config } from 'process';
import { from } from 'form-data';
import { Template } from 'ejs';
import { join } from 'path';
import { strict } from 'assert';
import {EjsAdapter} from '@nestjs-modules/mailer/dist/adapters/ejs.adapter'


@Global()
@Module({
    imports: [MailerModule.forRootAsync({
        inject: [ConfigService],
        useFactory:async(config:ConfigService) => ({
            transport: {
                host: config.get('MAIL_HOST'),
                secure: false,
                port: config.get('MAIL_PORT'),
                auth: {
                    user: config.get('SMTP_USERNAME'),
                    pass: config.get('SMTP_PASSWORD'),
                },
                default: {
                    from: `no-reply-<helpdesk@estatte-management>`
                },
                template: {
                    dir: join(__dirname, 'template'),
                    adapter: new EjsAdapter({
                    inlineCssEnabled: true,
                    }),
                    Option : {
                        strict: false,
                    }

                }
            }
        })
    })],
    providers: [MailProvider],
    exports: [MailProvider]
})
export class MailModule {}