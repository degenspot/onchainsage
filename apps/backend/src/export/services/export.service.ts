import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ExportQueryDto } from '../dto/export-query.dto';
import { ExportHistory } from '../entities/export-history.entity';
import { SignalHistory } from '../../signal/entities/signal-history.entity';
import { VotingHistory } from '../../voting/entities/voting-history.entity';
import { StakingHistory } from '../../staking/entities/staking-history.entity';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-stringify';
import * as os from 'os';

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(ExportHistory)
    private exportHistoryRepository: Repository<ExportHistory>,
    @InjectRepository(SignalHistory)
    private signalHistoryRepository: Repository<SignalHistory>,
    @InjectRepository(VotingHistory)
    private votingHistoryRepository: Repository<VotingHistory>,
    @InjectRepository(StakingHistory)
    private stakingHistoryRepository: Repository<StakingHistory>,
  ) {}

  async exportSignalHistory(
    userId: string,
    query: ExportQueryDto,
  ): Promise<{ filePath: string; fileName: string }> {
    const { startDate, endDate, limit, offset, format } = query;

    const where: any = { userId };

    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    }

    const signals = await this.signalHistoryRepository.find({
      where,
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });

    if (!signals.length) {
      throw new NotFoundException('No signal history found');
    }

    // Save export record
    await this.saveExportRecord(userId, 'signal', format, query);

    return this.generateFile(signals, format, 'signal-history');
  }

  async exportVotingHistory(
    userId: string,
    query: ExportQueryDto,
  ): Promise<{ filePath: string; fileName: string }> {
    const { startDate, endDate, limit, offset, format } = query;

    const where: any = { userId };

    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    }

    const votes = await this.votingHistoryRepository.find({
      where,
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
      // Include deleted/invalidated votes
      withDeleted: true,
    });

    if (!votes.length) {
      throw new NotFoundException('No voting history found');
    }

    // Save export record
    await this.saveExportRecord(userId, 'voting', format, query);

    return this.generateFile(votes, format, 'voting-history');
  }

  async exportStakingHistory(
    userId: string,
    query: ExportQueryDto,
  ): Promise<{ filePath: string; fileName: string }> {
    const { startDate, endDate, limit, offset, format } = query;

    const where: any = { userId };

    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    }

    const stakings = await this.stakingHistoryRepository.find({
      where,
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });

    if (!stakings.length) {
      throw new NotFoundException('No staking history found');
    }

    // Save export record
    await this.saveExportRecord(userId, 'staking', format, query);

    return this.generateFile(stakings, format, 'staking-history');
  }

  private async saveExportRecord(
    userId: string,
    type: 'signal' | 'voting' | 'staking',
    format: 'csv' | 'json',
    parameters: any,
  ): Promise<void> {
    const exportRecord = this.exportHistoryRepository.create({
      userId,
      type,
      format,
      parameters,
    });

    await this.exportHistoryRepository.save(exportRecord);
  }

  private async generateFile(
    data: any[],
    format: 'csv' | 'json',
    filePrefix: string,
  ): Promise<{ filePath: string; fileName: string }> {
    const fileName = `${filePrefix}-${Date.now()}.${format}`;
    const tmpDir = os.tmpdir();
    const filePath = path.join(tmpDir, fileName);

    if (format === 'json') {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } else {
      // CSV generation
      return new Promise((resolve, reject) => {
        // Get headers from the first object
        const headers = Object.keys(data[0]);

        const stringifier = csv.stringify({ header: true, columns: headers });
        const writeStream = fs.createWriteStream(filePath);

        writeStream.on('finish', () => {
          resolve({ filePath, fileName });
        });

        writeStream.on('error', (err) => {
          reject(
            new BadRequestException(`Failed to generate CSV: ${err.message}`),
          );
        });

        stringifier.pipe(writeStream);
        data.forEach((row) => stringifier.write(row));
        stringifier.end();
      });
    }

    return { filePath, fileName };
  }
}
