// TypeScript Comprehensive Syntax Examples

// =========================================================
// 1. Basic Types
// =========================================================

// Boolean
let isActive: boolean = true;

// Number (includes integers and floating point)
let integer: number = 42;
let float: number = 3.14;
let hex: number = 0xff;
let binary: number = 0b1010;
let octal: number = 0o744;
let bigintVar: bigint = 100n;

// String
let firstName: string = "John";
let greeting: string = `Hello, ${firstName}`;

// Arrays
let numberArray: number[] = [1, 2, 3];
let stringArray: Array<string> = ["one", "two", "three"];
let mixedArray: (number | string)[] = [1, "two", 3];

// Tuples
let tuple: [number, string, boolean] = [1, "hello", true];
let tupleWithOptional: [number, string?] = [1];
let tupleWithRest: [number, ...string[]] = [1, "two", "three"];

// Enums
enum Direction {
  Up = 1,
  Down,
  Left,
  Right,
}
let dir: Direction = Direction.Left;

// Any
let anything: any = 42;
anything = "Could be a string";
anything = true;

// Unknown
let notSure: unknown = 4;
notSure = "Could be a string";

// Void
function logMessage(message: string): void {
  console.log(message);
}

// Null and Undefined
let u: undefined = undefined;
let n: null = null;

// Never
function error(message: string): never {
  throw new Error(message);
}

// Object
let person: object = { name: "Alice", age: 30 };
let complexObj: { [key: string]: any } = { name: "Bob", hobbies: ["reading", "gaming"] };

// Symbol
let sym1: symbol = Symbol("unique");

// =========================================================
// 2. Type Assertions
// =========================================================

let someValue: any = "This is a string";
let strLength1: number = (<string>someValue).length;
let strLength2: number = (someValue as string).length;

// =========================================================
// 3. Interfaces
// =========================================================

// Basic Interface
interface User {
  name: string;
  age: number;
}

// Optional and Readonly Properties
interface Config {
  readonly apiKey: string;
  timeout?: number;
}

// Index Signatures
interface StringDictionary {
  [key: string]: string;
}
let obj: StringDictionary = {};
obj["key"] = "value";

// Function Types
interface SearchFunc {
  (source: string, subString: string): boolean;
}

// Interface Extending Other Interfaces
interface Shape {
  color: string;
}
interface Square extends Shape {
  sideLength: number;
}

// Hybrid Types
interface Counter {
  (start: number): string;
  interval: number;
  reset(): void;
}

// Class Types (Implementing Interfaces)
interface ClockInterface {
  currentTime: Date;
  setTime(d: Date): void;
}
class Clock implements ClockInterface {
  currentTime: Date = new Date();
  setTime(d: Date) {
    this.currentTime = d;
  }
}

// =========================================================
// 4. Classes
// =========================================================

// Basic Class
class Animal {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
  move(distance: number = 0) {
    console.log(`${this.name} moved ${distance}m.`);
  }
}

// Inheritance
class Dog extends Animal {
  bark() {
    console.log("Woof! Woof!");
  }
}

// Access Modifiers (public, private, protected)
class Person {
  public name: string;
  private ssn: string;
  protected age: number;
  constructor(name: string, ssn: string, age: number) {
    this.name = name;
    this.ssn = ssn;
    this.age = age;
  }
}

// Readonly Modifier
class Point {
  readonly x: number = 0;
  readonly y: number = 0;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

// Static Members
class Helper {
  static version: string = "1.0";
  static logVersion() {
    console.log(`Version: ${Helper.version}`);
  }
}

// Abstract Classes
abstract class Department {
  constructor(public name: string) {}
  printName(): void {
    console.log(`Department name: ${this.name}`);
  }
  abstract printMeeting(): void; // Must be implemented in derived classes
}

// =========================================================
// 5. Functions
// =========================================================

// Named Function
function add(x: number, y: number): number {
  return x + y;
}

// Anonymous Function
let multiply = function (x: number, y: number): number {
  return x * y;
};

// Arrow Function
let divide = (x: number, y: number): number => x / y;

// Optional and Default Parameters
function buildName(firstName: string, lastName?: string, prefix: string = "Mr.") {
  return `${prefix} ${firstName} ${lastName || ""}`;
}

// Rest Parameters
function totalLength(...args: (string | any[])[]): number {
  let total = 0;
  for (let arg of args) {
    total += arg.length;
  }
  return total;
}

// Function Overloads
function pickCard(x: { suit: string; card: number }[]): number;
function pickCard(x: number): { suit: string; card: number };
function pickCard(x: any): any {
  // Implementation
}

// 'this' Parameters
interface UIElement {
  addClickListener(onclick: (this: void, e: Event) => void): void;
}

// =========================================================
// 6. Generics
// =========================================================

// Generic Function
function identity<T>(arg: T): T {
  return arg;
}

// Generic Class
class GenericNumber<T> {
  zeroValue: T;
  add: (x: T, y: T) => T;
}

// Generic Constraints
interface Lengthwise {
  length: number;
}
function loggingIdentity<T extends Lengthwise>(arg: T): T {
  console.log(arg.length);
  return arg;
}

// Using Type Parameters in Generic Constraints
function getProperty<T, K extends keyof T>(obj: T, key: K) {
  return obj[key];
}

// Generic Interfaces
interface GenericIdentityFn<T> {
  (arg: T): T;
}

// Default Type Parameters
function createArray<T = string>(length: number, value: T): T[] {
  return Array<T>(length).fill(value);
}

// =========================================================
// 7. Advanced Types
// =========================================================

// Union Types
let unionVar: string | number;
unionVar = "hello";
unionVar = 42;

// Intersection Types
interface ErrorHandling {
  success: boolean;
  error?: { message: string };
}
interface Data {
  data: any[];
}
type Response = ErrorHandling & Data;

// Type Guards
function isString(x: any): x is string {
  return typeof x === "string";
}

// Discriminated Unions
interface Square {
  kind: "square";
  size: number;
}
interface Circle {
  kind: "circle";
  radius: number;
}
type Shape = Square | Circle;
function area(s: Shape): number {
  switch (s.kind) {
    case "square":
      return s.size * s.size;
    case "circle":
      return Math.PI * s.radius ** 2;
  }
}

// Index Types
function pluck<T, K extends keyof T>(obj: T, keys: K[]): T[K][] {
  return keys.map((key) => obj[key]);
}

// Mapped Types
type Partial<T> = {
  [P in keyof T]?: T[P];
};
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

// Conditional Types
type NonNullable<T> = T extends null | undefined ? never : T;
type InferReturnType<T> = T extends (...args: any[]) => infer R ? R : any;

// Template Literal Types
type Prefix = "get" | "set";
type GetterSetterKeys<T> = `${Prefix}${Capitalize<keyof T & string>}`;

// =========================================================
// 8. Modules and Namespaces
// =========================================================

// Namespace
namespace Validation {
  export interface StringValidator {
    isAcceptable(s: string): boolean;
  }
  export const numberRegexp = /^[0-9]+$/;
  export class ZipCodeValidator implements StringValidator {
    isAcceptable(s: string) {
      return s.length === 5 && numberRegexp.test(s);
    }
  }
}

// Module Import/Export
import { ZipCodeValidator } from "./ZipCodeValidator";
let myValidator = new ZipCodeValidator();

// Dynamic Import
import("./ZipCodeValidator").then((module) => {
  let validator = new module.ZipCodeValidator();
});

// Export Assignment
export = ZipCodeValidator;

// =========================================================
// 9. Decorators
// =========================================================

function sealed(constructor: Function) {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}

@sealed
class Greeter {
  greeting: string;
  constructor(message: string) {
    this.greeting = message;
  }
}

// Method Decorator
function log(target: Object, propertyName: string, propertyDesciptor: PropertyDescriptor): PropertyDescriptor {
  const method = propertyDesciptor.value;
  propertyDesciptor.value = function (...args: any[]) {
    console.log(`Call: ${propertyName} with`, args);
    return method.apply(this, args);
  };
  return propertyDesciptor;
}

class Calculator {
  @log
  square(n: number) {
    return n * n;
  }
}

// Property Decorator
function format(formatString: string) {
  return function (target: any, propertyName: string) {
    let value: string;
    const getter = () => value;
    const setter = (newVal: string) => {
      value = `${formatString} ${newVal}`;
    };
    Object.defineProperty(target, propertyName, { get: getter, set: setter });
  };
}

class GreeterWithFormat {
  @format("Hello")
  greeting: string;
  constructor(message: string) {
    this.greeting = message;
  }
}

// =========================================================
// 10. Ambient Declarations
// =========================================================

declare module "SomeModule" {
  export function someFunction(): void;
}

// =========================================================
// 11. Mixins
// =========================================================

class Disposable {
  isDisposed: boolean = false;
  dispose() {
    this.isDisposed = true;
  }
}

class Activatable {
  isActive: boolean = false;
  activate() {
    this.isActive = true;
  }
  deactivate() {
    this.isActive = false;
  }
}

class SmartObject implements Disposable, Activatable {
  constructor() {
    setInterval(() => console.log(this.isActive + " : " + this.isDisposed), 500);
  }
  interact() {
    this.activate();
  }
  // Implemented members from interfaces
  isDisposed: boolean = false;
  dispose: () => void;
  isActive: boolean = false;
  activate: () => void;
  deactivate: () => void;
}

applyMixins(SmartObject, [Disposable, Activatable]);

function applyMixins(derivedCtor: any, baseCtors: any[]) {
  baseCtors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
      Object.defineProperty(
        derivedCtor.prototype,
        name,
        Object.getOwnPropertyDescriptor(baseCtor.prototype, name) || Object.create(null)
      );
    });
  });
}

// =========================================================
// 12. Symbols and Iterators
// =========================================================

class Collection<T> implements Iterable<T> {
  private items: T[] = [];
  [Symbol.iterator](): Iterator<T> {
    let pointer = 0;
    let items = this.items;
    return {
      next(): IteratorResult<T> {
        if (pointer < items.length) {
          return {
            done: false,
            value: items[pointer++],
          };
        } else {
          return {
            done: true,
            value: null as any,
          };
        }
      },
    };
  }
  add(item: T) {
    this.items.push(item);
  }
}

// =========================================================
// 13. Async/Await and Promises
// =========================================================

async function asyncFunc(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

// =========================================================
// 14. JSX
// =========================================================

// Only valid in .tsx files
// const element = <div>Hello, {firstName}</div>;

// =========================================================
// 15. Type Manipulation and Utility Types
// =========================================================

// Partial
type PartialUser = Partial<User>;

// Required
type RequiredConfig = Required<Config>;

// Readonly
type ReadonlyUser = Readonly<User>;

// Pick
type PickUser = Pick<User, "name">;

// Omit
type OmitUser = Omit<User, "age">;

// Record
type StringRecord = Record<string, number>;

// Exclude
type Excluded = Exclude<"a" | "b" | "c", "a">;

// Extract
type Extracted = Extract<"a" | "b" | "c", "a" | "f">;

// NonNullable
type NonNull = NonNullable<string | number | undefined>;

// Parameters
type FuncParams = Parameters<typeof add>;

// ReturnType
type FuncReturn = ReturnType<typeof add>;

// InstanceType
class ExampleClass {
  constructor(public value: number) {}
}
type ExampleInstance = InstanceType<typeof ExampleClass>;

// =========================================================
// 16. Type Guards and Type Predicates
// =========================================================

function isNumber(value: any): value is number {
  return typeof value === "number";
}

function example(value: string | number) {
  if (isNumber(value)) {
    // value is number
    console.log(value.toFixed(2));
  } else {
    // value is string
    console.log(value.toUpperCase());
  }
}

// =========================================================
// 17. Literal Types and Literal Inference
// =========================================================

let literalString: "hello" = "hello";
let literalNumber: 42 = 42;

// Literal Types in Interfaces
interface Options {
  alignment: "left" | "right" | "center";
}

// =========================================================
// 18. Nullish Coalescing and Optional Chaining
// =========================================================

let nullableString: string | null = null;
let result = nullableString ?? "Default String";

let nestedObj: any = { a: { b: { c: 42 } } };
let val = nestedObj?.a?.b?.c;

// =========================================================
// 19. Type Assertions with '!'
– // =========================================================

function liveDangerously(x?: number | null) {
  console.log(x!.toFixed());
}

// =========================================================
// 20. Module Augmentation and Declaration Merging
// =========================================================

// Merging Interfaces
interface Window {
  customProperty: string;
}

// Module Augmentation
declare module "some-module" {
  export function newFunction(): void;
}

// =========================================================
// 21. Ambient Namespaces and Globals
// =========================================================

declare global {
  interface String {
    customMethod(): string;
  }
}

// Usage of the added method
String.prototype.customMethod = function () {
  return `Custom: ${this}`;
};

// =========================================================
// 22. Assertion Functions
// =========================================================

function assertIsDefined<T>(value: T): asserts value is NonNullable<T> {
  if (value == null) {
    throw new Error("Value is null or undefined");
  }
}

// =========================================================
// 23. Import Type
// =========================================================

import type { SomeType } from "./some-module";

// =========================================================
// 24. BigInt Literal Types
// =========================================================

let bigNumber: 100n = 100n;

// =========================================================
// 25. Unique Symbol Types
// =========================================================

declare const uniqueSymbol: unique symbol;
type UniqueSymbolType = typeof uniqueSymbol;

// =========================================================
// 26. Template Literal Types
// =========================================================

type EventName<T extends string> = `on${Capitalize<T>}`;
type ClickEvent = EventName<"click">; // "onClick"

// =========================================================
// 27. Variadic Tuple Types
// =========================================================

type RestArgs<T extends any[]> = [first: string, ...rest: T];
function funcWithRestArgs<T extends any[]>(...args: RestArgs<T>) {
  // ...
}

// =========================================================
// 28. Key Remapping in Mapped Types
// =========================================================

type RemoveReadonly<T> = {
  -readonly [P in keyof T]: T[P];
};

type RemoveOptional<T> = {
  [P in keyof T]-?: T[P];
};

type MappedTypeWithNewKeys<T> = {
  [K in keyof T as NewKeyType<K>]: T[K];
};

type NewKeyType<K> = `new_${string & K}`;

// =========================================================
// 29. Indexed Access Types
// =========================================================

type UserAge = User["age"];

// =========================================================
// 30. Conditional Types with Inference
// =========================================================

type GetReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

// =========================================================
// 31. Named Tuples
// =========================================================

type NamedTuple = [x: number, y: number];

// =========================================================
// 32. Optional Element in Tuple Types
// =========================================================

type TupleWithOptionalElement = [number, string?];

// =========================================================
// 33. Branded Types
// =========================================================

type USD = number & { readonly brand: unique symbol };
type EUR = number & { readonly brand: unique symbol };

function usd(value: number): USD {
  return value as USD;
}

function eur(value: number): EUR {
  return value as EUR;
}

function addUsd(a: USD, b: USD): USD {
  return usd(a + b);
}

// =========================================================
// 34. Module with Exported Function
// =========================================================

export function exportedFunction() {
  console.log("Exported function");
}

// =========================================================
// 35. Type Casting with 'as const'
– // =========================================================

let numLiteral = 42 as const;
let objLiteral = { key: "value" } as const;

// =========================================================
// 36. Enum Member Types
– // =========================================================

enum LogLevel {
  ERROR,
  WARN,
  INFO,
  DEBUG,
}
type LogLevelStrings = keyof typeof LogLevel;

// =========================================================
// 37. Non-Function Type Implementations
– // =========================================================

interface Callable {
  (): void;
}
let callableObj: Callable = () => {
  console.log("Called");
};

// =========================================================
// 38. Optional Catch Binding
– // =========================================================

try {
  throw new Error("Error");
} catch {
  console.log("Caught");
}

// =========================================================
// 39. Import Equals
– // =========================================================

import fs = require("fs");

// =========================================================
// 40. String Enums
– // =========================================================

enum StringEnum {
  A = "Alpha",
  B = "Beta",
}

// =========================================================
// 41. Type-Only Imports and Exports
– // =========================================================

import type { Interface } from "./module";
export type { Interface };

// =========================================================
// 42. Top-Level 'await' (ES2022)
// =========================================================

// Only allowed in modules
// const data = await fetchData();

// =========================================================
// 43. FinalizationRegistry and WeakRef
– // =========================================================

const registry = new FinalizationRegistry((heldValue) => {
  console.log(`Cleaning up ${heldValue}`);
});

let objectRef = { name: "Object" };
registry.register(objectRef, "ObjectRef");

// Later...
objectRef = null;

// =========================================================
// 44. Unknown Type
– // =========================================================

function processValue(value: unknown) {
  if (typeof value === "string") {
    console.log(value.toUpperCase());
  } else if (typeof value === "number") {
    console.log(value.toFixed(2));
  }
}

// =========================================================
// 45. 'is' Type Predicates in Functions
– // =========================================================

function isArrayOfStrings(value: any): value is string[] {
  return Array.isArray(value) && value.every((elem) => typeof elem === "string");
}

// =========================================================
// 46. Iteration over Mapped Types with 'keyof'
– // =========================================================

type Mapped<T> = {
  [K in keyof T]: T[K];
};
function logKeys<T>(obj: T) {
  for (const key in obj) {
    console.log(key);
  }
}

// =========================================================
// 47. Overlapping Interface Declarations
– // =========================================================

interface MergedInterface {
  x: number;
}
interface MergedInterface {
  y: number;
}
let mergedObject: MergedInterface = { x: 10, y: 20 };

// =========================================================
// 48. Optional Properties in Interfaces
– // =========================================================

interface Part {
  id: number;
  name: string;
  subparts?: Part[];
}

// =========================================================
// 49. Declaration Merging with Modules
– // =========================================================

declare module "express" {
  interface Request {
    user?: User;
  }
}

// =========================================================
// 50. Ambient Variable Declarations
– // =========================================================

declare const process: any;

// =========================================================
// End of Comprehensive TypeScript Syntax Examples
// =========================================================
