import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan } from 'typeorm';
import { UserDigestPreference, DigestFrequency, DigestDeliveryMethod } from './entities/user-digest-preference.entity';
import { DigestLog, DigestType } from './entities/digest-log.entity';
import { UpdateDigestPreferenceDto } from './dto/update-digest-preference.dto';
import { UserService } from '../user/user.service';
import { SignalService } from '../signal/signal.service';
import { VoteService } from '../vote/vote.service';
import { ReputationService } from '../reputation/reputation.service';
import { TokenService } from '../token/token.service';
import { MailService } from '../mail/mail.service';
import { WebhookService } from '../webhook/webhook.service';
import * as moment from 'moment';

interface DigestContent {
  signals: any[];
  votes: {
    passed: any[];
    failed: any[];
  };
  reputationDelta: number;
  suggestedTokens: any[];
  period: {
    start: Date;
    end: Date;
  };
}

@Injectable()
export class DigestService {
  private readonly logger = new Logger(DigestService.name);

  constructor(
    @InjectRepository(UserDigestPreference)
    private userDigestPreferenceRepository: Repository<UserDigestPreference>,
    @InjectRepository(DigestLog)
    private digestLogRepository: Repository<DigestLog>,
    private userService: UserService,
    private signalService: SignalService,
    private voteService: VoteService,
    private reputationService: ReputationService,
    private tokenService: TokenService,
    private mailService: MailService,
    private webhookService: WebhookService,
  ) {}

  async updateUserPreferences(userId: string, updateDto: UpdateDigestPreferenceDto): Promise<UserDigestPreference> {
    let preference = await this.userDigestPreferenceRepository.findOne({ where: { userId } });

    if (!preference) {
      preference = this.userDigestPreferenceRepository.create({
        userId,
        frequency: updateDto.frequency,
        deliveryMethod: updateDto.deliveryMethod,
        webhookUrl: updateDto.webhookUrl,
      });
    } else {
      preference.frequency = updateDto.frequency;
      preference.deliveryMethod = updateDto.deliveryMethod;
      preference.webhookUrl = updateDto.webhookUrl;
    }

    return this.userDigestPreferenceRepository.save(preference);
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendDailyDigests() {
    this.logger.log('Starting daily digest job');
    
    try {
      const users = await this.userDigestPreferenceRepository.find({
        where: { frequency: DigestFrequency.DAILY },
        relations: ['user'],
      });
      
      this.logger.log(`Found ${users.length} users for daily digest`);
      
      for (const preference of users) {
        await this.processUserDigest(preference, DigestType.DAILY);
      }
      
      this.logger.log('Completed daily digest job');
    } catch (error) {
      this.logger.error(`Error in daily digest job: ${error.message}`, error.stack);
    }
  }

  @Cron(CronExpression.EVERY_WEEK)
  async sendWeeklyDigests() {
    this.logger.log('Starting weekly digest job');
    
    try {
      const users = await this.userDigestPreferenceRepository.find({
        where: { frequency: DigestFrequency.WEEKLY },
        relations: ['user'],
      });
      
      this.logger.log(`Found ${users.length} users for weekly digest`);
      
      for (const preference of users) {
        await this.processUserDigest(preference, DigestType.WEEKLY);
      }
      
      this.logger.log('Completed weekly digest job');
    } catch (error) {
      this.logger.error(`Error in weekly digest job: ${error.message}`, error.stack);
    }
  }

  private async processUserDigest(preference: UserDigestPreference, type: DigestType) {
    try {
      const userId = preference.userId;
      const user = preference.user;
      
      // Check last sent digest to avoid duplicates
      const lastDigest = await this.digestLogRepository.findOne({
        where: { userId, type },
        order: { sentAt: 'DESC' },
      });
      
      // Calculate period start date
      const now = new Date();
      let periodStart: Date;
      
      if (lastDigest) {
        periodStart = lastDigest.sentAt;
      } else {
        // If no previous digest, use default start period
        periodStart = type === DigestType.DAILY 
          ? moment().subtract(1, 'day').toDate()
          : moment().subtract(1, 'week').toDate();
      }
      
      // Skip if the period is too short (e.g., if a digest was just sent)
      const minimumHours = type === DigestType.DAILY ? 20 : 160; // ~6 days for weekly
      const hoursSinceLastDigest = moment().diff(moment(periodStart), 'hours');
      
      if (lastDigest && hoursSinceLastDigest < minimumHours) {
        this.logger.log(`Skipping digest for user ${userId}: last digest was sent ${hoursSinceLastDigest} hours ago`);
        return;
      }
      
      // Generate digest content
      const digestContent = await this.generateDigestContent(userId, type, periodStart, now);
      
      // Skip sending if there's no meaningful content
      if (this.isDigestEmpty(digestContent)) {
        this.logger.log(`Skipping empty digest for user ${userId}`);
        return;
      }
      
      // Send digest based on delivery preference
      let success = true;
      let errorMessage = null;
      
      try {
        if (
          preference.deliveryMethod === DigestDeliveryMethod.EMAIL || 
          preference.deliveryMethod === DigestDeliveryMethod.BOTH
        ) {
          await this.sendEmailDigest(user, digestContent, type);
        }
        
        if (
          preference.deliveryMethod === DigestDeliveryMethod.WEBHOOK || 
          preference.deliveryMethod === DigestDeliveryMethod.BOTH
        ) {
          if (preference.webhookUrl) {
            await this.sendWebhookDigest(preference.webhookUrl, user, digestContent, type);
          } else {
            this.logger.warn(`Webhook URL missing for user ${userId} who requested webhook delivery`);
          }
        }
      } catch (error) {
        success = false;
        errorMessage = error.message;
        this.logger.error(`Failed to send digest to user ${userId}: ${error.message}`, error.stack);
      }
      
      // Log the digest
      await this.digestLogRepository.save({
        userId,
        type,
        sentAt: now,
        content: digestContent,
        success,
        errorMessage,
      });
      
      this.logger.log(`Processed ${type} digest for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error processing digest for user ${preference.userId}: ${error.message}`, error.stack);
    }
  }

  private async generateDigestContent(
    userId: string, 
    type: DigestType, 
    periodStart: Date, 
    periodEnd: Date
  ): Promise<DigestContent> {
    // Get signals generated during the period
    const signals = await this.signalService.findUserSignalsByDateRange(
      userId,
      periodStart,
      periodEnd
    );
    
    // Get votes that passed or failed during the period
    const passedVotes = await this.voteService.findPassedVotesByDateRange(
      userId,
      periodStart,
      periodEnd
    );
    
    const failedVotes = await this.voteService.findFailedVotesByDateRange(
      userId,
      periodStart,
      periodEnd
    );
    
    // Get reputation change
    const reputationDelta = await this.reputationService.getReputationChangeInPeriod(
      userId,
      periodStart,
      periodEnd
    );
    
    // Get suggested tokens
    const suggestedTokens = await this.tokenService.getSuggestedTokensForUser(userId);
    
    return {
      signals,
      votes: {
        passed: passedVotes,
        failed: failedVotes,
      },
      reputationDelta,
      suggestedTokens,
      period: {
        start: periodStart,
        end: periodEnd,
      },
    };
  }

  private isDigestEmpty(content: DigestContent): boolean {
    return (
      content.signals.length === 0 &&
      content.votes.passed.length === 0 &&
      content.votes.failed.length === 0 &&
      content.reputationDelta === 0 &&
      content.suggestedTokens.length === 0
    );
  }

  private async sendEmailDigest(
    user: any,
    content: DigestContent,
    type: DigestType
  ): Promise<void> {
    const subject = `OnChain Sage ${type === DigestType.DAILY ? 'Daily' : 'Weekly'} Digest`;
    
    // Format the digest for email
    const formattedContent = this.formatDigestForEmail(content, type);
    
    await this.mailService.sendDigestEmail(user.email, subject, formattedContent);
  }

  private async sendWebhookDigest(
    webhookUrl: string,
    user: any,
    content: DigestContent,
    type: DigestType
  ): Promise<void> {
    const payload = {
      userId: user.id,
      type,
      timestamp: new Date().toISOString(),
      content,
    };
    
    await this.webhookService.sendWebhookNotification(webhookUrl, payload);
  }

  private formatDigestForEmail(content: DigestContent, type: DigestType): any {
    // Format the digest content for email display
    // This would include HTML formatting, styling, etc.
    // Implementation depends on your email template system
    
    const periodText = type === DigestType.DAILY 
      ? 'past 24 hours' 
      : 'past week';
    
    return {
      periodText,
      userName: 'User', // This should come from the user object in a real implementation
      signalCount: content.signals.length,
      signals: content.signals,
      passedVotesCount: content.votes.passed.length,
      passedVotes: content.votes.passed,
      failedVotesCount: content.votes.failed.length,
      failedVotes: content.votes.failed,
      reputationDelta: content.reputationDelta,
      suggestedTokensCount: content.suggestedTokens.length,
      suggestedTokens: content.suggestedTokens,
      periodStart: content.period.start,
      periodEnd: content.period.end,
    };
  }
}
