import { Controller, Post, Body, Req, Res, HttpStatus, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from 'express';
import { User } from './entities/user.entities';
import { PreferencesDto } from './dtos/preferences.dto';
import { StarknetAuthGuard } from './guards/startnet.auth.guard';
import { AuthenticatedRequest } from './interface/user.interface';


@Controller('users')
export class UserController {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  @Post('preferences')
  @UseGuards(StarknetAuthGuard)
  async updatePreferences(
    @Body() preferencesDto: PreferencesDto,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    try {
      // Ensure the user object exists
      if (!req.user || !req.user.walletAddress) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const userId = req.user.walletAddress;

      // Find user or create if doesn't exist
      let user = await this.userRepository.findOne({ where: { id: userId } });
      
      if (!user) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: 'User not found',
        });
      }

      // Update preferences
      const updatedPreferences = { ...user.preferences, ...preferencesDto };

      // Save to database
      user.preferences = updatedPreferences;
      await this.userRepository.save(user);

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Preferences updated successfully',
        data: { preferences: user.preferences },
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to update preferences',
        error: error.message,
      });
    }
  }
}
