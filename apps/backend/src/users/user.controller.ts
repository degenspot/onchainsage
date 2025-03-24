import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Delete,
  Put,
  UseGuards,
  Req,
  Res,
  HttpStatus
} from '@nestjs/common';
import { Response } from 'express';
import { UserService } from './user.service';
import { StarknetAuthGuard } from './guards/startnet.auth.guard';
import { AuthenticatedRequest } from './interface/user.interface';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Get('preferences')
  @UseGuards(StarknetAuthGuard)
  async getPreferences(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id;
    return this.userService.getCachedPreferences(userId);
  }

  @Post('preferences')
  @UseGuards(StarknetAuthGuard)
  async updatePreferences(
    @Body() preferencesDto: Record<string, any>,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    try {
      if (!req.user || !req.user.walletAddress) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const updatedUser = await this.userService.updatePreferences(
        req.user.id,
        preferencesDto,
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        data: updatedUser.preferences,
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateData: Partial<any>) {
    return this.userService.update(id, updateData);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
