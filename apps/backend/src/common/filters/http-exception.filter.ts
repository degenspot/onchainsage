import { type ExceptionFilter, Catch, type ArgumentsHost, HttpException, HttpStatus, Logger } from "@nestjs/common"
import type { Request, Response } from "express"

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = "Internal server error"
    let error = "Internal Server Error"

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse()

      if (typeof exceptionResponse === "object") {
        message = (exceptionResponse as any).message || message
        error = (exceptionResponse as any).error || error
      } else {
        message = exceptionResponse
      }
    } else if (exception instanceof Error) {
      message = exception.message
      this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack)
    } else {
      this.logger.error("Unhandled exception", exception)
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error,
      message,
    })
  }
}
