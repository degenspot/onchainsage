import { Injectable, type CanActivate, type ExecutionContext, UnauthorizedException, Logger } from "@nestjs/common"
import type { ConfigService } from "@nestjs/config"
import type { Observable } from "rxjs"

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name)
  private apiKey: string

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>("API_KEY")

    if (!this.apiKey) {
      this.logger.warn("API_KEY is not set in environment variables")
    }
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest()
    const providedApiKey = request.headers["x-api-key"]

    if (!this.apiKey) {
      // If API_KEY is not set, allow access (for development)
      this.logger.warn("API_KEY not set, allowing access")
      return true
    }

    if (!providedApiKey) {
      throw new UnauthorizedException("API key is missing")
    }

    if (providedApiKey !== this.apiKey) {
      throw new UnauthorizedException("Invalid API key")
    }

    return true
  }
}
