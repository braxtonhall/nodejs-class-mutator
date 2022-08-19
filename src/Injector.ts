import {
    Constructor,
    InjectAfterMethod,
    InjectAroundMethod,
    InjectBeforeMethod,
    InjectInsteadMethod,
    InjectOnErrorMethod,
    InjectType,
    Method,
    MethodName,
    InjectEnv
} from "./Types";

function injectMethod<Class, M extends MethodName<Class>, W extends InjectType>(env: InjectEnv<Class, M, W>,) {
    const {classConstructor, methodName, injectedFn, when} = env;
    if (when === InjectType.INSTEAD) {
        replaceMethod(classConstructor, methodName, injectedFn as InjectInsteadMethod<Class, M>);
    } else if (when === InjectType.ERROR) {
        injectMethodOnError(classConstructor, methodName, injectedFn as InjectOnErrorMethod<Class, M>);
    } else {
        injectMethodAroundOriginal(classConstructor, methodName, injectedFn as InjectAroundMethod<Class, M, W>, when);
    }
}

function replaceMethod<Class, M extends MethodName<Class>>(
    classConstructor: Constructor<Class>,
    methodName: M,
    injectedFn: InjectInsteadMethod<Class, M>) {

    const backup: Method<Class, M> & Function = classConstructor.prototype[methodName];
    classConstructor.prototype[methodName] = function (this: Class, ...args: any[]) {
        // @ts-ignore
        return injectedFn.bind(this)(...args, backup?.bind(this));
    };
}

function injectMethodAroundOriginal<Class, M extends MethodName<Class>, W extends Exclude<InjectType, InjectType.INSTEAD>>(
    classConstructor: Constructor<Class>,
    methodName: M,
    injectedFn: InjectAroundMethod<Class, M, W>,
    when: Exclude<InjectType, InjectType.INSTEAD>) {

    if (when === InjectType.BEFORE) {
        injectMethodBefore(classConstructor, methodName, injectedFn as InjectBeforeMethod<Class, M>);
    } else {
        injectMethodAfter(classConstructor, methodName, injectedFn as InjectAfterMethod<Class, M>);
    }
}

function injectMethodBefore<Class, M extends MethodName<Class>>(
    classConstructor: Constructor<Class>, methodName: M, injectedFn: InjectBeforeMethod<Class, M>) {

    const backup: Method<Class, M> & Function = classConstructor.prototype[methodName];
    classConstructor.prototype[methodName] = function (this: Class, ...args: any[]) {
        // @ts-ignore
        const retVal = injectedFn.bind(this)(...args);
        if (retVal instanceof Promise) {
            return retVal.then((res) => backup.bind(this)(...res));
        } else {
            // @ts-ignore
            return backup.bind(this)(...retVal);
        }
    };
}

function injectMethodAfter<Class, M extends MethodName<Class>>(
    classConstructor: Constructor<Class>, methodName: M, injectedFn: InjectAfterMethod<Class, M>) {

    const backup: Method<Class, M> & Function = classConstructor.prototype[methodName];
    classConstructor.prototype[methodName] = function (this: Class, ...args: any[]) {
        const retVal = backup.bind(this)(...args);
        if (retVal instanceof Promise) {
            // @ts-ignore
            return retVal.then((returning) => injectedFn.bind(this)(returning, ...args));
        } else {
            // @ts-ignore
            return injectedFn.bind(this)(retVal, ...args);
        }
    };
}

function injectMethodOnError<Class, M extends MethodName<Class>>(
    classConstructor: Constructor<Class>, methodName: M, injectedFn: InjectOnErrorMethod<Class, M>) {

    const backup: Method<Class, M> & Function = classConstructor.prototype[methodName];
    classConstructor.prototype[methodName] = function (this: Class, ...args: any[]) {
        try {
            const retVal = backup.bind(this)(...args);
            if (retVal instanceof Promise) {
                // @ts-ignore
                return retVal.catch((err) => injectedFn.bind(this)(err, ...args));
            } else {
                return retVal;
            }
        } catch (err) {
            // @ts-ignore
            return injectedFn.bind(this)(err, ...args);
        }
    }
}

const isInjectEnv = (maybeInjectEnv: any): maybeInjectEnv is InjectEnv<any, any, any> =>
    !!maybeInjectEnv && !!maybeInjectEnv.classConstructor && !!maybeInjectEnv.methodName && !!maybeInjectEnv.injectedFn && !!maybeInjectEnv.when;

export {injectMethod, isInjectEnv};
