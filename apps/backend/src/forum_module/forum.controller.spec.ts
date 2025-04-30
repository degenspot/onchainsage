/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { ForumController } from './forum.controller';
import { ForumService } from './forum.service';
import { ThrottlerModule } from '@nestjs/throttler';

describe('ForumController', () => {
  let controller: ForumController;
  let service: Partial<ForumService>;

  beforeEach(async () => {
    service = {
      createThread: jest.fn(),
      createReply: jest.fn(),
      reportPost: jest.fn(),
      listReports: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot()],
      controllers: [ForumController], 
      providers: [{ provide: ForumService, useValue: service }],
    }).compile();

    controller = module.get<ForumController>(ForumController);
  });

  it('should call createThread', () => {
    const dto = { content: 'hello' };
    controller.createThread('sig1', dto as any, { user: { id: 'u1' } });
    expect(service.createThread).toHaveBeenCalledWith('sig1', 'u1', 'hello');
  });

  it('should call createReply', () => {
    const dto = { content: 'reply' };
    controller.createReply('t1', dto as any, { user: { id: 'u2' } });
    expect(service.createReply).toHaveBeenCalledWith('t1', 'u2', 'reply');
  });

  it('should call report', () => {
    const dto = { reason: 'spam' };
    controller.report('p1', dto as any, { user: { id: 'u3' } });
    expect(service.reportPost).toHaveBeenCalledWith('p1', 'u3', 'spam');
  });

  it('should call listReports', () => {
    controller.listReports();
    expect(service.listReports).toHaveBeenCalled();
  });
});
