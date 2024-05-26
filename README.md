# decorate

**Example:**

```ts
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
```
