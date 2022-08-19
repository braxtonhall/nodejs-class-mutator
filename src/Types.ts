type AnyFun = (...args: any[]) => any;
type AsyncFun<T> = (...args: any[]) => PromiseLike<T>;
type Method<Class, M extends MethodName<Class>> = OnlyMethods<Class>[M];
type Constructor<Class> = new (...args: any[]) => Class;
type MethodName<Class> = keyof OnlyMethods<Class>;
type OnlyMethods<Class> = {
    [Property in keyof Class as Class[Property] extends AnyFun ? Property : never]: Class[Property]
};

type InjectInsteadMethod<Class, M extends MethodName<Class>> = Method<Class, M> extends AnyFun ?
    (this: Class, ...args: [...originalArgs: Parameters<Method<Class, M>>, originalMethod: Method<Class, M>]) =>
        ReturnType<Method<Class, M>> : never;

type InjectOnErrorMethod<Class, M extends MethodName<Class>> = Method<Class, M> extends AnyFun ?
    (this: Class, error: unknown, ...args: Parameters<Method<Class, M>>) => ReturnType<Method<Class, M>> : never;

type InjectAfterMethod<Class, M extends MethodName<Class>> = Method<Class, M> extends AnyFun ?
    (ReturnType<Method<Class, M>> extends PromiseLike<infer T> ?
        InjectAfterAsyncMethod<Class, M, T> : InjectAfterSyncMethod<Class, M>) : never;

type InjectAfterSyncMethod<Class, M extends MethodName<Class>> = Method<Class, M> extends AnyFun ?
    (this: Class, returning: ReturnType<Method<Class, M>>, ...args: Parameters<Method<Class, M>>) =>
        ReturnType<Method<Class, M>> : never;

type InjectAfterAsyncMethod<Class, M extends MethodName<Class>, T> = Method<Class, M> extends AsyncFun<infer T> ?
    (this: Class, returning: T, ...args: Parameters<Method<Class, M>>) =>
        T | PromiseLike<T> : never;

type InjectBeforeMethod<Class, M extends MethodName<Class>> = Method<Class, M> extends AnyFun ?
    (ReturnType<Method<Class, M>> extends PromiseLike<infer T> ?
        InjectBeforeAsyncMethod<Class, M> : InjectBeforeSyncMethod<Class, M>) : never;

type InjectBeforeAsyncMethod<Class, M extends MethodName<Class>> = Method<Class, M> extends AnyFun ?
    (this: Class, ...args: Parameters<Method<Class, M>>) =>
        Parameters<Method<Class, M>> | PromiseLike<Parameters<Method<Class, M>>> : never;

type InjectBeforeSyncMethod<Class, M extends MethodName<Class>> = Method<Class, M> extends AnyFun ?
    (this: Class, ...args: Parameters<Method<Class, M>>) => Parameters<Method<Class, M>> : never;

type InjectAroundMethod<Class, M extends MethodName<Class>, W extends InjectType> =
    (W extends InjectType.BEFORE ? InjectBeforeMethod<Class, M> :
        (W extends InjectType.AFTER ? InjectAfterMethod<Class, M> : never));

type InjectMethod<Class, M extends MethodName<Class>, W extends InjectType> =
    W extends InjectType.INSTEAD ? InjectInsteadMethod<Class, M> :
        (W extends InjectType.ERROR ? InjectOnErrorMethod<Class, M> :
            InjectAroundMethod<Class, M, W>);

enum InjectType {
    BEFORE = "before",
    AFTER = "after",
    INSTEAD = "instead",
    ERROR = "error",
}

interface InjectEnv<Class, M extends MethodName<Class>, W extends InjectType> {
    classConstructor: Constructor<Class>,
    methodName: M,
    injectedFn: InjectMethod<Class, M, W>,
    when: W,
}

export {
    Method,
    Constructor,
    MethodName,
    InjectEnv,
    InjectType,
    InjectAroundMethod,
    InjectAfterMethod,
    InjectBeforeMethod,
    InjectInsteadMethod,
    InjectOnErrorMethod,
    InjectMethod,
};
