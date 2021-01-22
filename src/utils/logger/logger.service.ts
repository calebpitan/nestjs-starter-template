import { Injectable, Logger, LoggerService, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger implements LoggerService {
  private readonly logger: LoggerService;
  private context!: string;
  constructor() {
    this.logger = new Logger();
  }

  log(message: any, context: string = this.context) {
    this.logger.log(message, context);
    return this;
  }

  warn(message: any, context: string = this.context) {
    this.logger.warn(message, context);
    return this;
  }

  error(message: string, trace?: string, context: string = this.context) {
    this.logger.error(message, trace, context);
    return this;
  }

  setContext(context: string) {
    this.context = context;
    return this;
  }
}
