// import { Test, TestingModule } from '@nestjs/testing';
// import { Repository } from 'typeorm';
// import { getRepositoryToken } from '@nestjs/typeorm';
// import { User } from './entities/user.entity';
// import { RedisService } from '../redis/redis.service';
// import { StarknetAuthGuard } from './guards/startnet.auth.guard';
// import { PreferencesDto } from './dtos/preferences.dto';
// import { AuthenticatedRequest } from './interface/user.interface';
// import { HttpStatus } from '@nestjs/common';
// import { UserController } from './userController';

// describe('UserController', () => {
//   let controller: UserController;
//   let userRepository: Repository<User>;
//   let redisService: RedisService;

//   beforeEach(async () => {
//     const mockUserRepository = {
//       findOne: jest.fn(),
//       save: jest.fn(),
//     };

//     const mockRedisService = {
//       invalidateUserPreferences: jest.fn(),
//     };

//     const module: TestingModule = await Test.createTestingModule({
//       controllers: [UserController],
//       providers: [
//         { provide: getRepositoryToken(User), useValue: mockUserRepository },
//         { provide: RedisService, useValue: mockRedisService },
//       ],
//     }).compile();

//     controller = module.get<UserController>(UserController);
//     userRepository = module.get<Repository<User>>(getRepositoryToken(User));
//     redisService = module.get<RedisService>(RedisService);
//   });

//   it('should be defined', () => {
//     expect(controller).toBeDefined();
//   });

//   describe('updatePreferences', () => {
//     let mockReq: Partial<AuthenticatedRequest>;
//     let mockRes: any;
//     let mockPreferencesDto: PreferencesDto;

//     beforeEach(() => {
//       mockPreferencesDto = { theme: 'dark', notifications: true };

//       mockReq = {
//         user: {
//           walletAddress: 'user123',
//         },
//       };

//       mockRes = {
//         status: jest.fn().mockReturnThis(),
//         json: jest.fn(),
//       };
//     });

//     it('should return 401 if user is not authenticated', async () => {
//       mockReq.user = null;

//       await controller.updatePreferences(
//         mockPreferencesDto,
//         mockReq as AuthenticatedRequest,
//         mockRes,
//       );

//       expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
//       expect(mockRes.json).toHaveBeenCalledWith({
//         success: false,
//         message: 'Unauthorized',
//       });
//     });

//     it('should return 404 if user is not found', async () => {
//       (userRepository.findOne as jest.Mock).mockResolvedValue(null);

//       await controller.updatePreferences(
//         mockPreferencesDto,
//         mockReq as AuthenticatedRequest,
//         mockRes,
//       );

//       expect(userRepository.findOne).toHaveBeenCalledWith({
//         where: { id: 'user123' },
//       });
//       expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
//       expect(mockRes.json).toHaveBeenCalledWith({
//         success: false,
//         message: 'User not found',
//       });
//     });

//     it('should update user preferences and return 200', async () => {
//       const mockUser = {
//         id: 'user123',
//         preferences: { theme: 'light', notifications: false },
//       };

//       (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
//       (userRepository.save as jest.Mock).mockResolvedValue({
//         ...mockUser,
//         preferences: { theme: 'dark', notifications: true },
//       });

//       await controller.updatePreferences(
//         mockPreferencesDto,
//         mockReq as AuthenticatedRequest,
//         mockRes,
//       );

//       expect(userRepository.findOne).toHaveBeenCalledWith({
//         where: { id: 'user123' },
//       });
//       expect(userRepository.save).toHaveBeenCalledWith({
//         ...mockUser,
//         preferences: { theme: 'dark', notifications: true },
//       });
//       expect(redisService.invalidateUserPreferences).toHaveBeenCalledWith(
//         'user123',
//       );
//       expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
//       expect(mockRes.json).toHaveBeenCalledWith({
//         success: true,
//         message: 'Preferences updated successfully',
//         data: { preferences: { theme: 'dark', notifications: true } },
//       });
//     });
//   });
// });

import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { RedisService } from '../redis/redis.service';
import { PreferencesDto } from './dtos/preferences.dto';
import { AuthenticatedRequest } from './interface/user.interface';
import { HttpStatus } from '@nestjs/common';
import { UserController } from './userController';

describe('UserController', () => {
  let controller: UserController;
  let userRepository: Repository<User>;
  let redisService: RedisService;

  beforeEach(async () => {
    const mockUserRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const mockRedisService = {
      invalidateUserPreferences: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    redisService = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('updatePreferences', () => {
    let mockReq: Partial<AuthenticatedRequest>;
    let mockRes: any;
    let mockPreferencesDto: PreferencesDto;

    beforeEach(() => {
      mockPreferencesDto = { theme: 'dark', notifications: true };

      mockReq = {
        user: {
          id: 'user123',
          walletAddress: 'user123',
        },
      };

      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it('should return 401 if user is not authenticated', async () => {
      mockReq.user = null;

      await controller.updatePreferences(
        mockPreferencesDto,
        mockReq as AuthenticatedRequest,
        mockRes,
      );

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized',
      });
    });

    it('should return 404 if user is not found', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(null);

      await controller.updatePreferences(
        mockPreferencesDto,
        mockReq as AuthenticatedRequest,
        mockRes,
      );

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user123' },
      });
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
      });
    });

    it('should update user preferences and return 200', async () => {
      const mockUser = {
        id: 'user123',
        preferences: { theme: 'light', notifications: false },
      };

      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.save as jest.Mock).mockResolvedValue({
        ...mockUser,
        preferences: { theme: 'dark', notifications: true },
      });

      await controller.updatePreferences(
        mockPreferencesDto,
        mockReq as AuthenticatedRequest,
        mockRes,
      );

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user123' },
      });
      expect(userRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        preferences: { theme: 'dark', notifications: true },
      });
      expect(redisService.invalidateUserPreferences).toHaveBeenCalledWith(
        'user123',
      );
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Preferences updated successfully',
        data: { preferences: { theme: 'dark', notifications: true } },
      });
    });
  });
});
