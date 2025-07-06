import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { ethers } from 'ethers';
import { BigNumber } from '@ethersproject/bignumber';
import {
  SmartContractEvent,
  EventType,
} from './entities/smart-contract-event.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class EventIndexerService {
  private readonly logger = new Logger(EventIndexerService.name);
  private provider: ethers.JsonRpcProvider;

  constructor(
    @InjectRepository(SmartContractEvent)
    private eventRepository: Repository<SmartContractEvent>,
    private eventEmitter: EventEmitter2,
  ) {
    this.provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
  }

  /**
   * Index events from a specific contract
   * @param contractAddress
   * @param abi The ABI of the contract
   * @param fromBlock
   */
  async indexContractEvents(
    contractAddress: string,
    abi: any[],
    fromBlock: number,
  ): Promise<void> {
    try {
      this.logger.log(
        `Indexing events from contract ${contractAddress} from block ${fromBlock}`,
      );

      const contract = new ethers.Contract(
        contractAddress,
        abi,
        this.provider as ethers.JsonRpcProvider,
      );
      const latestBlock = await this.provider.getBlockNumber();

      // Define event filters for all monitored events
      const eventFilters = {
        [EventType.SIGNAL_REGISTERED]: contract.filters.SignalRegistered(),
        [EventType.VOTE_RESOLVED]: contract.filters.VoteResolved(),
        [EventType.REPUTATION_CHANGED]: contract.filters.ReputationChanged(),
        [EventType.STAKE]: contract.filters.Staked(),
        [EventType.UNSTAKE]: contract.filters.Unstaked(),
        [EventType.REWARD_CLAIMED]: contract.filters.RewardClaimed(),
        [EventType.SIGNAL_EXPIRED]: contract.filters.SignalExpired(),
        [EventType.SIGNAL_FLAGGED]: contract.filters.SignalFlagged(),
      };

      // Fetch events in batches to avoid RPC limitations
      const batchSize = 2000;
      for (let i = fromBlock; i < latestBlock; i += batchSize) {
        const toBlock = Math.min(i + batchSize - 1, latestBlock);

        // Fetch all events in parallel
        const eventPromises = Object.entries(eventFilters).map(
          ([eventType, filter]) =>
            contract
              .queryFilter(filter, i, toBlock)
              .then((events) => ({ eventType, events })),
        );

        const eventResults = await Promise.all(eventPromises);

        // Process all events
        for (const { eventType, events } of eventResults) {
          if (events.length > 0) {
            await this.processEvents(
              events.filter(
                (e): e is ethers.EventLog => e instanceof ethers.EventLog,
              ),
              eventType as EventType,
            );
          }
        }

        this.logger.log(`Indexed events from blocks ${i} to ${toBlock}`);
      }

      this.logger.log(
        `Completed indexing events from contract ${contractAddress}`,
      );
    } catch (error) {
      this.logger.error(`Error indexing events: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Process and store events in the database
   * @param events The events to process
   * @param eventType The type of event
   */
  private async processEvents(
    events: ethers.EventLog[],
    eventType: EventType,
  ): Promise<void> {
    if (events.length === 0) return;

    try {
      const eventEntities = await Promise.all(
        events.map(async (event) => {
          const block = await event.getBlock();

          const eventEntity = this.eventRepository.create({
            address: event.address,
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            timestamp: new Date(block.timestamp * 1000),
            eventType,
            data: {
              ...event.args,
              ...Object.fromEntries(
                Object.entries(event.args || {})
                  .filter(([, value]) => BigNumber.isBigNumber(value))
                  .map(([key, value]) => [
                    key,
                    BigNumber.from(value).toString(),
                  ]),
              ),
            },
            processed: false,
          });

          // Save the event
          const savedEvent = await this.eventRepository.save(eventEntity);

          // Emit an internal event for notification processing
          this.eventEmitter.emit('onchain.event', {
            eventType,
            eventData: savedEvent,
            timestamp: savedEvent.timestamp,
          });

          return savedEvent;
        }),
      );

      this.logger.log(
        `Saved ${eventEntities.length} ${eventType} events to database`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing ${eventType} events: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
