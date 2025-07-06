import { Controller, Get, Post, Body, Patch, Param, Delete, Put, UseGuards, Request } from '@nestjs/common';
import { WebhookService } from './web-hook.service';
import { CreateWebHookDto } from './dto/create-web-hook.dto';
import { UpdateWebHookDto } from './dto/update-web-hook.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('web-hook')
export class WebHookController {
  constructor(private readonly webHookService: WebhookService) {}

  @Post()
  create(@Body() createWebHookDto: CreateWebHookDto) {
    return this.webHookService.create(createWebHookDto);
  }

  @Get()
  findAll() {
    return this.webHookService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.webHookService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWebHookDto: UpdateWebHookDto) {
    return this.webHookService.update(+id, updateWebHookDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.webHookService.remove(+id);
  }
}
