import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RateLimitViolation } from '../src/entities/rate-limit-violation.entity';
import { getThrottlerConfig } from '../src/config/throttler.config';
import { ThrottlerModule } from '@nestjs/throttler';

describe('Rate Limiting (e2e)', () => {
  let app: INestApplication;
  
  beforeAll(async () => {
    // Create a test module with in-memory database
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          // Override with test config
          load: [() => ({
            THROTTLE_TTL: 1,
            THROTTLE_LIMIT: 2, // Very restrictive limit for testing
          })],
        }),
        TypeOrmModule.forRootAsync({
          useFactory: () => ({
            type: 'sqlite',
            database: ':memory:',
            entities: [RateLimitViolation],
            synchronize: true,
          }),
        }),
        TypeOrmModule.forFeature([RateLimitViolation]),
        ThrottlerModule.forRoot({
          ttl: 1,
          limit: 2,
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Rate limiting on protected routes', () => {
    const testProtectedRoutes = [
      { path: '/signal', method: 'post' },
      { path: '/vote', method: 'post' },
      { path: '/webhook', method: 'post' },
    ];

    testProtectedRoutes.forEach(route => {
      it(`should allow requests within rate limit for ${route.method.toUpperCase()} ${route.path}`, async () => {
        // First request - should succeed
        await request(app.getHttpServer())
          [route.method](route.path)
          .expect(res => {
            // This is a test so we might get different status codes depending on the route
            // implementation but it should not be 429
            expect(res.status).not.toBe(429);
          });
        
        // Second request - should still succeed
        await request(app.getHttpServer())
          [route.method](route.path)
          .expect(res => {
            expect(res.status).not.toBe(429);
          });
      });

      it(`should block requests exceeding rate limit for ${route.method.toUpperCase()} ${route.path}`, async () => {
        // First two requests
        await request(app.getHttpServer())[route.method](route.path);
        await request(app.getHttpServer())[route.method](route.path);
        
        // Third request in quick succession - should be rate limited
        await request(app.getHttpServer())
          [route.method](route.path)
          .expect(429);
        
        // Wait for ttl to expire (2 seconds to be safe)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // After waiting, should work again
        await request(app.getHttpServer())
          [route.method](route.path)
          .expect(res => {
            expect(res.status).not.toBe(429);
          });
      });
      
      it(`should track wallet address when provided for ${route.method.toUpperCase()} ${route.path}`, async () => {
        const wallet1 = '0xWallet1';
        const wallet2 = '0xWallet2';
        
        // First wallet can make 2 requests
        await request(app.getHttpServer())
          [route.method](route.path)
          .set('x-wallet-address', wallet1);
          
        await request(app.getHttpServer())
          [route.method](route.path)
          .set('x-wallet-address', wallet1);
        
        // Third request from first wallet should be blocked
        await request(app.getHttpServer())
          [route.method](route.path)
          .set('x-wallet-address', wallet1)
          .expect(429);
        
        // Second wallet should still be allowed
        await request(app.getHttpServer())
          [route.method](route.path)
          .set('x-wallet-address', wallet2)
          .expect(res => {
            expect(res.status).not.toBe(429);
          });
      });
    });
  });

  describe('Unprotected routes', () => {
    it('should not apply rate limiting to unprotected route', async () => {
      // Make many requests to an unprotected route - none should be rate limited
      for (let i = 0; i < 10; i++) {
        await request(app.getHttpServer())
          .get('/health')
          .expect(res => {
            expect(res.status).not.toBe(429);
          });
      }
    });
  });
});