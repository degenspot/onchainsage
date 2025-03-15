import { Controller, Get } from '@nestjs/common';
import { SignalsService } from './signals.service';
@Controller('signals')
export class SignalsController {
  constructor(
    private readonly signalsService: SignalsService,
  ) {}

  @Get()
  findAll() {
    return this.signalsService.findAll();
  }

}


