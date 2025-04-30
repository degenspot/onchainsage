import { Controller, Get, Param, Query } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger"
import type { MockSignalService } from "./mock-signals.service"
import type { Signal } from "./entities/signal.entity"
import type { PaginatedResponse, PaginationDto } from "./interfaces/pagination.dto"
import { TopSignalsDto } from "./dtos/top-signals.dto"
import { SignalsService } from "./signals.service"

@ApiTags("Signals")
@Controller("signals")
export class SignalsController {
  constructor(
    private readonly signalsService: SignalsService,
    private readonly mockSignalsService: MockSignalService,
  ) {}

  @Get()
  // @ApiOperation({ summary: 'Get all signals with pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated signals' })
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

  @Get('top')
  @ApiOperation({ 
    summary: 'Get top-ranked signals',
    description: 'Returns signals ranked by a combination of reputation and recency'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns paginated top signals ranked by reputation and recency' 
  })
  async getTopSignals(@Query() query: TopSignalsDto): Promise<PaginatedResponse<Signal>> {
    const { data, total } = await this.signalsService.getTopSignals(
      query.page,
      query.limit,
      query.filter
    );
    
    return {
      data,
      metadata: {
        total,
        page: query.page,
        limit: query.limit
      }
    };
  }

  @Get('mock')
  @ApiOperation({ summary: 'Get mock signals with pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated mock signals' })
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

  @Get('/:id')
  @ApiOperation({ summary: 'Get a signal by ID' })
  @ApiResponse({ status: 200, description: 'Returns a single signal' })
  @ApiResponse({ status: 404, description: 'Signal not found' })
  async getOneSignalById(@Param("id") id: number): Promise<Signal> {
    return await this.mockSignalsService.getMockSignalById(id);
  }
}
