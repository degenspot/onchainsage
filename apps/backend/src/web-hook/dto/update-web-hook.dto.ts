import { PartialType } from '@nestjs/swagger';
import { CreateWebHookDto } from './create-web-hook.dto';

export class UpdateWebHookDto extends PartialType(CreateWebHookDto) {}
