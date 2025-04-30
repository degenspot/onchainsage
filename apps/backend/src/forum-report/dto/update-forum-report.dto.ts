import { PartialType } from '@nestjs/mapped-types';
import { CreateForumReportDto } from './create-forum-report.dto';

export class UpdateForumReportDto extends PartialType(CreateForumReportDto) {}
