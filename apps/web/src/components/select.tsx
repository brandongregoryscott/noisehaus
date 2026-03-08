import { Select as RadixSelect } from "radix-ui";
import type { IconName } from "@/components/icon";
import { Box } from "@/components/box";
import { Button } from "@/components/button";
import { Icon } from "@/components/icon";
import { Row } from "@/components/row";

type SelectProps<T extends string = string> = {
    maxWidth?: `${number}%` | number;
    onChange: (value: T) => void;
    onClear?: () => void;
    options: Array<SelectOption<T>>;
    placeholder?: string;
    showClearAffordance?: boolean;
    value?: T;
    width?: `${number}%` | number;
};

type SelectOption<T extends string = string> = {
    icon?: IconName;
    label: string;
    value: T;
};

const Select = <T extends string = string>(props: SelectProps<T>) => {
    const {
        maxWidth,
        onChange,
        onClear,
        options,
        placeholder = "Select a value...",
        showClearAffordance = false,
        // We're using an empty string here to denote "no value", since changing from a set value back to `undefined` will log a warning:
        // Select is changing from controlled to uncontrolled. Components should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled value for the lifetime of the component.
        value = "",
        width = "100%",
    } = props;
    const selectedOption = options.find((option) => option.value === value);
    const handleClear = (event: React.MouseEvent) => {
        event.stopPropagation();
        onClear?.();
    };

    return (
        <RadixSelect.Root onValueChange={onChange} value={value}>
            <RadixSelect.Trigger asChild={true}>
                <Button fillStyle="Outline" maxWidth={maxWidth} width={width}>
                    <Box
                        css={{
                            alignItems: "center",
                            display: "flex",
                            justifyContent: "space-between",
                            width: "100%",
                        }}>
                        <Box
                            css={{
                                alignItems: "center",
                                display: "flex",
                                gap: 8,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}>
                            {selectedOption?.icon != null && (
                                <Icon name={selectedOption?.icon} />
                            )}
                            <RadixSelect.Value placeholder={placeholder}>
                                <span>{selectedOption?.label}</span>
                            </RadixSelect.Value>
                        </Box>
                        <Row
                            css={{
                                alignItems: "center",
                                gap: 8,
                            }}>
                            {showClearAffordance && (
                                <Button
                                    as="div"
                                    css={{
                                        "& svg": {
                                            height: 16,
                                            width: 16,
                                        },
                                        borderRadius: 4,
                                        height: 20,
                                        padding: 0,
                                        width: 20,
                                    }}
                                    fillStyle="Ghost"
                                    onClick={handleClear}>
                                    <Icon name="X" />
                                </Button>
                            )}
                            <Icon name="ChevronDown" />
                        </Row>
                    </Box>
                </Button>
            </RadixSelect.Trigger>
            <RadixSelect.Portal>
                <RadixSelect.Content>
                    <RadixSelect.Viewport>
                        <Box
                            css={{
                                backgroundColor: "$black",
                                border: "2px solid $white",
                                borderRadius: 8,
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                                maxWidth,
                                padding: 8,
                            }}>
                            {options.map((option) => (
                                <RadixSelect.Item
                                    asChild={true}
                                    key={option.value}
                                    value={option.value}>
                                    <Button
                                        align="left"
                                        fillStyle="Ghost"
                                        width="100%">
                                        <Box
                                            css={{
                                                alignItems: "center",
                                                display: "flex",
                                                justifyContent: "space-between",
                                                width: "100%",
                                            }}>
                                            <Box
                                                css={{
                                                    alignItems: "center",
                                                    display: "flex",
                                                    gap: 8,
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}>
                                                {option.icon != null && (
                                                    <Icon name={option.icon} />
                                                )}
                                                <RadixSelect.ItemText>
                                                    {option.label}
                                                </RadixSelect.ItemText>
                                            </Box>
                                            {option.value === value && (
                                                <Box css={{ paddingLeft: 8 }}>
                                                    <Icon name="Checkmark" />
                                                </Box>
                                            )}
                                        </Box>
                                    </Button>
                                </RadixSelect.Item>
                            ))}
                        </Box>
                    </RadixSelect.Viewport>
                </RadixSelect.Content>
            </RadixSelect.Portal>
        </RadixSelect.Root>
    );
};

export type { SelectOption, SelectProps };
export { Select };
