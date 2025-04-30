import { IsString, IsNotEmpty } from 'class-validator';

export class CreateReplyDto {
  @IsString()
  @IsNotEmpty()
  threadId: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}
