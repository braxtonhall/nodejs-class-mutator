import {injectMethod, isInjectEnv} from "./Injector";

type MutateOptions = {debug: boolean};

const getLogger = (debug: boolean) =>
    debug ? console.log : () => undefined;

const mutate = (path: string, {debug}: MutateOptions) => {
    const log = getLogger(debug);
    try {
        log(`<🪲> Loading in mutant "${path}"`);
        const mutant = require(path.replace(/\.[jt]s$/, "")).default;
        if (isInjectEnv(mutant)) {
            injectMethod(mutant);
            log(`<🪲> Loaded mutant "${path}" successfully`);
        } else {
            log(`<⚠️> Mutant "${path}" was required, however it was not a "Mutant" object`);
        }
    } catch (e) {
        log(`<❌> Failed to load mutant "${path}"`);
    }
};

export {mutate};
export type {MutateOptions};
