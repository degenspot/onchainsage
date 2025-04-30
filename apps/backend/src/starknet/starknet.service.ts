/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { Provider, Contract } from 'starknet';
import { ContractLoader } from '../utils/contract-loader';
import { config } from '../config/starknet.config';
import { Logger } from '@nestjs/common';

@Injectable()
export class StarknetService {
  private readonly logger = new Logger(StarknetService.name);
  private provider: Provider;
  private postSystemContract: Contract;
  private badgeSystemContract: Contract;
  private contractLoader: ContractLoader;

  constructor() {
    // Initialize provider based on environment (Katana local devnet)
    this.provider = new Provider({
      nodeUrl: config.starknet.nodeUrl || 'http://localhost:5050',
    });

    this.contractLoader = new ContractLoader(this.provider);
    this.initializeContracts();
  }

  private async initializeContracts() {
    try {
      // Create mock contract ABIs if files don't exist
      const postSystemAbi = []; // Empty ABI or define a minimal ABI structure
      const badgeSystemAbi = []; // Empty ABI or define a minimal ABI structure

      // Load PostSystem contract
      this.postSystemContract = await this.contractLoader.load(
        config.starknet.contracts.postSystem,
        postSystemAbi,
      );

      // Load BadgeSystem contract
      this.badgeSystemContract = await this.contractLoader.load(
        config.starknet.contracts.badgeSystem,
        badgeSystemAbi,
      );

      this.logger.log('Starknet contracts initialized successfully');
    } catch (error) {
      this.logger.error(
        `Failed to initialize Starknet contracts: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Create a new post on-chain
   * @param author Author's Starknet address
   * @param content Content of the post
   * @returns Transaction hash
   */
  async createPost(author: string, content: string): Promise<string> {
    try {
      this.logger.log(`Creating post for author: ${author}`);

      // Call the create_post function on the PostSystem contract
      const response = await this.postSystemContract.invoke('create_post', [
        author,
        content,
      ]);

      this.logger.log(
        `Post created successfully with tx hash: ${response.transaction_hash}`,
      );
      return response.transaction_hash;
    } catch (error) {
      this.logger.error(`Failed to create post: ${error.message}`);
      throw new Error(`Failed to create post: ${error.message}`);
    }
  }

  /**
   * Vote on a post on-chain
   * @param postId ID of the post to vote on
   * @param vote Vote value (positive or negative)
   * @returns Transaction hash
   */
  async votePost(postId: string, vote: number): Promise<string> {
    try {
      this.logger.log(`Voting on post ${postId} with vote: ${vote}`);

      // Call the vote_post function on the PostSystem contract
      const response = await this.postSystemContract.invoke('vote_post', [
        postId,
        vote,
      ]);

      this.logger.log(
        `Vote submitted successfully with tx hash: ${response.transaction_hash}`,
      );
      return response.transaction_hash;
    } catch (error) {
      this.logger.error(`Failed to vote on post: ${error.message}`);
      throw new Error(`Failed to vote on post: ${error.message}`);
    }
  }

  /**
   * Award a badge to a user on-chain
   * @param user User's Starknet address
   * @param badge Badge identifier
   * @returns Transaction hash
   */
  async awardBadge(user: string, badge: string): Promise<string> {
    try {
      this.logger.log(`Awarding badge ${badge} to user: ${user}`);

      // Call the award_badge function on the BadgeSystem contract
      const response = await this.badgeSystemContract.invoke('award_badge', [
        user,
        badge,
      ]);

      this.logger.log(
        `Badge awarded successfully with tx hash: ${response.transaction_hash}`,
      );
      return response.transaction_hash;
    } catch (error) {
      this.logger.error(`Failed to award badge: ${error.message}`);
      throw new Error(`Failed to award badge: ${error.message}`);
    }
  }

  /**
   * Get user forum data and badges from Torii
   * @param address User's Starknet address
   * @returns User forum data and badges
   */
  async getUserData(address: string): Promise<any> {
    try {
      this.logger.log(`Retrieving data for user: ${address}`);

      // Query Torii for user data
      const response = await fetch(`${config.torii.url}/entity/${address}`);

      if (!response.ok) {
        throw new Error(`Torii API returned status: ${response.status}`);
      }

      const userData = await response.json();
      return userData;
    } catch (error) {
      this.logger.error(`Failed to retrieve user data: ${error.message}`);
      throw new Error(`Failed to retrieve user data: ${error.message}`);
    }
  }
}
