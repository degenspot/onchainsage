import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { StarknetService } from '../starknet/starknet.service';

@Controller('forum')
export class ForumController {
  private readonly logger = new Logger(ForumController.name);

  constructor(private readonly starknetService: StarknetService) {}

  @Post('posts')
  async createPost(@Body() postData: { author: string; content: string }) {
    try {
      this.logger.log(
        `Received request to create post from author: ${postData.author}`,
      );

      // Validate input
      if (!postData.author || !postData.content) {
        throw new HttpException(
          'Author and content are required',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Call StarknetService to create post on-chain
      const txHash = await this.starknetService.createPost(
        postData.author,
        postData.content,
      );

      return {
        success: true,
        message: 'Post created successfully',
        transaction_hash: txHash,
      };
    } catch (error) {
      this.logger.error(`Error creating post: ${error.message}`);
      throw new HttpException(
        `Failed to create post: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('votes')
  async votePost(@Body() voteData: { postId: string; vote: number }) {
    try {
      this.logger.log(`Received request to vote on post: ${voteData.postId}`);

      // Validate input
      if (!voteData.postId || voteData.vote === undefined) {
        throw new HttpException(
          'Post ID and vote are required',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validate vote value
      if (voteData.vote !== 1 && voteData.vote !== -1) {
        throw new HttpException(
          'Vote must be 1 (upvote) or -1 (downvote)',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Call StarknetService to vote on post on-chain
      const txHash = await this.starknetService.votePost(
        voteData.postId,
        voteData.vote,
      );

      return {
        success: true,
        message: 'Vote submitted successfully',
        transaction_hash: txHash,
      };
    } catch (error) {
      this.logger.error(`Error voting on post: ${error.message}`);
      throw new HttpException(
        `Failed to vote on post: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('badges')
  async awardBadge(@Body() badgeData: { user: string; badge: string }) {
    try {
      this.logger.log(
        `Received request to award badge ${badgeData.badge} to user: ${badgeData.user}`,
      );

      // Validate input
      if (!badgeData.user || !badgeData.badge) {
        throw new HttpException(
          'User address and badge are required',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Call StarknetService to award badge on-chain
      const txHash = await this.starknetService.awardBadge(
        badgeData.user,
        badgeData.badge,
      );

      return {
        success: true,
        message: 'Badge awarded successfully',
        transaction_hash: txHash,
      };
    } catch (error) {
      this.logger.error(`Error awarding badge: ${error.message}`);
      throw new HttpException(
        `Failed to award badge: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('users/:address')
  async getUserData(@Param('address') address: string) {
    try {
      this.logger.log(`Received request to get data for user: ${address}`);

      // Validate input
      if (!address) {
        throw new HttpException(
          'User address is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Call StarknetService to get user data from Torii
      const userData = await this.starknetService.getUserData(address);

      return {
        success: true,
        data: userData,
      };
    } catch (error) {
      this.logger.error(`Error retrieving user data: ${error.message}`);
      throw new HttpException(
        `Failed to retrieve user data: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
