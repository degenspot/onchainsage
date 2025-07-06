// src/notification/controllers/webhook.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Injectable,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { WebhookService } from '../services/webhook.service';
import { CreateWebhookDto } from '../dto/create-webhook.dto';
import { UpdateWebhookDto } from '../dto/update-webhook.dto';
import { AuthGuard } from '@nestjs/passport';

// Placeholder for JwtAuthGuard
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@ApiTags('webhooks')
@Controller('webhooks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new webhook' })
  @ApiResponse({ status: 201, description: 'Webhook registered successfully.' })
  async create(@Body() createWebhookDto: CreateWebhookDto, @Request() req) {
    return this.webhookService.registerWebhook(
      createWebhookDto,
      (req as any).user?.id || null,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all webhooks for a user' })
  @ApiResponse({ status: 200, description: 'Return all webhooks.' })
  async findAll(@Request() req) {
    return this.webhookService.findAllWebhooks((req as any).user?.id || null);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a webhook by id' })
  @ApiResponse({ status: 200, description: 'Return the webhook.' })
  @ApiResponse({ status: 404, description: 'Webhook not found.' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.webhookService.findWebhook(id, (req as any).user?.id || null);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a webhook' })
  @ApiResponse({ status: 200, description: 'Webhook updated successfully.' })
  async update(
    @Param('id') id: string,
    @Body() updateWebhookDto: UpdateWebhookDto,
    @Request() req,
  ) {
    return this.webhookService.updateWebhook(
      id,
      updateWebhookDto,
      (req as any).user?.id || null,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a webhook' })
  @ApiResponse({ status: 200, description: 'Webhook deleted successfully.' })
  async remove(@Param('id') id: string, @Request() req) {
    return this.webhookService.removeWebhook(id, (req as any).user?.id || null);
  }

  @Post(':id/verify')
  @ApiOperation({ summary: 'Request webhook verification' })
  @ApiResponse({ status: 200, description: 'Verification request sent.' })
  async requestVerification(@Param('id') id: string, @Request() req) {
    return this.webhookService.requestWebhookVerification(
      id,
      (req as any).user?.id || null,
    );
  }

  @Get('verify/:token')
  @ApiOperation({ summary: 'Verify webhook with token' })
  @ApiResponse({ status: 200, description: 'Webhook verified successfully.' })
  verifyWebhook(@Param('token') token: string) {
    return this.webhookService.verifyWebhook(token);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Send test event to webhook' })
  @ApiResponse({ status: 200, description: 'Test event sent.' })
  async testWebhook(
    @Param('id') id: string,
    @Body() testData: any,
    @Request() req,
  ) {
    return this.webhookService.testWebhook(
      id,
      testData,
      (req as any).user?.id || null,
    );
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get webhook delivery history' })
  @ApiResponse({ status: 200, description: 'Return delivery history.' })
  async getDeliveryHistory(
    @Param('id') id: string,
    @Request() req,
    @Body('page') page: number = 1,
    @Body('limit') limit: number = 10,
  ) {
    return this.webhookService.getWebhookDeliveryHistory(
      id,
      (req as any).user?.id || null,
      { page, limit },
    );
  }
}
