import { forwardRef } from "react";
import type { ButtonProps } from "@/components/button";
import type { IconName } from "@/components/icon";
import { Button } from "@/components/button";
import { Icon } from "@/components/icon";

type IconButtonProps = {
    iconName: IconName;
} & ButtonProps;

const IconButton: React.FC<IconButtonProps> = forwardRef<
    HTMLButtonElement,
    IconButtonProps
>((props, ref) => {
    const { colorType, fillStyle, iconName, size = "Small", ...rest } = props;
    return (
        <Button
            colorType={colorType}
            fillStyle={fillStyle}
            ref={ref}
            size={size}
            {...rest}>
            <Icon name={iconName} />
        </Button>
    );
});

IconButton.displayName = "IconButton";

export { IconButton };
