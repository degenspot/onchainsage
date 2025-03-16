import { Injectable, Logger } from '@nestjs/common';


@Injectable()
export class AppService {
  constructor() {}

  public getHello(): string {
    return 'Hello World!';
  }
}
