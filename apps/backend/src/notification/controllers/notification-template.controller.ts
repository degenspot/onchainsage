// src/notification/controllers/notification-template.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NotificationTemplateService } from '../services/notification-template.service';
import { CreateTemplateDto } from '../dto/create-template.dto';
import { UpdateTemplateDto } from '../dto/update-template.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('notification-templates')
@Controller('notification-templates')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class NotificationTemplateController {
  constructor(private readonly templateService: NotificationTemplateService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a notification template' })
  @ApiResponse({ status: 201, description: 'Template created successfully.' })
  create(@Body() createTemplateDto: CreateTemplateDto) {
    return this.templateService.create(createTemplateDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all notification templates' })
  @ApiResponse({ status: 200, description: 'Return all templates.' })
  findAll(@Query('active') active?: boolean) {
    return this.templateService.findAll(active);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a notification template by id' })
  @ApiResponse({ status: 200, description: 'Return the template.' })
  @ApiResponse({ status: 404, description: 'Template not found.' })
  findOne(@Param('id') id: string) {
    return this.templateService.findOne(id);
  }

  @Put(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update a notification template' })
  @ApiResponse({ status: 200, description: 'Template updated successfully.' })
  update(
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdateTemplateDto,
  ) {
    return this.templateService.update(id, updateTemplateDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a notification template' })
  @ApiResponse({ status: 200, description: 'Template deleted successfully.' })
  remove(@Param('id') id: string) {
    return this.templateService.remove(id);
  }

  @Post(':id/preview')
  @ApiOperation({ summary: 'Preview a notification template with data' })
  @ApiResponse({ status: 200, description: 'Return preview.' })
  previewTemplate(@Param('id') id: string, @Body() data: Record<string, any>) {
    return this.templateService.previewTemplate(id, data);
  }
}
