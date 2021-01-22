import { ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { DataInterceptor, RawResponse } from './data.interceptor';

describe('DataInterceptor', () => {
  let interceptor: DataInterceptor;

  function createCallHandler(response: RawResponse) {
    const observable = new Observable<RawResponse>(subscriber => subscriber.next({ ...response }));
    const next = {
      handle: jest.fn(() => observable),
    };
    return next;
  }

  beforeEach(() => {
    interceptor = new DataInterceptor();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should call #next.handle once', async () => {
    const next = createCallHandler({ success: true, message: 'some message' });
    await interceptor.intercept({} as ExecutionContext, next);
    expect(next.handle).toHaveBeenCalledTimes(1);
  });

  describe('#intercept', () => {
    it('should respond with `message` and `success` attribute when present in response', async () => {
      const next = createCallHandler({ success: true, message: 'some message' });
      const res = await interceptor.intercept({} as ExecutionContext, next);
      res.subscribe({
        next: value => {
          expect(value.message).toBeDefined();
          expect(value.success).toBeDefined();
        },
      });
    });

    it('should respond with a `null` data attribute when only meta-attributes are present', async () => {
      const next = createCallHandler({ success: true, message: 'some message' });
      const res = await interceptor.intercept({} as ExecutionContext, next);
      res.subscribe({ next: value => expect(value.data).toStrictEqual(null) });
    });

    // it('should replace mongodb _id with id when present', async () => {
    //   const next = createCallHandler({ success: true, message: 'some message', _id: 1 });
    //   const res = await interceptor.intercept({} as ExecutionContext, next);
    //   res.subscribe({
    //     next: value => {
    //       const transformedValue = value as TransformedResponse<{ id: number }>;
    //       expect(transformedValue.data!.id).toBeDefined();
    //     },
    //   });
    // });

    // it('should delete mongodb `__v` attribute when present', async () => {
    //   const next = createCallHandler({ success: true, message: 'some message', _id: 1 });
    //   const res = await interceptor.intercept({} as ExecutionContext, next);
    //   res.subscribe({
    //     next: value => {
    //       const transformedValue = value as TransformedResponse<{ id: number }>;
    //       expect(transformedValue.data!.id).toBeDefined();
    //     },
    //   });
    // });
  });
});
