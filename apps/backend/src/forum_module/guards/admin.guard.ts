/* eslint-disable prettier/prettier */
import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;
    if (!user || !user.isAdmin) {
      throw new ForbiddenException('Admins only');
    }
    return true;
  }
}
