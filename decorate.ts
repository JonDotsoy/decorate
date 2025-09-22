export type Descriptor<A extends any[], R> = (...args: A) => R;
export type Decorator<TDecorator extends Descriptor<any, any>> = (
  descriptor: TDecorator,
) => TDecorator;

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
  return decorators.reduce(
    (descriptor: TDescriptor, decorator: TDecorator): TDescriptor =>
      decorator(descriptor),
    descriptor,
  );
};

/**
 * @example
 * const decorated = decorate(n => n, increaseBy1, increaseBy2, increaseBy3);
 * decorated(1); // => 7
 * @param descriptor
 * @param decorators
 * @returns a new descriptor wrapped
 * @deprecated use `decorate` instead
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
