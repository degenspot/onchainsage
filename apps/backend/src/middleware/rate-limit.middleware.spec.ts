import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RateLimitMiddleware } from './rate-limit.middleware';
import { RateLimitViolation } from '../entities/rate-limit-violation.entity';
import { createMock } from '@golevelup/ts-jest';
import { Request, Response } from 'express';

describe('RateLimitMiddleware', () => {
  let middleware: RateLimitMiddleware;
  let throttlerGuard: ThrottlerGuard;
  let repo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitMiddleware,
        {
          provide: ThrottlerGuard,
          useValue: {
            handleRequest: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RateLimitViolation),
          useValue: {
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    middleware = module.get<RateLimitMiddleware>(RateLimitMiddleware);
    throttlerGuard = module.get<ThrottlerGuard>(ThrottlerGuard);
    repo = module.get(getRepositoryToken(RateLimitViolation));
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  describe('when handling a non-protected route', () => {
    it('should call next without throttling', async () => {
      const req = createMock<Request>({
        path: '/unprotected',
        method: 'GET',
      });
      const res = createMock<Response>();
      const next = jest.fn();

      await middleware.use(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(throttlerGuard.handleRequest).not.toHaveBeenCalled();
    });
  });

  describe('when handling a protected route', () => {
    it('should apply throttling and continue if limit not exceeded', async () => {
      const req = createMock<Request>({
        path: '/signal',
        method: 'POST',
        ip: '192.168.1.1',
        headers: {},
      });
      const res = createMock<Response>();
      const next = jest.fn();

      (throttlerGuard.handleRequest as jest.Mock).mockResolvedValueOnce(true);

      await middleware.use(req, res, next);

      expect(throttlerGuard.handleRequest).toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should log abuse and return 429 if limit exceeded', async () => {
      const req = createMock<Request>({
        path: '/vote',
        method: 'POST',
        ip: '192.168.1.2',
        headers: {
          'x-wallet-address': '0x123456',
        },
      });
      const res = createMock<Response>({
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      });
      const next = jest.fn();

      (throttlerGuard.handleRequest as jest.Mock).mockRejectedValueOnce(
        new ThrottlerException()
      );

      await middleware.use(req, res, next);

      expect(throttlerGuard.handleRequest).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: '192.168.1.2',
          walletAddress: '0x123456',
          endpoint: '/vote',
          method: 'POST',
        })
      );
    });

    it('should prioritize wallet address over IP when both are available', async () => {
      const req = createMock<Request>({
        path: '/webhook',
        method: 'POST',
        ip: '192.168.1.3',
        headers: {
          'x-wallet-address': '0xABCDEF',
        },
      });
      const res = createMock<Response>();
      const next = jest.fn();

      (throttlerGuard.handleRequest as jest.Mock).mockResolvedValueOnce(true);

      await middleware.use(req, res, next);

      expect(req.throttlerKey).toBe('wallet:0xABCDEF');
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should use IP address when wallet is not available', async () => {
      const req = createMock<Request>({
        path: '/signal',
        method: 'POST',
        ip: '192.168.1.4',
        headers: {},
      });
      const res = createMock<Response>();
      const next = jest.fn();

      (throttlerGuard.handleRequest as jest.Mock).mockResolvedValueOnce(true);

      await middleware.use(req, res, next);

      expect(req.throttlerKey).toBe('ip:192.168.1.4');
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('should pass through non-throttler errors', async () => {
      const req = createMock<Request>({
        path: '/signal',
        method: 'POST',
        ip: '192.168.1.5',
      });
      const res = createMock<Response>();
      const next = jest.fn();
      const testError = new Error('Test error');

      (throttlerGuard.handleRequest as jest.Mock).mockRejectedValueOnce(testError);

      await middleware.use(req, res, next);

      expect(next).toHaveBeenCalledWith(testError);
    });
  });
});