import type { Emoji } from "common";
import { EMOJI_LIST } from "common";
import type { SelectOption } from "@/components/select";
import { Select } from "@/components/select";

type EmojiSelectProps = {
    onClear: () => void;
    onSelect: (value: Emoji | undefined) => void;
    value: Emoji | undefined;
};

const OPTIONS: SelectOption[] = EMOJI_LIST.map((emoji) => ({
    label: `${emoji.unicode} ${emoji.colonCode}`,
    value: emoji.colonCode,
}));

const EmojiSelect: React.FC<EmojiSelectProps> = (props) => {
    const { onSelect, value } = props;

    const handleChange = (colonCode: string) => {
        const emoji = EMOJI_LIST.find((emoji) => emoji.colonCode === colonCode);
        onSelect(emoji);
    };

    return (
        <Select
            onChange={handleChange}
            options={OPTIONS}
            placeholder="Select an emoji..."
            value={value?.colonCode}
        />
    );
};

export type { EmojiSelectProps };
export { EmojiSelect };
