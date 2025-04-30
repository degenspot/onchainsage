import { PartialType } from '@nestjs/mapped-types';
import { CreateReputationDto } from './create-reputation.dto';

export class UpdateReputationDto extends PartialType(CreateReputationDto) {}
