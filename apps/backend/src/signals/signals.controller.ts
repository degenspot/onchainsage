import { Controller, Get, Param, Post, Query, Put, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { SignalsService } from './signals.service'; 
import { MockSignalService } from './mock-signals.service';
import { Signal } from './entities/signal.entity'; 
import { PaginatedResponse, PaginationDto } from './interfaces/pagination.dto';

@Controller('signals')
export class SignalsController {
  constructor(
    private readonly signalsService: SignalsService,
    private readonly mockSignalsService: MockSignalService
  ) {}

  @Get()
  async findAll(@Query() paginationDto: PaginationDto): Promise<PaginatedResponse<Signal>> {
    // Get paginated signals from the service
    const { data, total } = await this.signalsService.findAll(
      paginationDto.page,
      paginationDto.limit
    );
    
    return {
      data,
      metadata: {
        total,
        page: paginationDto.page,
        limit: paginationDto.limit
      }
    };
  }

  @Get('mock')
  async getMockSignals(@Query() paginationDto: PaginationDto): Promise<PaginatedResponse<Signal>> {
    // Get paginated mock signals from the service
    const { data, total } = await this.mockSignalsService.generateMockSignals(
      paginationDto.page,
      paginationDto.limit
    );
    
    // Invalidate the cache since new mock signals were generated
    await this.signalsService.invalidateCache();
    
    return {
      data,
      metadata: {
        total,
        page: paginationDto.page,
        limit: paginationDto.limit
      }
    };
  }

  @Get('/top')
  async getTopSignals(@Query('limit') limit: number = 10): Promise<Signal[]> {
    return await this.signalsService.getTopSignals(limit);
  }

  @Get('/latest')
  async getLatestSignals(@Query('limit') limit: number = 10): Promise<Signal[]> {
    return await this.signalsService.getLatestSignals(limit);
  }

  @Get('/:id')
  async getOneSignalById(@Param('id') id: number): Promise<Signal> {
    return await this.signalsService.getOneSignalById(id);
  }

  @Put('/:id/restore')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async restoreSignal(@Param('id') id: number): Promise<Signal> {
    return await this.signalsService.restoreSignal(id);
  }

  @Put('/:id/extend')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async extendSignal(@Param('id') id: number): Promise<Signal> {
    return await this.signalsService.extendSignal(id);
  }
}