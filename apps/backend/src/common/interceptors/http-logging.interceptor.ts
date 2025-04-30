import { Injectable, type NestInterceptor, type ExecutionContext, type CallHandler, Logger } from "@nestjs/common"
import type { Observable } from "rxjs"
import { tap } from "rxjs/operators"

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("HTTP")

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest()
    const { method, url, body, ip } = req
    const userAgent = req.get("user-agent") || ""

    const now = Date.now()

    return next.handle().pipe(
      tap({
        next: (val) => {
          const response = context.switchToHttp().getResponse()
          const { statusCode } = response
          const contentLength = response.get("content-length") || 0

          this.logger.log(
            `${method} ${url} ${statusCode} ${contentLength} - ${userAgent} ${ip} - ${Date.now() - now}ms`,
          )
        },
        error: (err) => {
          const { statusCode } = err

          this.logger.error(`${method} ${url} ${statusCode} - ${userAgent} ${ip} - ${Date.now() - now}ms`)
        },
      }),
    )
  }
}
