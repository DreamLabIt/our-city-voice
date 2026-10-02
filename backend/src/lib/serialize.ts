/**
 * Makes BigInt survive JSON.stringify.
 *
 * Prisma returns BigInt for every id in this schema, and `JSON.stringify`
 * throws `TypeError: Do not know how to serialize a BigInt` rather than
 * guessing a representation. Express's res.json() calls stringify, so without
 * this every endpoint that returns a row would 500.
 *
 * Strings, not numbers, are the right answer. A JSON number above 2^53 loses
 * precision silently when the browser parses it, and the frontend's types
 * already declare `id: string`.
 *
 * Importing this module for its side effect is deliberate; it has to run once
 * before any response is serialised, so app.ts imports it at the top.
 */
declare global {
  interface BigInt {
    toJSON(): string;
  }
}

if (typeof BigInt.prototype.toJSON !== "function") {
  Object.defineProperty(BigInt.prototype, "toJSON", {
    value: function toJSON(this: bigint): string {
      return this.toString();
    },
    writable: true,
    configurable: true,
    enumerable: false,
  });
}

export {};
