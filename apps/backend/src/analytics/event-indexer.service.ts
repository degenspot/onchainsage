import { Injectable, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { ethers } from "ethers"
import { BigNumber } from "@ethersproject/bignumber"
import type { Provider } from "@ethersproject/providers"
import { SmartContractEvent, EventType } from "./entities/smart-contract-event.entity"

@Injectable()
export class EventIndexerService {
  private readonly logger = new Logger(EventIndexerService.name)
  private provider: ethers.JsonRpcProvider;

  constructor(
    @InjectRepository(SmartContractEvent)
    private eventRepository: Repository<SmartContractEvent>,
  ) {
    this.provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
    this.provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
  }

  /**
   * Index events from a specific contract
   * @param contractAddress 
   * @param abi The ABI of the contract
   * @param fromBlock 
   */
  async indexContractEvents(contractAddress: string, abi: any[], fromBlock: number): Promise<void> {
    try {
      this.logger.log(`Indexing events from contract ${contractAddress} from block ${fromBlock}`)

      const contract = new ethers.Contract(contractAddress, abi, this.provider as ethers.JsonRpcProvider)
      const latestBlock = await this.provider.getBlockNumber()

      // Define event filters based on your contract's events
      const stakeFilter = contract.filters.Staked()
      const unstakeFilter = contract.filters.Unstaked()
      const signalFilter = contract.filters.SignalCreated()
      const voteFilter = contract.filters.VoteCast()

      // Fetch events in batches to avoid RPC limitations
      const batchSize = 2000
      for (let i = fromBlock; i < latestBlock; i += batchSize) {
        const toBlock = Math.min(i + batchSize - 1, latestBlock)

        // Fetch events in parallel
        const [stakeEvents, unstakeEvents, signalEvents, voteEvents] = await Promise.all([
          contract.queryFilter(stakeFilter, i, toBlock),
          contract.queryFilter(unstakeFilter, i, toBlock),
          contract.queryFilter(signalFilter, i, toBlock),
          contract.queryFilter(voteFilter, i, toBlock),
        ])

        // Process events
        await this.processEvents(stakeEvents.filter((e): e is ethers.EventLog => e instanceof ethers.EventLog), EventType.STAKE)
        await this.processEvents(unstakeEvents.filter((e): e is ethers.EventLog => e instanceof ethers.EventLog), EventType.UNSTAKE)
        await this.processEvents(signalEvents.filter((e): e is ethers.EventLog => e instanceof ethers.EventLog), EventType.SIGNAL)
        await this.processEvents(voteEvents.filter((e): e is ethers.EventLog => e instanceof ethers.EventLog), EventType.VOTE)

        this.logger.log(`Indexed events from blocks ${i} to ${toBlock}`)
      }

      this.logger.log(`Completed indexing events from contract ${contractAddress}`)
    } catch (error) {
      this.logger.error(`Error indexing events: ${error.message}`, error.stack)
      throw error
    }
  }

  /**
   * Process and store events in the database
   * @param events The events to process
   * @param eventType The type of event
   */
  private async processEvents(events: ethers.EventLog[], eventType: EventType): Promise<void> {
    if (events.length === 0) return

    try {
      const eventEntities = await Promise.all(
        events.map(async (event) => {
          const block = await event.getBlock()

          return this.eventRepository.create({
            address: event.address,
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            timestamp: new Date(block.timestamp * 1000), // Convert to milliseconds
            eventType,
            data: {
              ...event.args,
              // Convert BigNumber to string to avoid JSON serialization issues
              ...Object.fromEntries(
                Object.entries(event.args || {})
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  .filter(([_, value]) => BigNumber.isBigNumber(value))
                  .map(([key, value]) => [key, BigNumber.from(value).toString()]),
              ),
            },
            processed: false,
          })
        }),
      )

      await this.eventRepository.save(eventEntities)
      this.logger.log(`Saved ${eventEntities.length} ${eventType} events to database`)
    } catch (error) {
      this.logger.error(`Error processing ${eventType} events: ${error.message}`, error.stack)
      throw error
    }
  }
}
