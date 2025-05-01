// src/notification/controllers/webhook.controller.ts
import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req, Put, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WebhookService } from '../services/webhook.service';
import { CreateWebhookDto } from '../dto/create-webhook.dto';
import { UpdateWebhookDto } from '../dto/update-webhook.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@ApiTags('webhooks')
@Controller('webhooks')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new webhook' })
  @ApiResponse({ status: 201, description: 'Webhook registered successfully.' })
  create(@Body() createWebhookDto: CreateWebhookDto, @Req() req: Request) {
    return this.webhookService.registerWebhook(createWebhookDto, req.user['id']);
  }

  @Get()
  @ApiOperation({ summary: 'Get all webhooks for a user' })
  @ApiResponse({ status: 200, description: 'Return all webhooks.' })
  findAll(@Req() req: Request) {
    return this.webhookService.findAllWebhooks(req.user['id']);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a webhook by id' })
  @ApiResponse({ status: 200, description: 'Return the webhook.' })
  @ApiResponse({ status: 404, description: 'Webhook not found.' })
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.webhookService.findWebhook(id, req.user['id']);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a webhook' })
  @ApiResponse({ status: 200, description: 'Webhook updated successfully.' })
  update(
    @Param('id') id: string,
    @Body() updateWebhookDto: UpdateWebhookDto,
    @Req() req: Request,
  ) {
    return this.webhookService.updateWebhook(id, updateWebhookDto, req.user['id']);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a webhook' })
  @ApiResponse({ status: 200, description: 'Webhook deleted successfully.' })
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.webhookService.removeWebhook(id, req.user['id']);
  }

  @Post(':id/verify')
  @ApiOperation({ summary: 'Request webhook verification' })
  @ApiResponse({ status: 200, description: 'Verification request sent.' })
  requestVerification(@Param('id') id: string, @Req() req: Request) {
    return this.webhookService.requestWebhookVerification(id, req.user['id']);
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
  testWebhook(@Param('id') id: string, @Body() testData: any, @Req() req: Request) {
    return this.webhookService.testWebhook(id, testData, req.user['id']);
  }

  @Get(':id/deliveries')
  @ApiOperation({ summary: 'Get webhook delivery history' })
  @ApiResponse({ status: 200, description: 'Return delivery history.' })
  getDeliveryHistory(
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Req() req: Request,
  ) {
    return this.webhookService.getWebhookDeliveryHistory(id, req.user['id'], { page, limit });
  }
}
