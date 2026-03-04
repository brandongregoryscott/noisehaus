import { useState } from "react";

const useBoolean = (initialValue?: boolean) => {
    const [value, setValue] = useState<boolean>(initialValue ?? false);

    const setTrue = () => setValue(true);
    const setFalse = () => setValue(false);
    const toggle = () => setValue((value) => !value);

    return { setFalse, setTrue, toggle, value };
};

export { useBoolean };
