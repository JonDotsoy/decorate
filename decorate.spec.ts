import { test, expect, describe } from "bun:test";
import {
  decorate,
  decorateSync,
  type Decorator,
  type DecoratorSync,
  type Descriptor,
  type DescriptorSync,
} from "./decorate.js";

describe("Decorate", () => {
  test("should call to decorate function to decorate function", async () => {
    type A = Descriptor<[number], { n: number }>;

    const fn: A = async (n: number) => ({
      n,
    });
    const add1: Decorator<A> = async (descriptor) => async (n) =>
      await descriptor(n + 1);
    const add2: Decorator<A> = async (descriptor) => async (n: number) =>
      await descriptor(n + 2);
    const add3: Decorator<A> = async (descriptor) => async (n: number) =>
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

  test("should call to decorate function to decorate a method", async () => {
    class A {
      base = 10;

      b = decorate(
        async function (this: A, n: number) {
          return this.base + n;
        },
        async (fn) => async (n) => fn.call(this, n + 1),
        async (fn) => async (n) => fn.call(this, n + 2),
        async (fn) => async (n) => fn.call(this, n + 3),
      );
    }

    expect(await new A().b(1)).toEqual(17);
  });

  test("should call to decorate function", async () => {
    type A = Descriptor<[number], number>;

    const increaseBy1: Decorator<A> = async (descriptor) => async (n: number) =>
      await descriptor(n + 1);
    const increaseBy2: Decorator<A> = async (descriptor) => async (n: number) =>
      await descriptor(n + 2);
    const increaseBy3: Decorator<A> = async (descriptor) => async (n: number) =>
      await descriptor(n + 3);

    const increase = decorate(
      (n: number) => n,
      increaseBy1,
      increaseBy2,
      increaseBy3,
    );
    expect(await increase(1)).toEqual(7);
  });

  test("should call to decorateSync function", async () => {
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
});
