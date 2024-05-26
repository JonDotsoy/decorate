type Promised<R> = R | Promise<R>;
export type Descriptor<A extends any[], R> = (...args: A) => Promised<R>;
export type Decorator<TDecorator extends Descriptor<any, any>> = (
  descriptor: TDecorator,
) => Promised<TDecorator>;

export type DescriptorSync<A extends any[], R, ThisArg = any> = (
  this: ThisArg,
  ...args: A
) => R;
export type DecoratorSync<
  TDecoratorSync extends DescriptorSync<any, any, any>,
> = (descriptor: TDecoratorSync) => TDecoratorSync;

/**
 * @example
 * const decorated = decorate(n => n, increaseBy1, increaseBy2, increaseBy3);
 * decorated(1); // => 7
 * @param descriptor
 * @param decorators
 * @returns a new descriptor wrapped
 */
export const decorate = <
  TDescriptor extends Descriptor<any[], any>,
  TDecorator extends Decorator<TDescriptor>,
>(
  descriptor: TDescriptor,
  ...decorators: TDecorator[]
): TDescriptor => {
  const f: any = function (this: any, ...args: any[]) {
    const newDescriptor = decorators.reduce<any>(
      (descriptor: TDescriptor, decorator: TDecorator) =>
        async (...args: any) =>
          (await decorator.call(this, descriptor)).call(this, ...args),
      descriptor.bind(this),
    );
    return newDescriptor(...args);
  };
  return f;
};

/**
 * @example
 * const decorated = decorate(n => n, increaseBy1, increaseBy2, increaseBy3);
 * decorated(1); // => 7
 * @param descriptor
 * @param decorators
 * @returns a new descriptor wrapped
 */
export const decorateSync = <
  TDescriptorSync extends DescriptorSync<any[], any, any>,
  TDecoratorSync extends DecoratorSync<TDescriptorSync>,
>(
  descriptor: TDescriptorSync,
  ...decorators: TDecoratorSync[]
): TDescriptorSync => {
  const f: any = function (this: any, ...args: any[]) {
    const newDescriptor: TDescriptorSync = decorators.reduce<any>(
      (descriptor: TDescriptorSync, decorator: TDecoratorSync) =>
        (...args: any): TDescriptorSync =>
          decorator.call(this, descriptor).call(this, ...args),
      descriptor.bind(this),
    );
    return newDescriptor(...args);
  };
  return f;
};
