import type { Dispatch, SetStateAction } from "react";
import { noop } from "lodash-es";
import { createContext, useMemo, useState } from "react";

type CreateContext = {
    boardName: string;
    boardSlug: string;
    file: File | null;
    fileDisplayName: string;
    fileEmoji: string | undefined;
    setValue: Dispatch<SetStateAction<Omit<CreateContext, "setValue">>>;
};

type CreateContextProviderOptions = {
    children: React.ReactNode;
};

const DEFAULT_CREATE_CONTEXT_VALUE: CreateContext = {
    boardName: "",
    boardSlug: "",
    file: null,
    fileDisplayName: "",
    fileEmoji: undefined,
    setValue: noop,
};
const { setValue: _unusedSetValue, ...DEFAULT_CREATE_CONTEXT_STATE } =
    DEFAULT_CREATE_CONTEXT_VALUE;

const CreateContext = createContext<CreateContext>(
    DEFAULT_CREATE_CONTEXT_VALUE
);

const CreateContextProvider: React.FC<CreateContextProviderOptions> = (
    props
) => {
    const { children } = props;
    const [value, setValue] = useState<Omit<CreateContext, "setValue">>(
        DEFAULT_CREATE_CONTEXT_STATE
    );
    const _value = useMemo(() => ({ ...value, setValue }), [value]);

    return (
        <CreateContext.Provider value={_value}>
            {children}
        </CreateContext.Provider>
    );
};

export { CreateContext, CreateContextProvider, DEFAULT_CREATE_CONTEXT_VALUE };
