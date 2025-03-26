import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { SignalsService } from './signals.service'; 
import { MockSignalService } from './mock-signals.service'; 
import { TradingSignal } from '../interfaces/trading-signal.interface';
import { PaginatedResponse, PaginationDto } from '../interfaces/pagination.dto';

@Controller('signals')
export class SignalsController {
  constructor(
    private readonly signalsService: SignalsService,
    private readonly mockSignalsService: MockSignalService
  ) {}

  @Get()
  async findAll(@Query() paginationDto: PaginationDto): Promise<PaginatedResponse<TradingSignal>> {
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
  async getMockSignals(@Query() paginationDto: PaginationDto): Promise<PaginatedResponse<TradingSignal>> {
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

  @Get('/:id')
  async getOneSignalById(@Param("id") id: string): Promise<TradingSignal> {
    return await this.mockSignalsService.getMockSignalById(id);
  }
}