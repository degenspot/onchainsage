import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import type { StarknetService } from '../starknet/starknet.service';
import type { ConfigService } from '@nestjs/config';
import type { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import type {
  WebhookConfigDto,
  BatchPaymentDto,
  RefundDto,
  SchedulePaymentDto,
  PaymentLimitDto,
  PaymentHistoryQueryDto,
  PaymentAnalyticsQueryDto,
} from './dto/payment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Between, LessThanOrEqual } from 'typeorm';
import { WebhookConfig } from './entities/webhook-config.entity';
import { ScheduledPayment } from './entities/scheduled-payment.entity';
import { PaymentLimit } from './entities/payment-limit.entity';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { v4 as uuidv4 } from 'uuid';
import { Cron } from '@nestjs/schedule';
import * as crypto from 'crypto';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly explorerBaseUrl: string;

  constructor(
    private readonly starknetService: StarknetService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    @InjectRepository(WebhookConfig)
    private webhookConfigRepository: Repository<WebhookConfig>,
    @InjectRepository(ScheduledPayment)
    private scheduledPaymentRepository: Repository<ScheduledPayment>,
    @InjectRepository(PaymentLimit)
    private paymentLimitRepository: Repository<PaymentLimit>,
    @InjectRepository(PaymentTransaction)
    private paymentTransactionRepository: Repository<PaymentTransaction>,
  ) {
    // Get explorer URL from config (default to Starkscan testnet)
    this.explorerBaseUrl = this.configService.get<string>(
      'STARKNET_EXPLORER_URL',
      'https://testnet.starkscan.co/tx/',
    );
  }

  /**
   * Process a deposit transaction
   * @param walletAddress User's wallet address
   * @param amount Amount to deposit
   * @returns Transaction details
   */
  async deposit(walletAddress: string, amount: number) {
    try {
      this.logger.log(`Processing deposit of ${amount} for ${walletAddress}`);

      // Check payment limits if applicable
      await this.checkTransactionLimits(walletAddress, amount);

      // Call the Starknet service to execute the deposit
      const txHash = await this.starknetService.deposit(walletAddress, amount);

      // Record the transaction
      await this.recordTransaction({
        transactionHash: txHash,
        senderAddress: walletAddress, // In deposit case, sender is the same as recipient
        recipientAddress: walletAddress,
        amount,
        type: 'DEPOSIT',
        status: 'PENDING',
        reference: 'Deposit',
      });

      return {
        transactionHash: txHash,
        message: `Successfully initiated deposit of ${amount} STRK for ${walletAddress}`,
        explorerUrl: `${this.explorerBaseUrl}${txHash}`,
      };
    } catch (error) {
      this.logger.error(
        `Error processing deposit: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Process a tier upgrade transaction
   * @param walletAddress User's wallet address
   * @returns Transaction details
   */
  async upgradeTier(walletAddress: string) {
    try {
      this.logger.log(`Processing tier upgrade for ${walletAddress}`);

      // Call the Starknet service to execute the tier upgrade
      const txHash = await this.starknetService.upgradeTier(walletAddress);

      // Record the transaction
      await this.recordTransaction({
        transactionHash: txHash,
        senderAddress: walletAddress,
        recipientAddress: walletAddress,
        amount: 0, // Tier upgrade might not involve a direct amount
        type: 'UPGRADE',
        status: 'PENDING',
        reference: 'Tier Upgrade',
      });

      return {
        transactionHash: txHash,
        message: `Successfully initiated tier upgrade for ${walletAddress}`,
        explorerUrl: `${this.explorerBaseUrl}${txHash}`,
      };
    } catch (error) {
      this.logger.error(
        `Error processing tier upgrade: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Process a payment for call transaction
   * @param walletAddress User's wallet address
   * @param amount Amount to pay
   * @returns Transaction details
   */
  async payForCall(walletAddress: string, amount: number) {
    try {
      this.logger.log(
        `Processing payment for call of ${amount} for ${walletAddress}`,
      );

      // Check payment limits if applicable
      await this.checkTransactionLimits(walletAddress, amount);

      // Call the Starknet service to execute the payment for call
      const txHash = await this.starknetService.payForCall(
        walletAddress,
        amount,
      );

      // Record the transaction
      await this.recordTransaction({
        transactionHash: txHash,
        senderAddress: walletAddress,
        recipientAddress: walletAddress, // In this case, it's a fee so recipient is the same
        amount,
        type: 'CALL_FEE',
        status: 'PENDING',
        reference: 'Forum Call Fee',
      });

      return {
        transactionHash: txHash,
        message: `Successfully initiated payment of ${amount} STRK for call by ${walletAddress}`,
        explorerUrl: `${this.explorerBaseUrl}${txHash}`,
      };
    } catch (error) {
      this.logger.error(
        `Error processing payment for call: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get transaction status
   * @param txHash Transaction hash
   * @returns Transaction status and details
   */
  async getTransactionStatus(txHash: string) {
    try {
      this.logger.log(`Getting status for transaction: ${txHash}`);

      const txReceipt = await this.starknetService.getTransactionStatus(txHash);

      // Update transaction status in our database if it's confirmed
      if (
        txReceipt.status === 'ACCEPTED_ON_L2' ||
        txReceipt.status === 'ACCEPTED_ON_L1'
      ) {
        await this.updateTransactionStatus(txHash, 'CONFIRMED');
      } else if (txReceipt.status === 'REJECTED') {
        await this.updateTransactionStatus(txHash, 'FAILED');
      }

      return {
        transactionHash: txHash,
        status: txReceipt.status,
        blockNumber: txReceipt.block_number,
        blockHash: txReceipt.block_hash,
        actualFee: txReceipt.actual_fee,
        events: txReceipt.events,
        explorerUrl: `${this.explorerBaseUrl}${txHash}`,
      };
    } catch (error) {
      this.logger.error(
        `Error getting transaction status: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Register a webhook for transaction receipt
   * @param webhookConfig Webhook configuration
   * @returns Webhook registration details
   */
  async registerWebhook(webhookConfig: WebhookConfigDto) {
    try {
      this.logger.log(
        `Registering webhook for transaction: ${webhookConfig.transactionHash}`,
      );

      // Save webhook configuration to database
      const newWebhook = this.webhookConfigRepository.create({
        transactionHash: webhookConfig.transactionHash,
        callbackUrl: webhookConfig.callbackUrl,
        secretKey: webhookConfig.secretKey,
        status: 'PENDING',
      });

      await this.webhookConfigRepository.save(newWebhook);

      // Start monitoring the transaction in the background
      this.monitorTransaction(newWebhook.id);

      return {
        id: newWebhook.id,
        transactionHash: webhookConfig.transactionHash,
        message: 'Webhook registered successfully',
      };
    } catch (error) {
      this.logger.error(
        `Error registering webhook: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get user balance
   * @param walletAddress User's wallet address
   * @returns Balance information
   */
  async getBalance(walletAddress: string) {
    try {
      this.logger.log(`Getting balance for wallet: ${walletAddress}`);

      const balance = await this.starknetService.getBalance(walletAddress);

      // Get transaction history summary
      const [deposits, withdrawals] = await Promise.all([
        this.paymentTransactionRepository
          .createQueryBuilder('transaction')
          .select('SUM(transaction.amount)', 'sum')
          .where('transaction.recipientAddress = :walletAddress', {
            walletAddress,
          })
          .andWhere('transaction.status = :status', { status: 'CONFIRMED' })
          .getRawOne()
          .then((result) => result.sum || 0),
        this.paymentTransactionRepository
          .createQueryBuilder('transaction')
          .select('SUM(transaction.amount)', 'sum')
          .where('transaction.senderAddress = :walletAddress', {
            walletAddress,
          })
          .andWhere('transaction.status = :status', { status: 'CONFIRMED' })
          .andWhere('transaction.type = :type', { type: 'TRANSFER' })
          .getRawOne()
          .then((result) => result.sum || 0),
      ]);

      return {
        walletAddress,
        balance,
        deposits: deposits || 0,
        withdrawals: withdrawals || 0,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error getting balance: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Process a batch payment
   * @param batchPaymentDto Batch payment data
   * @returns Transaction details
   */
  async processBatchPayment(batchPaymentDto: BatchPaymentDto) {
    try {
      this.logger.log(
        `Processing batch payment from ${batchPaymentDto.senderAddress} to ${batchPaymentDto.payments.length} recipients`,
      );

      // Calculate total amount
      const totalAmount = batchPaymentDto.payments.reduce(
        (sum, payment) => sum + payment.amount,
        0,
      );

      // Check payment limits
      await this.checkTransactionLimits(
        batchPaymentDto.senderAddress,
        totalAmount,
      );

      // Extract recipients and amounts
      const recipients = batchPaymentDto.payments.map(
        (payment) => payment.recipientAddress,
      );
      const amounts = batchPaymentDto.payments.map((payment) => payment.amount);
      const transfers = recipients.map((recipient, index) => ({
        recipient,
        amount: amounts[index],
      }));

      // Generate a batch ID
      const batchId = uuidv4();

      // Call the Starknet service to execute the batch transfer
      const txHash = await this.starknetService.batchTransfer(transfers);

      // Record the main batch transaction
      await this.recordTransaction({
        transactionHash: txHash,
        senderAddress: batchPaymentDto.senderAddress,
        recipientAddress: recipients[0], // Just use the first recipient for the main record
        amount: totalAmount,
        type: 'BATCH',
        status: 'PENDING',
        reference: `Batch payment to ${recipients.length} recipients`,
        batchId,
      });

      // Record individual transactions for each payment in the batch
      for (let i = 0; i < recipients.length; i++) {
        await this.recordTransaction({
          transactionHash: txHash,
          senderAddress: batchPaymentDto.senderAddress,
          recipientAddress: recipients[i],
          amount: amounts[i],
          type: 'TRANSFER',
          status: 'PENDING',
          reference:
            batchPaymentDto.payments[i].reference ||
            `Batch payment item ${i + 1}`,
          batchId,
        });
      }

      return {
        transactionHash: txHash,
        batchId,
        totalAmount,
        recipientCount: recipients.length,
        message: `Successfully initiated batch payment of ${totalAmount} STRK to ${recipients.length} recipients`,
        explorerUrl: `${this.explorerBaseUrl}${txHash}`,
      };
    } catch (error) {
      this.logger.error(
        `Error processing batch payment: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Process a refund
   * @param refundDto Refund data
   * @returns Transaction details
   */
  async processRefund(refundDto: RefundDto) {
    try {
      this.logger.log(
        `Processing refund for transaction: ${refundDto.transactionHash}`,
      );

      // Find the original transaction
      const originalTransaction =
        await this.paymentTransactionRepository.findOne({
          where: { transactionHash: refundDto.transactionHash },
        });

      if (!originalTransaction) {
        throw new NotFoundException(
          `Transaction with hash ${refundDto.transactionHash} not found`,
        );
      }

      if (originalTransaction.status === 'REFUNDED') {
        throw new BadRequestException(`Transaction has already been refunded`);
      }

      if (originalTransaction.status !== 'CONFIRMED') {
        throw new BadRequestException(
          `Cannot refund a transaction that is not confirmed`,
        );
      }

      // Determine refund amount
      const refundAmount = refundDto.amount || originalTransaction.amount;

      if (refundAmount > originalTransaction.amount) {
        throw new BadRequestException(
          `Refund amount cannot exceed original transaction amount`,
        );
      }

      // Call the Starknet service to execute the refund
      // TODO: The StarknetService.refund method expects a reason string, not an amount.
      // This is a temporary fix to resolve the type error.
      const txHash = await this.starknetService.refund(
        refundDto.transactionHash,
        String(refundAmount),
      );

      // Record the refund transaction
      await this.recordTransaction({
        transactionHash: txHash,
        senderAddress: originalTransaction.recipientAddress, // Refund goes from recipient back to sender
        recipientAddress: originalTransaction.senderAddress,
        amount: refundAmount,
        type: 'REFUND',
        status: 'PENDING',
        reference:
          refundDto.reason ||
          `Refund for transaction ${refundDto.transactionHash}`,
        refundTransactionHash: refundDto.transactionHash,
      });

      // Update the original transaction status
      await this.updateTransactionStatus(refundDto.transactionHash, 'REFUNDED');

      return {
        transactionHash: txHash,
        originalTransactionHash: refundDto.transactionHash,
        refundAmount,
        message: `Successfully initiated refund of ${refundAmount} STRK for transaction ${refundDto.transactionHash}`,
        explorerUrl: `${this.explorerBaseUrl}${txHash}`,
      };
    } catch (error) {
      this.logger.error(
        `Error processing refund: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Schedule a payment
   * @param schedulePaymentDto Payment scheduling data
   * @returns Scheduled payment details
   */
  async schedulePayment(schedulePaymentDto: SchedulePaymentDto) {
    try {
      this.logger.log(
        `Scheduling payment from ${schedulePaymentDto.senderAddress} to ${schedulePaymentDto.recipientAddress}`,
      );

      const scheduledDate = new Date(schedulePaymentDto.scheduledDate);

      // Validate the scheduled date
      if (scheduledDate < new Date()) {
        throw new BadRequestException('Scheduled date must be in the future');
      }

      // Create the scheduled payment record
      const scheduledPayment = this.scheduledPaymentRepository.create({
        senderAddress: schedulePaymentDto.senderAddress,
        recipientAddress: schedulePaymentDto.recipientAddress,
        amount: schedulePaymentDto.amount,
        scheduledDate,
        recurring: schedulePaymentDto.recurring || false,
        recurrencePeriod: schedulePaymentDto.recurrencePeriod || null,
        recurrenceCount: schedulePaymentDto.recurrenceCount || null,
        reference: schedulePaymentDto.reference || null,
        status: 'PENDING',
        nextExecutionDate: scheduledDate,
      });

      await this.scheduledPaymentRepository.save(scheduledPayment);

      return {
        id: scheduledPayment.id,
        senderAddress: schedulePaymentDto.senderAddress,
        recipientAddress: schedulePaymentDto.recipientAddress,
        amount: schedulePaymentDto.amount,
        scheduledDate: scheduledDate.toISOString(),
        recurring: schedulePaymentDto.recurring || false,
        recurrencePeriod: schedulePaymentDto.recurrencePeriod,
        recurrenceCount: schedulePaymentDto.recurrenceCount,
        message: 'Payment scheduled successfully',
      };
    } catch (error) {
      this.logger.error(
        `Error scheduling payment: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Cancel a scheduled payment
   * @param paymentId Scheduled payment ID
   * @returns Cancellation details
   */
  async cancelScheduledPayment(paymentId: string) {
    try {
      this.logger.log(`Cancelling scheduled payment: ${paymentId}`);

      const scheduledPayment = await this.scheduledPaymentRepository.findOne({
        where: { id: paymentId },
      });

      if (!scheduledPayment) {
        throw new NotFoundException(
          `Scheduled payment with ID ${paymentId} not found`,
        );
      }

      if (scheduledPayment.status !== 'PENDING') {
        throw new BadRequestException(
          `Cannot cancel a payment that is not pending`,
        );
      }

      // Update the status to cancelled
      scheduledPayment.status = 'CANCELLED';
      await this.scheduledPaymentRepository.save(scheduledPayment);

      return {
        id: scheduledPayment.id,
        status: 'CANCELLED',
        message: 'Scheduled payment cancelled successfully',
      };
    } catch (error) {
      this.logger.error(
        `Error cancelling scheduled payment: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Set payment limits for a user
   * @param paymentLimitDto Payment limit data
   * @returns Payment limit details
   */
  async setPaymentLimits(paymentLimitDto: PaymentLimitDto) {
    try {
      this.logger.log(
        `Setting payment limits for wallet: ${paymentLimitDto.walletAddress}`,
      );

      // Check if limits already exist for this wallet
      let paymentLimit = await this.paymentLimitRepository.findOne({
        where: { walletAddress: paymentLimitDto.walletAddress },
      });

      if (paymentLimit) {
        // Update existing limits
        paymentLimit.dailyLimit = paymentLimitDto.dailyLimit;
        paymentLimit.transactionMaximum = paymentLimitDto.transactionMaximum;
        paymentLimit.riskScore = paymentLimitDto.riskScore;
      } else {
        // Create new limits
        paymentLimit = this.paymentLimitRepository.create({
          walletAddress: paymentLimitDto.walletAddress,
          dailyLimit: paymentLimitDto.dailyLimit,
          transactionMaximum: paymentLimitDto.transactionMaximum,
          riskScore: paymentLimitDto.riskScore,
        });
      }

      await this.paymentLimitRepository.save(paymentLimit);

      return {
        walletAddress: paymentLimit.walletAddress,
        dailyLimit: paymentLimit.dailyLimit,
        transactionMaximum: paymentLimit.transactionMaximum,
        riskScore: paymentLimit.riskScore,
        message: 'Payment limits set successfully',
      };
    } catch (error) {
      this.logger.error(
        `Error setting payment limits: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get payment history for a user
   * @param queryDto Payment history query parameters
   * @returns Paginated payment history
   */
  async getPaymentHistory(queryDto: PaymentHistoryQueryDto) {
    try {
      this.logger.log(
        `Getting payment history for wallet: ${queryDto.walletAddress}`,
      );

      const page = queryDto.page || 1;
      const limit = queryDto.limit || 10;
      const skip = (page - 1) * limit;

      // Build the where clause
      const whereClause: any = {
        where: [
          { senderAddress: queryDto.walletAddress },
          { recipientAddress: queryDto.walletAddress },
        ],
      };

      // Add date filters if provided
      if (queryDto.startDate || queryDto.endDate) {
        const dateFilter: any = {};

        if (queryDto.startDate) {
          dateFilter.timestamp = {
            ...dateFilter.timestamp,
            gte: new Date(queryDto.startDate),
          };
        }

        if (queryDto.endDate) {
          dateFilter.timestamp = {
            ...dateFilter.timestamp,
            lte: new Date(queryDto.endDate),
          };
        }

        whereClause.where = whereClause.where.map((condition) => ({
          ...condition,
          ...dateFilter,
        }));
      }

      // Get transactions and count
      const [transactions, total] = await Promise.all([
        this.paymentTransactionRepository.find({
          where: whereClause.where,
          order: { timestamp: 'DESC' },
          skip,
          take: limit,
        }),
        this.paymentTransactionRepository.count({
          where: whereClause.where,
        }),
      ]);

      // Format the transactions
      const formattedTransactions = transactions.map((tx) => ({
        id: tx.id,
        transactionHash: tx.transactionHash,
        type: tx.type,
        status: tx.status,
        amount: tx.amount,
        timestamp: tx.timestamp,
        direction:
          tx.senderAddress === queryDto.walletAddress ? 'OUTGOING' : 'INCOMING',
        counterparty:
          tx.senderAddress === queryDto.walletAddress
            ? tx.recipientAddress
            : tx.senderAddress,
        reference: tx.reference,
        explorerUrl: `${this.explorerBaseUrl}${tx.transactionHash}`,
      }));

      return {
        transactions: formattedTransactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(
        `Error getting payment history: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get payment analytics for a user
   * @param queryDto Payment analytics query parameters
   * @returns Payment analytics data
   */
  async getPaymentAnalytics(queryDto: PaymentAnalyticsQueryDto) {
    try {
      this.logger.log(
        `Getting payment analytics for wallet: ${queryDto.walletAddress}`,
      );

      const startDate = new Date(queryDto.startDate);
      const endDate = new Date(queryDto.endDate);
      const groupBy = queryDto.groupBy || 'month';

      // Get all transactions in the date range
      const transactions = await this.paymentTransactionRepository.find({
        where: [
          {
            senderAddress: queryDto.walletAddress,
            timestamp: Between(startDate, endDate),
            status: 'CONFIRMED',
          },
          {
            recipientAddress: queryDto.walletAddress,
            timestamp: Between(startDate, endDate),
            status: 'CONFIRMED',
          },
        ],
      });

      // Group transactions by period
      const groupedData = this.groupTransactionsByPeriod(
        transactions,
        queryDto.walletAddress,
        startDate,
        endDate,
        groupBy,
      );

      // Calculate summary statistics
      const totalIncoming = transactions
        .filter((tx) => tx.recipientAddress === queryDto.walletAddress)
        .reduce((sum, tx) => sum + Number(tx.amount), 0);

      const totalOutgoing = transactions
        .filter((tx) => tx.senderAddress === queryDto.walletAddress)
        .reduce((sum, tx) => sum + Number(tx.amount), 0);

      const transactionCount = transactions.length;
      const uniqueCounterparties = new Set(
        transactions.map((tx) =>
          tx.senderAddress === queryDto.walletAddress
            ? tx.recipientAddress
            : tx.senderAddress,
        ),
      ).size;

      return {
        walletAddress: queryDto.walletAddress,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          groupBy,
        },
        summary: {
          totalIncoming,
          totalOutgoing,
          netFlow: totalIncoming - totalOutgoing,
          transactionCount,
          uniqueCounterparties,
        },
        timeSeries: groupedData,
      };
    } catch (error) {
      this.logger.error(
        `Error getting payment analytics: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Monitor a transaction and trigger webhook when receipt is available
   * @param webhookId Webhook ID
   */
  private async monitorTransaction(webhookId: number) {
    try {
      const webhook = await this.webhookConfigRepository.findOne({
        where: { id: webhookId },
      });

      if (!webhook) {
        this.logger.error(`Webhook with ID ${webhookId} not found`);
        return;
      }

      // Poll for transaction receipt
      const maxAttempts = 20;
      let attempts = 0;

      const poll = async () => {
        try {
          attempts++;

          const txReceipt = await this.starknetService.getTransactionStatus(
            webhook.transactionHash,
          );

          if (
            txReceipt.status === 'ACCEPTED_ON_L2' ||
            txReceipt.status === 'ACCEPTED_ON_L1'
          ) {
            // Transaction is confirmed, trigger webhook
            await this.triggerWebhook(webhook, txReceipt);
            return;
          }

          if (attempts >= maxAttempts) {
            this.logger.warn(
              `Max polling attempts reached for transaction ${webhook.transactionHash}`,
            );

            // Update webhook status
            webhook.status = 'TIMEOUT';
            await this.webhookConfigRepository.save(webhook);
            return;
          }

          // Wait and try again
          setTimeout(poll, 15000); // Poll every 15 seconds
        } catch (error) {
          this.logger.error(
            `Error polling transaction: ${error.message}`,
            error.stack,
          );

          if (attempts >= maxAttempts) {
            // Update webhook status
            webhook.status = 'FAILED';
            await this.webhookConfigRepository.save(webhook);
          } else {
            // Wait and try again
            setTimeout(poll, 15000);
          }
        }
      };

      // Start polling
      poll();
    } catch (error) {
      this.logger.error(
        `Error monitoring transaction: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Trigger a webhook with transaction receipt
   * @param webhook Webhook configuration
   * @param txReceipt Transaction receipt
   */
  private async triggerWebhook(webhook: WebhookConfig, txReceipt: any) {
    try {
      this.logger.log(
        `Triggering webhook for transaction: ${webhook.transactionHash}`,
      );

      // Prepare payload
      const payload = {
        transactionHash: webhook.transactionHash,
        status: txReceipt.status,
        blockNumber: txReceipt.block_number,
        blockHash: txReceipt.block_hash,
        actualFee: txReceipt.actual_fee,
        events: txReceipt.events,
        timestamp: new Date().toISOString(),
      };

      // Prepare headers
      const headers: any = {
        'Content-Type': 'application/json',
      };

      // Add signature if secret key is provided
      if (webhook.secretKey) {
        const signature = this.generateSignature(payload, webhook.secretKey);
        headers['X-Webhook-Signature'] = signature;
      }

      // Send webhook
      const response = await firstValueFrom(
        this.httpService.post(webhook.callbackUrl, payload, { headers }),
      );

      // Update webhook status
      webhook.status = 'DELIVERED';
      webhook.deliveredAt = new Date();
      await this.webhookConfigRepository.save(webhook);

      this.logger.log(`Webhook delivered successfully: ${response.status}`);
    } catch (error) {
      this.logger.error(
        `Error triggering webhook: ${error.message}`,
        error.stack,
      );

      // Update webhook status
      webhook.status = 'FAILED';
      await this.webhookConfigRepository.save(webhook);
    }
  }

  /**
   * Generate signature for webhook payload
   * @param payload Webhook payload
   * @param secretKey Secret key
   * @returns Signature
   */
  private generateSignature(payload: any, secretKey: string): string {
    return crypto
      .createHmac('sha256', secretKey)
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  /**
   * Record a transaction in the database
   * @param transactionData Transaction data
   */
  private async recordTransaction(transactionData: {
    transactionHash: string;
    senderAddress: string;
    recipientAddress: string;
    amount: number;
    type: 'DEPOSIT' | 'UPGRADE' | 'CALL_FEE' | 'TRANSFER' | 'REFUND' | 'BATCH';
    status: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'REFUNDED';
    reference?: string;
    refundTransactionHash?: string;
    scheduledPaymentId?: string;
    batchId?: string;
  }) {
    try {
      const transaction = this.paymentTransactionRepository.create({
        transactionHash: transactionData.transactionHash,
        senderAddress: transactionData.senderAddress,
        recipientAddress: transactionData.recipientAddress,
        amount: transactionData.amount,
        type: transactionData.type,
        status: transactionData.status,
        reference: transactionData.reference || null,
        refundTransactionHash: transactionData.refundTransactionHash || null,
        scheduledPaymentId: transactionData.scheduledPaymentId || null,
        batchId: transactionData.batchId || null,
      });

      await this.paymentTransactionRepository.save(transaction);
    } catch (error) {
      this.logger.error(
        `Error recording transaction: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Update transaction status in the database
   * @param transactionHash Transaction hash
   * @param status New status
   */
  private async updateTransactionStatus(
    transactionHash: string,
    status: 'CONFIRMED' | 'FAILED' | 'REFUNDED',
  ) {
    try {
      await this.paymentTransactionRepository.update(
        { transactionHash },
        { status },
      );
    } catch (error) {
      this.logger.error(
        `Error updating transaction status: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Check if a transaction exceeds user's payment limits
   * @param walletAddress User's wallet address
   * @param amount Transaction amount
   */
  private async checkTransactionLimits(walletAddress: string, amount: number) {
    try {
      // Get user's payment limits
      const paymentLimit = await this.paymentLimitRepository.findOne({
        where: { walletAddress, isActive: true },
      });

      if (!paymentLimit) {
        // No limits set for this user
        return;
      }

      // Check transaction maximum
      if (amount > paymentLimit.transactionMaximum) {
        throw new BadRequestException(
          `Transaction amount ${amount} exceeds maximum allowed amount of ${paymentLimit.transactionMaximum}`,
        );
      }

      // Check daily limit
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const dailyTotal = await this.paymentTransactionRepository
        .createQueryBuilder('transaction')
        .select('SUM(transaction.amount)', 'sum')
        .where('transaction.senderAddress = :walletAddress', { walletAddress })
        .andWhere('transaction.timestamp BETWEEN :today AND :tomorrow', {
          today,
          tomorrow,
        })
        .andWhere('transaction.status = :status', { status: 'CONFIRMED' })
        .getRawOne()
        .then((result) => result.sum || 0);

      if (dailyTotal + amount > paymentLimit.dailyLimit) {
        throw new BadRequestException(
          `Transaction would exceed daily limit of ${paymentLimit.dailyLimit}. Current daily total: ${dailyTotal}`,
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Error checking transaction limits: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Group transactions by time period for analytics
   * @param transactions Transactions to group
   * @param walletAddress User's wallet address
   * @param startDate Start date
   * @param endDate End date
   * @param groupBy Grouping period (day, week, month)
   * @returns Grouped transaction data
   */
  private groupTransactionsByPeriod(
    transactions: PaymentTransaction[],
    walletAddress: string,
    startDate: Date,
    endDate: Date,
    groupBy: 'day' | 'week' | 'month',
  ) {
    const result = [];
    const currentDate = new Date(startDate);

    // Generate periods
    while (currentDate <= endDate) {
      const periodStart = new Date(currentDate);
      let periodEnd: Date;

      if (groupBy === 'day') {
        periodEnd = new Date(currentDate);
        periodEnd.setHours(23, 59, 59, 999);
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (groupBy === 'week') {
        periodEnd = new Date(currentDate);
        periodEnd.setDate(periodEnd.getDate() + 6);
        periodEnd.setHours(23, 59, 59, 999);
        currentDate.setDate(currentDate.getDate() + 7);
      } else {
        // month
        periodEnd = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        );
        currentDate.setMonth(currentDate.getMonth() + 1);
        currentDate.setDate(1);
      }

      // Don't go beyond the end date
      if (periodEnd > endDate) {
        periodEnd = new Date(endDate);
      }

      // Filter transactions for this period
      const periodTransactions = transactions.filter((tx) => {
        const txDate = new Date(tx.timestamp);
        return txDate >= periodStart && txDate <= periodEnd;
      });

      // Calculate metrics for this period
      const incoming = periodTransactions
        .filter((tx) => tx.recipientAddress === walletAddress)
        .reduce((sum, tx) => sum + Number(tx.amount), 0);

      const outgoing = periodTransactions
        .filter((tx) => tx.senderAddress === walletAddress)
        .reduce((sum, tx) => sum + Number(tx.amount), 0);

      result.push({
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        incoming,
        outgoing,
        netFlow: incoming - outgoing,
        transactionCount: periodTransactions.length,
      });
    }

    return result;
  }

  /**
   * Cron job to process scheduled payments
   * Runs every minute
   */
  @Cron('0 * * * * *')
  async processScheduledPayments() {
    try {
      this.logger.log('Processing scheduled payments');

      const now = new Date();

      // Find scheduled payments that are due
      const duePayments = await this.scheduledPaymentRepository.find({
        where: {
          status: 'PENDING',
          nextExecutionDate: LessThanOrEqual(now),
        },
      });

      this.logger.log(`Found ${duePayments.length} due payments`);

      // Process each payment
      for (const payment of duePayments) {
        try {
          // Check payment limits
          await this.checkTransactionLimits(
            payment.senderAddress,
            payment.amount,
          );

          // Execute the transfer
          const txHash = await this.starknetService.transfer(
            payment.senderAddress,
            payment.recipientAddress,
            payment.amount,
          );

          // Record the transaction
          await this.recordTransaction({
            transactionHash: txHash,
            senderAddress: payment.senderAddress,
            recipientAddress: payment.recipientAddress,
            amount: payment.amount,
            type: 'TRANSFER',
            status: 'PENDING',
            reference: payment.reference || 'Scheduled payment',
            scheduledPaymentId: payment.id,
          });

          // Update the scheduled payment record
          payment.lastExecutionDate = now;
          payment.executionCount += 1;

          // Handle recurring payments
          if (payment.recurring) {
            // Calculate next execution date
            const nextDate = new Date(payment.scheduledDate);

            if (payment.recurrencePeriod === 'day') {
              nextDate.setDate(nextDate.getDate() + payment.executionCount);
            } else if (payment.recurrencePeriod === 'week') {
              nextDate.setDate(nextDate.getDate() + payment.executionCount * 7);
            } else if (payment.recurrencePeriod === 'month') {
              nextDate.setMonth(nextDate.getMonth() + payment.executionCount);
            } else if (payment.recurrencePeriod === 'year') {
              nextDate.setFullYear(
                nextDate.getFullYear() + payment.executionCount,
              );
            }

            // Check if we've reached the recurrence count limit
            if (
              payment.recurrenceCount &&
              payment.executionCount >= payment.recurrenceCount
            ) {
              payment.status = 'EXECUTED';
              payment.nextExecutionDate = null;
            } else {
              payment.nextExecutionDate = nextDate;
            }
          } else {
            // Non-recurring payment is complete
            payment.status = 'EXECUTED';
            payment.nextExecutionDate = null;
          }

          await this.scheduledPaymentRepository.save(payment);

          this.logger.log(
            `Executed scheduled payment ${payment.id} with transaction ${txHash}`,
          );
        } catch (error) {
          this.logger.error(
            `Error executing scheduled payment ${payment.id}: ${error.message}`,
            error.stack,
          );

          // Mark as failed if there's an error
          payment.status = 'FAILED';
          await this.scheduledPaymentRepository.save(payment);
        }
      }
    } catch (error) {
      this.logger.error(
        `Error processing scheduled payments: ${error.message}`,
        error.stack,
      );
    }
  }
}
