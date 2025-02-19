import { Injectable } from '@nestjs/common';

@Injectable()
export class SignalsService {
  findAll() {
    return `This action returns all trading signals`;
  }
}
