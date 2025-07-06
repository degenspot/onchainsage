// src/social-engagement/social-engagement.controller.ts
import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { SocialEngagementService } from './social-engagement.service';
import { CreateEngagementDto } from './dto/create-engagement.dto';
import { EngagementResponseDto } from './dto/engagement-response.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
// import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
// import { User } from 'src/users/entities/user.entity';
import { ContentType } from '../shared/enums/content-type.enum';

@ApiTags('social-engagement')
@Controller('engagements')
export class SocialEngagementController {
  constructor(private readonly service: SocialEngagementService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create or toggle a like/dislike engagement' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Engagement created or updated',
    type: EngagementResponseDto,
  })
  async createEngagement(
    // @CurrentUser() user: User,
    @Body() dto: CreateEngagementDto,
  ): Promise<EngagementResponseDto> {
    // const userId = user.id;
    const userId = 'mock-user-id'; // Mock user ID
    return this.service.createEngagement(userId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an engagement' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Engagement removed',
  })
  async removeEngagement(
    // @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<void> {
    // const userId = user.id;
    const userId = 'mock-user-id'; // Mock user ID
    return this.service.removeEngagement(userId, id);
  }

  @Get('user/:contentId/:contentType')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user engagement for a specific content',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User engagement',
    type: EngagementResponseDto,
  })
  async getUserEngagement(
    // @CurrentUser() user: User,
    @Param('contentId') contentId: string,
    @Param('contentType') contentType: ContentType,
  ): Promise<EngagementResponseDto> {
    // const userId = user.id;
    const userId = 'mock-user-id'; // Mock user ID
    return this.service.getUserEngagement(userId, contentId, contentType);
  }

  @Get('count/:contentId/:contentType')
  @ApiOperation({ summary: 'Get engagement counts for content' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Engagement counts',
    schema: {
      type: 'object',
      properties: {
        likes: { type: 'number' },
        dislikes: { type: 'number' },
      },
    },
  })
  async getContentEngagementCounts(
    @Param('contentId') contentId: string,
    @Param('contentType') contentType: ContentType,
  ): Promise<{ likes: number; dislikes: number }> {
    return this.service.getContentEngagementCounts(contentId, contentType);
  }

  @Get(':contentId/:contentType')
  @ApiOperation({ summary: 'Get all engagements for a specific content' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Content engagements',
    schema: {
      type: 'object',
      properties: {
        engagements: {
          type: 'array',
          items: { $ref: '#/components/schemas/EngagementResponseDto' },
        },
        total: { type: 'number' },
      },
    },
  })
  async getContentEngagements(
    @Param('contentId') contentId: string,
    @Param('contentType') contentType: ContentType,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<{ engagements: EngagementResponseDto[]; total: number }> {
    return this.service.getContentEngagements(
      contentId,
      contentType,
      page,
      limit,
    );
  }

  @Get(':contentType/:contentId/summary')
  @ApiOperation({
    summary: 'Get the current user-s engagement for a content item',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User engagement summary',
    type: EngagementResponseDto,
  })
  async getUserEngagementSummary(
    // @CurrentUser() user: User,
    @Param('contentId') contentId: string,
    @Param('contentType') contentType: ContentType,
  ): Promise<EngagementResponseDto | null> {
    // const userId = user.id;
    const userId = 'mock-user-id'; // Mock user ID
    return this.service.getUserEngagement(userId, contentId, contentType);
  }
}
