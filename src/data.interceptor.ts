import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface RawResponse extends Record<string, any> {
  success?: boolean;
  message?: string;
}

export interface TransformedResponse<T = Record<string, any>> extends RawResponse {
  data: T | null;
}

type Response<T = Record<string, any>> = TransformedResponse<T> | RawResponse;

@Injectable()
export class DataInterceptor implements NestInterceptor<RawResponse, Response> {
  async intercept(
    _context: ExecutionContext,
    next: CallHandler<RawResponse>,
  ): Promise<Observable<Response>> {
    const handlerResponse = await next.handle();
    const transformedResponse = handlerResponse.pipe<Response>(
      map<RawResponse, Response>(result => {
        if (!result) return result;
        const { message, success, ...rest } = result;
        const data = Object.keys(rest).length > 0 ? rest : null; // If object is empty return null
        const transformedResult: TransformedResponse = { data, success, message };
        return transformedResult;
      }),
    );
    return transformedResponse;
  }
}
