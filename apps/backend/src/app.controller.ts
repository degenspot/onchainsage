// import { Controller, Get } from '@nestjs/common';
// import { AppService } from './app.service';

// @Controller()
// export class AppController {
//   constructor(private readonly appService: AppService) {}

//   @Get()
//   getHello(): string {
//     return this.appService.getHello();
//   }
// }

import { Controller, Get, Param } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
    getHello(): string {
      return this.appService.getHello();
    }

  @Get('preferences/:userId')
  async getUserPreferences(@Param('userId') userId: string) {
    return this.appService.handleUserPreferences(userId);
  }
}
