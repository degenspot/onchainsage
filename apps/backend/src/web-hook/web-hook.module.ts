import { Module } from '@nestjs/common';
import { WebhookService } from './web-hook.service';
import { WebHookController } from './web-hook.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebHook } from './entities/web-hook.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WebHook])],
  controllers: [WebHookController],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {}

// Handlebars helpers setup (add to app bootstrap or main.ts)
import * as handlebars from 'handlebars';
import * as moment from 'moment';

// Register Handlebars helpers
handlebars.registerHelper('abs', function(value) {
  return Math.abs(value);
});

handlebars.registerHelper('formatDate', function(date) {
  return moment(date).format('MMM D, YYYY');
});

handlebars.registerHelper('if', function(conditional, options) {
  if (conditional) {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});

// Add reputationPositive helper to the context
// This should be added in formatDigestForEmail method in DigestService
// context.reputationPositive = context.reputationDelta > 0;