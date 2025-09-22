import { test, expect, describe, mock, expectTypeOf } from "bun:test";
import {
  decorate,
  decorateSync,
  type Decorator,
  type DecoratorSync,
  type Descriptor,
  type DescriptorSync,
} from "./decorate.js";

describe("Decorate", () => {
  test("should apply multiple async decorators to functions sequentially", async () => {
    type A = Descriptor<[number], Promise<{ n: number }>>;

    const fn: A = async (n: number) => ({
      n,
    });
    const add1: Decorator<A> = (descriptor) => async (n) =>
      await descriptor(n + 1);
    const add2: Decorator<A> = (descriptor) => async (n: number) =>
      await descriptor(n + 2);
    const add3: Decorator<A> = (descriptor) => async (n: number) =>
      await descriptor(n + 3);

    const fn1 = await add1(fn);
    const fn2 = await add2(await add1(fn));
    const fn3 = await add3(await add2(await add1(fn)));
    const pfn0 = decorate(fn);
    const pfn1 = decorate(fn, add1);
    const pfn2 = decorate(fn, add1, add2);
    const pfn3 = decorate(fn, add1, add2, add3);

    expect(await fn(1)).toEqual({ n: 1 });
    expect(await fn1(1)).toEqual({ n: 2 });
    expect(await fn2(1)).toEqual({ n: 4 });
    expect(await fn3(1)).toEqual({ n: 7 });
    expect(await pfn0(1)).toEqual({ n: 1 });
    expect(await pfn1(1)).toEqual({ n: 2 });
    expect(await pfn2(1)).toEqual({ n: 4 });
    expect(await pfn3(1)).toEqual({ n: 7 });
  });

  test("should decorate class methods while preserving 'this' context", async () => {
    class A {
      base = 10;

      b = decorate(
        async function (this: A, n: number) {
          return this.base + n;
        },
        (fn) => async (n) => fn.call(this, n + 1),
        (fn) => async (n) => fn.call(this, n + 2),
        (fn) => async (n) => fn.call(this, n + 3),
      );
    }

    expect(await new A().b(1)).toEqual(17);
  });

  test("should compose async functions with multiple decorators", async () => {
    type A = Descriptor<[number], Promise<number>>;

    const increaseBy1: Decorator<A> = (descriptor) => async (n: number) =>
      await descriptor(n + 1);
    const increaseBy2: Decorator<A> = (descriptor) => async (n: number) =>
      await descriptor(n + 2);
    const increaseBy3: Decorator<A> = (descriptor) => async (n: number) =>
      await descriptor(n + 3);

    const increase = decorate(
      async (n: number) => n,
      increaseBy1,
      increaseBy2,
      increaseBy3,
    );
    expect(await increase(1)).toEqual(7);
  });

  test("should compose sync functions with decorateSync", async () => {
    type A = DescriptorSync<[number], number>;

    const increaseBy1: DecoratorSync<A> = (descriptor) => (n: number) =>
      descriptor(n + 1);
    const increaseBy2: DecoratorSync<A> = (descriptor) => (n: number) =>
      descriptor(n + 2);
    const increaseBy3: DecoratorSync<A> = (descriptor) => (n: number) =>
      descriptor(n + 3);

    const increase = decorateSync(
      (n: number) => n,
      increaseBy1,
      increaseBy2,
      increaseBy3,
    );
    expect(increase(1)).toEqual(7);
  });

  test("should have correct TypeScript types for async decorators", async () => {
    type decorator = Decorator<Descriptor<[number], Promise<number>>>;

    type fn = (value: number) => Promise<number>;

    expectTypeOf<decorator>().toEqualTypeOf<(next: fn) => fn>();
  });

  test("should work with sync functions without additional decorators", async () => {
    const increment = (value: number) => value + 1;

    const next = decorate(increment);

    expectTypeOf(next).toEqualTypeOf<(value: number) => number>();
    expect(next(1)).toBe(2);
  });

  test("should apply sync middleware decorator correctly", async () => {
    const increment = (value: number) => value + 1;
    const middleware = (next: (value: number) => number) => (value: number) =>
      next(value + 1);

    const next = decorate(increment, middleware);

    expectTypeOf(next).toEqualTypeOf<(value: number) => number>();
    expect(next(1)).toBe(3);
  });

  test("should execute multiple async middleware decorators in correct order", async () => {
    const logger = mock();

    type Req = {};
    type Res = {};

    const fetch = async (req: Req) => req;

    const logMiddleware =
      (k: number) => (next: (req: Req) => Promise<Res>) => async (req: Req) => {
        logger(`before ${k}`);
        const res = await next(req);
        logger(`after ${k}`);
        return res;
      };

    const next = decorate(
      fetch,
      logMiddleware(1),
      logMiddleware(2),
      logMiddleware(3),
    );

    expectTypeOf(next).toEqualTypeOf<(req: Req) => Promise<Res>>();
    await next({});
    expect(logger).toHaveBeenCalledTimes(6);
    expect(logger).toHaveBeenNthCalledWith(1, "before 3");
    expect(logger).toHaveBeenNthCalledWith(2, "before 2");
    expect(logger).toHaveBeenNthCalledWith(3, "before 1");
    expect(logger).toHaveBeenNthCalledWith(4, "after 1");
    expect(logger).toHaveBeenNthCalledWith(5, "after 2");
    expect(logger).toHaveBeenNthCalledWith(6, "after 3");
  });

  test("should decorate sync class methods with validation and logging", () => {
    class Calculator {
      base = 10;

      // Decorate a method with proper 'this' binding
      calculate = decorate(
        (n: number) => {
          return this.base + n;
        },
        // Add validation
        (fn) => (n) => {
          if (n < 0) throw new Error("Negative numbers not allowed");
          return fn.call(this, n);
        },
        // Add logging
        (fn) => (n) => {
          console.log(`Calculating with: ${n}`);
          const result = fn.call(this, n);
          console.log(`Result: ${result}`);
          return result;
        },
      );
    }

    const calc = new Calculator();

    expect(calc.calculate(5)).toBe(15);
  });
});
