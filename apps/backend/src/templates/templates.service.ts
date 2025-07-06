import { Injectable } from '@nestjs/common';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@Injectable()
export class TemplatesService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  create(createTemplateDto: CreateTemplateDto) {
    return 'This action adds a new template';
  }

  findAll() {
    return `This action returns all templates`;
  }

  findOne(id: number) {
    return `This action returns a #${id} template`;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(id: number, updateTemplateDto: UpdateTemplateDto) {
    return `This action updates a #${id} template`;
  }

  remove(id: number) {
    return `This action removes a #${id} template`;
  }
}
