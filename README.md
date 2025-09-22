# 🎭 decorate

A powerful TypeScript library for functional composition and decoration of functions with support for asynchronous operations.

## Overview

The `decorate` library provides a clean, type-safe way to compose functions by applying decorators in sequence. It supports asynchronous function decoration, enabling you to build complex behaviors by combining simple, reusable decorators.

## Key Features

- 🔧 **Function Composition**: Chain multiple decorators to transform function behavior
- ⚡ **Async Support**: Works with asynchronous functions
- 🎯 **Type Safety**: Full TypeScript support with strong typing
- 🏗️ **Method Decoration**: Support for decorating class methods with proper `this` binding
- 🔄 **Functional Approach**: Pure functional programming style

## Installation

```bash
npm install @jondotsoy/decorate
# or
bun add @jondotsoy/decorate
# or
yarn add @jondotsoy/decorate
```

## Core Components

### Types

#### Descriptor Types

```ts
// For functions (can be sync or async)
type Descriptor<A extends any[], R> = (...args: A) => R;
```

#### Decorator Types

```ts
// Decorators always have the form (next: fn) => fn
type Decorator<TDecorator extends Descriptor<any, any>> = (
  descriptor: TDecorator,
) => TDecorator;
```

### Functions

#### `decorate<TDescriptor, TDecorator>(descriptor, ...decorators)`

Applies multiple decorators to a function in sequence. Works with both synchronous and asynchronous functions.

**Parameters:**

- `descriptor`: The original function to decorate
- `...decorators`: Array of decorators to apply (each decorator has the form `(next: fn) => fn`)

**Returns:** A new decorated function

## Usage Examples

### Asynchronous Function Decoration

```ts
import { decorate, type Descriptor, type Decorator } from "@jondotsoy/decorate";

type AsyncNumberFunction = Descriptor<[number], Promise<number>>;

// Define decorators - note they don't return promises themselves
const multiplyBy2: Decorator<AsyncNumberFunction> =
  (descriptor) => async (n: number) =>
    (await descriptor(n)) * 2;

const addTen: Decorator<AsyncNumberFunction> =
  (descriptor) => async (n: number) =>
    (await descriptor(n)) + 10;

// Apply decorators
const transform = decorate(async (n: number) => n, multiplyBy2, addTen);

const result = await transform(5); // Output: 20 ((5 * 2) + 10)
```

### Class Method Decoration

```ts
import { decorate } from "@jondotsoy/decorate";

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
console.log(calc.calculate(5)); // Logs and returns 15
```

### Advanced Example: Building a Middleware System

```ts
import { decorate, type Descriptor, type Decorator } from "@jondotsoy/decorate";

type RequestHandler = Descriptor<
  [{ url: string; body: any }],
  Promise<{ status: number; data: any }>
>;

// Authentication middleware - decorator doesn't return a promise
const authenticate: Decorator<RequestHandler> = (descriptor) => async (req) => {
  if (!req.body?.headers?.authorization) {
    return { status: 401, data: { error: "Unauthorized" } };
  }
  return descriptor(req);
};

// Logging middleware - decorator doesn't return a promise
const logger: Decorator<RequestHandler> = (descriptor) => async (req) => {
  console.log(`${new Date().toISOString()} - ${req.url}`);
  const response = await descriptor(req);
  console.log(`Response: ${response.status}`);
  return response;
};

// Rate limiting middleware - decorator doesn't return a promise
const rateLimit: Decorator<RequestHandler> = (descriptor) => async (req) => {
  // Rate limiting logic here...
  return descriptor(req);
};

// Build the handler
const apiHandler = decorate(
  async (req) => {
    // Main handler logic
    return { status: 200, data: { message: "Success" } };
  },
  authenticate,
  rateLimit,
  logger,
);
```

### Using Functions Without Additional Decorators

```ts
import { decorate } from "@jondotsoy/decorate";

// You can use decorate without additional decorators
const increment = (value: number) => value + 1;
const decoratedIncrement = decorate(increment);

console.log(decoratedIncrement(1)); // Output: 2
```

### Type Inference Example

```ts
import { decorate } from "@jondotsoy/decorate";

// TypeScript automatically infers the correct types
const asyncFn = decorate(
  async (x: string) => x.length,
  // Decorator has form (next: fn) => fn, not async
  (fn) => async (x) => (await fn(x)) + 1,
);
// Type: (x: string) => Promise<number>

// Works with sync functions too
const mixedFn = decorate(
  (x: number) => x * 2,
  // Even for sync functions, decorator can return async function
  (fn) => async (x) => (await fn(x)) + 1,
);
// Type: (x: number) => Promise<number>
```

## Execution Order

Decorators are applied in **right-to-left** order (like function composition). The last decorator in the list is applied first:

```ts
const fn = decorate(originalFn, dec1, dec2, dec3);
// Execution order: dec3(dec2(dec1(originalFn)))
```

## Type Safety

The library provides full TypeScript support with proper type inference:

```ts
// Decorators always have the form (next: fn) => fn
const typedDecorator: Decorator<Descriptor<[string], Promise<number>>> =
  (descriptor) => async (input) =>
    (await descriptor(input)).toString().length;

// TypeScript will catch type mismatches
const decorated = decorate(
  async (s: string) => s.length,
  typedDecorator, // ✅ Types match
);
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
