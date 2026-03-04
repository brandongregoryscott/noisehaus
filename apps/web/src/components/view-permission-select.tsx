import { ViewPermission } from "common";
import { upperFirst } from "lodash-es";
import type { SelectOption } from "@/components/select";
import { Select } from "@/components/select";

type ViewPermissionSelectProps = {
    onChange: (value: ViewPermission) => void;
    value?: ViewPermission;
};

const OPTIONS: Array<SelectOption<ViewPermission>> = Object.values(
    ViewPermission
).map((viewPermission) => ({
    label: upperFirst(viewPermission).split("_").join(" "),
    value: viewPermission,
}));

const ViewPermissionSelect: React.FC<ViewPermissionSelectProps> = (props) => {
    const { onChange, value } = props;

    return (
        <Select
            onChange={onChange}
            options={OPTIONS}
            placeholder="Select a visibility setting..."
            value={value}
        />
    );
};

export type { ViewPermissionSelectProps };
export { ViewPermissionSelect };
