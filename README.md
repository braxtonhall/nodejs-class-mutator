# NodeJS Class Mutator

A package for overriding method behaviour in Node classes.

## API
```typescript
declare function mutate(
    path: string, // Path to a mutant file, whose default export is of type InjectEnv
    {debug}: MutateOptions
): void;

interface MutateOptions {
    debug: boolean; // Whether or not to print during code injection
}

interface InjectEnv<Class, M extends MethodName<Class>, W extends InjectType> {
    classConstructor: Constructor<Class>, // The class to inject into
    methodName: M, // The name of the method to override
    injectedFn: InjectMethod<Class, M, W>, // The function that will replace the original method
    when: W,
}

enum InjectType {
    BEFORE = "before", // before the original method
    AFTER = "after", // after the original method
    INSTEAD = "instead", // in place of the original method
    ERROR = "error", // when an error is thrown or a promise is rejected
}
```

## Example

### The reference implementation under test
```typescript
export default class Foo {
    public negate(bool: boolean): boolean {
        return !bool;
    }
}
```

### The mutant that will be injected
```typescript
import {InjectEnv, InjectType} from "node-js-class-mutator";
import Foo from "../soln/Foo";

const mutant: InjectEnv<Foo, "negate", InjectType.INSTEAD> = {
    classConstructor: Foo,
    methodName: "negate",
    injectedFn: function (this:Foo, bool: boolean, originalMethod: (bool: boolean) => boolean): boolean {
        return !originalMethod(bool);
    },
    when: InjectType.INSTEAD,
};

export default mutant;
```

### The test suite for Foo
```typescript
import {mutate} from "node-js-class-mutator";
import Foo from "../src/soln/Foo";

mutate("../src/mutants/mutation.ts", {debug: false});

describe("Foo", function () {
    describe("#negate", function () {
        it("should turn true into false", function () {
            expect(new Foo.negate(true)).to.be.false; // this test fails! negate returns true
        });

        it("should turn false into true", function () {
            expect(new Foo.negate(false)).to.be.true; // this test fails! negate returns false
        });
    });
});
```
