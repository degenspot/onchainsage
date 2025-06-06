import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
  Res,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ExportService } from '../services/export.service';
import { ExportQueryDto } from '../dto/export-query.dto';
import { WalletAuthGuard } from '../../auth/guards/wallet-auth.guard';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';

@ApiTags('Export')
@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('signal-history')
  @UseGuards(WalletAuthGuard)
  @ApiBearerAuth()
  @RateLimit({ points: 5, duration: 60 }) // 5 requests per minute
  @ApiOperation({ summary: 'Export user signal history' })
  @ApiQuery({ name: 'format', enum: ['csv', 'json'], required: false })
  @ApiQuery({ name: 'startDate', type: String, required: false })
  @ApiQuery({ name: 'endDate', type: String, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'offset', type: Number, required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Signal history exported successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No signal history found',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async exportSignalHistory(
    @Req() req,
    @Res() res: Response,
    @Query() query: ExportQueryDto,
  ) {
    const userId = req.user.id;
    const { filePath, fileName } = await this.exportService.exportSignalHistory(
      userId,
      query,
    );

    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.setHeader(
      'Content-Type',
      query.format === 'csv' ? 'text/csv' : 'application/json',
    );

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    // Clean up temp file after sending
    fileStream.on('end', () => {
      fs.unlinkSync(filePath);
    });
  }

  @Get('voting-history')
  @UseGuards(WalletAuthGuard)
  @ApiBearerAuth()
  @RateLimit({ points: 5, duration: 60 }) // 5 requests per minute
  @ApiOperation({ summary: 'Export user voting history' })
  @ApiQuery({ name: 'format', enum: ['csv', 'json'], required: false })
  @ApiQuery({ name: 'startDate', type: String, required: false })
  @ApiQuery({ name: 'endDate', type: String, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'offset', type: Number, required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Voting history exported successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No voting history found',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async exportVotingHistory(
    @Req() req,
    @Res() res: Response,
    @Query() query: ExportQueryDto,
  ) {
    const userId = req.user.id;
    const { filePath, fileName } = await this.exportService.exportVotingHistory(
      userId,
      query,
    );

    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.setHeader(
      'Content-Type',
      query.format === 'csv' ? 'text/csv' : 'application/json',
    );

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    // Clean up temp file after sending
    fileStream.on('end', () => {
      fs.unlinkSync(filePath);
    });
  }

  @Get('staking-history')
  @UseGuards(WalletAuthGuard)
  @ApiBearerAuth()
  @RateLimit({ points: 5, duration: 60 }) // 5 requests per minute
  @ApiOperation({ summary: 'Export user staking history' })
  @ApiQuery({ name: 'format', enum: ['csv', 'json'], required: false })
  @ApiQuery({ name: 'startDate', type: String, required: false })
  @ApiQuery({ name: 'endDate', type: String, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'offset', type: Number, required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Staking history exported successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No staking history found',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async exportStakingHistory(
    @Req() req,
    @Res() res: Response,
    @Query() query: ExportQueryDto,
  ) {
    const userId = req.user.id;
    const { filePath, fileName } =
      await this.exportService.exportStakingHistory(userId, query);

    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.setHeader(
      'Content-Type',
      query.format === 'csv' ? 'text/csv' : 'application/json',
    );

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    // Clean up temp file after sending
    fileStream.on('end', () => {
      fs.unlinkSync(filePath);
    });
  }
}
