import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
  Logger,
  ValidationPipe,
  UseInterceptors,
  UseGuards,
  Delete,
} from '@nestjs/common';
import type { PaymentService } from './payment.service';
import type {
  DepositDto,
  UpgradeDto,
  PayForCallDto,
  WebhookConfigDto,
  GetBalanceDto,
  BatchPaymentDto,
  RefundDto,
  SchedulePaymentDto,
  PaymentLimitDto,
  PaymentHistoryQueryDto,
  PaymentAnalyticsQueryDto,
} from './dto/payment.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { HttpLoggingInterceptor } from '../common/interceptors/http-logging.interceptor';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@ApiTags('payment')
@Controller('payment')
@UseInterceptors(HttpLoggingInterceptor)
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly paymentService: PaymentService) {}

  @Post('deposit')
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deposit STRK tokens' })
  @ApiResponse({
    status: 201,
    description: 'Deposit transaction submitted successfully',
    schema: {
      properties: {
        transactionHash: { type: 'string' },
        message: { type: 'string' },
        explorerUrl: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async deposit(
    @Body(new ValidationPipe()) depositDto: DepositDto,
  ): Promise<any> {
    try {
      this.logger.log(
        `Deposit request received: ${JSON.stringify(depositDto)}`,
      );
      const result = await this.paymentService.deposit(
        depositDto.walletAddress,
        depositDto.amount,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error in deposit endpoint: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        error.message || 'Failed to process deposit',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('upgrade')
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upgrade user tier' })
  @ApiResponse({
    status: 201,
    description: 'Tier upgrade transaction submitted successfully',
    schema: {
      properties: {
        transactionHash: { type: 'string' },
        message: { type: 'string' },
        explorerUrl: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async upgrade(@Body(new ValidationPipe()) upgradeDto: UpgradeDto) {
    try {
      this.logger.log(
        `Upgrade request received: ${JSON.stringify(upgradeDto)}`,
      );
      const result = await this.paymentService.upgradeTier(
        upgradeDto.walletAddress,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error in upgrade endpoint: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        error.message || 'Failed to process tier upgrade',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('call')
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Pay for forum call' })
  @ApiResponse({
    status: 201,
    description: 'Payment for call transaction submitted successfully',
    schema: {
      properties: {
        transactionHash: { type: 'string' },
        message: { type: 'string' },
        explorerUrl: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async payForCall(@Body(new ValidationPipe()) payForCallDto: PayForCallDto) {
    try {
      this.logger.log(
        `Pay for call request received: ${JSON.stringify(payForCallDto)}`,
      );
      const result = await this.paymentService.payForCall(
        payForCallDto.walletAddress,
        payForCallDto.amount,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error in pay for call endpoint: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        error.message || 'Failed to process payment for call',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('transaction/:hash')
  @ApiOperation({ summary: 'Get transaction status' })
  @ApiParam({ name: 'hash', description: 'Transaction hash' })
  @ApiResponse({
    status: 200,
    description: 'Transaction status retrieved successfully',
    schema: {
      properties: {
        transactionHash: { type: 'string' },
        status: { type: 'string' },
        blockNumber: { type: 'number' },
        blockHash: { type: 'string' },
        actualFee: { type: 'string' },
        events: { type: 'array' },
        explorerUrl: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getTransactionStatus(@Param('hash') txHash: string) {
    try {
      this.logger.log(
        `Transaction status request received for hash: ${txHash}`,
      );
      const result = await this.paymentService.getTransactionStatus(txHash);
      return result;
    } catch (error) {
      this.logger.error(
        `Error in transaction status endpoint: ${error.message}`,
        error.stack,
      );

      if (error.message.includes('not found')) {
        throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);
      }

      throw new HttpException(
        error.message || 'Failed to get transaction status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('webhook')
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register webhook for transaction receipt' })
  @ApiResponse({
    status: 201,
    description: 'Webhook registered successfully',
    schema: {
      properties: {
        id: { type: 'number' },
        transactionHash: { type: 'string' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async registerWebhook(
    @Body(new ValidationPipe()) webhookConfigDto: WebhookConfigDto,
  ) {
    try {
      this.logger.log(
        `Webhook registration request received for transaction: ${webhookConfigDto.transactionHash}`,
      );
      const result =
        await this.paymentService.registerWebhook(webhookConfigDto);
      return result;
    } catch (error) {
      this.logger.error(
        `Error in webhook registration endpoint: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        error.message || 'Failed to register webhook',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // New endpoints for enhanced functionality

  @Get('balance')
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user balance' })
  @ApiResponse({
    status: 200,
    description: 'Balance retrieved successfully',
    schema: {
      properties: {
        walletAddress: { type: 'string' },
        balance: { type: 'string' },
        deposits: { type: 'number' },
        withdrawals: { type: 'number' },
        lastUpdated: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getBalance(@Query(new ValidationPipe()) getBalanceDto: GetBalanceDto) {
    try {
      this.logger.log(
        `Balance request received for wallet: ${getBalanceDto.walletAddress}`,
      );
      const result = await this.paymentService.getBalance(
        getBalanceDto.walletAddress,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error in balance endpoint: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        error.message || 'Failed to get balance',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('batch')
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Process batch payment' })
  @ApiResponse({
    status: 201,
    description: 'Batch payment transaction submitted successfully',
    schema: {
      properties: {
        transactionHash: { type: 'string' },
        batchId: { type: 'string' },
        totalAmount: { type: 'number' },
        recipientCount: { type: 'number' },
        message: { type: 'string' },
        explorerUrl: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async processBatchPayment(
    @Body(new ValidationPipe()) batchPaymentDto: BatchPaymentDto,
  ) {
    try {
      this.logger.log(
        `Batch payment request received from: ${batchPaymentDto.senderAddress}`,
      );
      const result =
        await this.paymentService.processBatchPayment(batchPaymentDto);
      return result;
    } catch (error) {
      this.logger.error(
        `Error in batch payment endpoint: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        error.message || 'Failed to process batch payment',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('refund')
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Process refund' })
  @ApiResponse({
    status: 201,
    description: 'Refund transaction submitted successfully',
    schema: {
      properties: {
        transactionHash: { type: 'string' },
        originalTransactionHash: { type: 'string' },
        refundAmount: { type: 'number' },
        message: { type: 'string' },
        explorerUrl: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async processRefund(@Body(new ValidationPipe()) refundDto: RefundDto) {
    try {
      this.logger.log(
        `Refund request received for transaction: ${refundDto.transactionHash}`,
      );
      const result = await this.paymentService.processRefund(refundDto);
      return result;
    } catch (error) {
      this.logger.error(
        `Error in refund endpoint: ${error.message}`,
        error.stack,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        error.message || 'Failed to process refund',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('schedule')
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Schedule a payment' })
  @ApiResponse({
    status: 201,
    description: 'Payment scheduled successfully',
    schema: {
      properties: {
        id: { type: 'string' },
        senderAddress: { type: 'string' },
        recipientAddress: { type: 'string' },
        amount: { type: 'number' },
        scheduledDate: { type: 'string' },
        recurring: { type: 'boolean' },
        recurrencePeriod: { type: 'string' },
        recurrenceCount: { type: 'number' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async schedulePayment(
    @Body(new ValidationPipe()) schedulePaymentDto: SchedulePaymentDto,
  ) {
    try {
      this.logger.log(
        `Schedule payment request received from: ${schedulePaymentDto.senderAddress}`,
      );
      const result =
        await this.paymentService.schedulePayment(schedulePaymentDto);
      return result;
    } catch (error) {
      this.logger.error(
        `Error in schedule payment endpoint: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        error.message || 'Failed to schedule payment',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('schedule/:id')
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a scheduled payment' })
  @ApiParam({ name: 'id', description: 'Scheduled payment ID' })
  @ApiResponse({
    status: 200,
    description: 'Scheduled payment cancelled successfully',
    schema: {
      properties: {
        id: { type: 'string' },
        status: { type: 'string' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Scheduled payment not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async cancelScheduledPayment(@Param('id') paymentId: string) {
    try {
      this.logger.log(
        `Cancel scheduled payment request received for ID: ${paymentId}`,
      );
      const result =
        await this.paymentService.cancelScheduledPayment(paymentId);
      return result;
    } catch (error) {
      this.logger.error(
        `Error in cancel scheduled payment endpoint: ${error.message}`,
        error.stack,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        error.message || 'Failed to cancel scheduled payment',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('limits')
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set payment limits for a user' })
  @ApiResponse({
    status: 201,
    description: 'Payment limits set successfully',
    schema: {
      properties: {
        walletAddress: { type: 'string' },
        dailyLimit: { type: 'number' },
        transactionMaximum: { type: 'number' },
        riskScore: { type: 'number' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async setPaymentLimits(
    @Body(new ValidationPipe()) paymentLimitDto: PaymentLimitDto,
  ) {
    try {
      this.logger.log(
        `Set payment limits request received for wallet: ${paymentLimitDto.walletAddress}`,
      );
      const result =
        await this.paymentService.setPaymentLimits(paymentLimitDto);
      return result;
    } catch (error) {
      this.logger.error(
        `Error in set payment limits endpoint: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        error.message || 'Failed to set payment limits',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('history')
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment history for a user' })
  @ApiResponse({
    status: 200,
    description: 'Payment history retrieved successfully',
    schema: {
      properties: {
        transactions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              transactionHash: { type: 'string' },
              type: { type: 'string' },
              status: { type: 'string' },
              amount: { type: 'number' },
              timestamp: { type: 'string' },
              direction: { type: 'string' },
              counterparty: { type: 'string' },
              reference: { type: 'string' },
              explorerUrl: { type: 'string' },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            pages: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getPaymentHistory(
    @Query(new ValidationPipe()) queryDto: PaymentHistoryQueryDto,
  ) {
    try {
      this.logger.log(
        `Payment history request received for wallet: ${queryDto.walletAddress}`,
      );
      const result = await this.paymentService.getPaymentHistory(queryDto);
      return result;
    } catch (error) {
      this.logger.error(
        `Error in payment history endpoint: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        error.message || 'Failed to get payment history',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('analytics')
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment analytics for a user' })
  @ApiResponse({
    status: 200,
    description: 'Payment analytics retrieved successfully',
    schema: {
      properties: {
        walletAddress: { type: 'string' },
        period: {
          type: 'object',
          properties: {
            start: { type: 'string' },
            end: { type: 'string' },
            groupBy: { type: 'string' },
          },
        },
        summary: {
          type: 'object',
          properties: {
            totalIncoming: { type: 'number' },
            totalOutgoing: { type: 'number' },
            netFlow: { type: 'number' },
            transactionCount: { type: 'number' },
            uniqueCounterparties: { type: 'number' },
          },
        },
        timeSeries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              periodStart: { type: 'string' },
              periodEnd: { type: 'string' },
              incoming: { type: 'number' },
              outgoing: { type: 'number' },
              netFlow: { type: 'number' },
              transactionCount: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getPaymentAnalytics(
    @Query(new ValidationPipe()) queryDto: PaymentAnalyticsQueryDto,
  ) {
    try {
      this.logger.log(
        `Payment analytics request received for wallet: ${queryDto.walletAddress}`,
      );
      const result = await this.paymentService.getPaymentAnalytics(queryDto);
      return result;
    } catch (error) {
      this.logger.error(
        `Error in payment analytics endpoint: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        error.message || 'Failed to get payment analytics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
