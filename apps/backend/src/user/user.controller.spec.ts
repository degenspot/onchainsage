import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;
  let userService: any;

  beforeEach(async () => {
    userService = {
      create: jest.fn().mockResolvedValue({
        id: '1',
        name: 'Abdul',
        email: 'abdul@gmail.com',
      }),
      findAll: jest.fn().mockResolvedValue([
        {
          id: '1',
          name: 'Abdul',
          email: 'abdul@gmail.com',
        },
        {
          id: '2',
          name: 'Malik',
          email: 'malik@gmail.com',
        },
      ]),
      findOne: jest.fn().mockResolvedValue({
        id: '1',
        name: 'Abdul',
        email: 'abdul@gmail.com',
      }),
      update: jest.fn().mockResolvedValue({
        id: '1',
        name: 'Abdul Updated',
        email: 'abdul@gmail.com',
      }),
      remove: jest
        .fn()
        .mockResolvedValue('The user with id 1 has been removed'),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: userService }],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return a created user', async () => {
    const userDto = { name: 'Abdul', email: 'abdul@gmail.com' };
    const result = await controller.create(userDto);

    expect(result).toEqual({
      id: '1',
      name: 'Abdul',
      email: 'abdul@gmail.com',
    });
    expect(userService.create).toHaveBeenCalledWith(userDto);
    expect(userService.create).toHaveBeenCalledTimes(1);
  });

  it('should return all users', async () => {
    const result = await controller.findAll();

    expect(result).toEqual([
      { id: '1', name: 'Abdul', email: 'abdul@gmail.com' },
      { id: '2', name: 'Malik', email: 'malik@gmail.com' },
    ]);
    expect(userService.findAll).toHaveBeenCalledTimes(1);
  });

  it('should return a single user', async () => {
    const result = await controller.findOne('1');

    expect(result).toEqual({
      id: '1',
      name: 'Abdul',
      email: 'abdul@gmail.com',
    });
    expect(userService.findOne).toHaveBeenCalledWith(1); // Nest auto-converts params to numbers
    expect(userService.findOne).toHaveBeenCalledTimes(1);
  });

  it('should update a user', async () => {
    const updateDto = { name: 'Abdul Updated', email: 'abdul@gmail.com' };
    const result = await controller.update('1', updateDto);

    expect(result).toEqual({
      id: '1',
      name: 'Abdul Updated',
      email: 'abdul@gmail.com',
    });
    expect(userService.update).toHaveBeenCalledWith(1, updateDto);
    expect(userService.update).toHaveBeenCalledTimes(1);
  });

  it('should remove a user', async () => {
    const result = await controller.remove('1');

    expect(result).toEqual('The user with id 1 has been removed');
    expect(userService.remove).toHaveBeenCalledWith(1);
    expect(userService.remove).toHaveBeenCalledTimes(1);
  });
});
