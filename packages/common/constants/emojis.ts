type Emoji = {
    colonCode: string;
    unicode: string;
};

const EMOJI_LIST: Emoji[] = [
    {
        colonCode: ":heart:",
        unicode: "❤️",
    },
    {
        colonCode: ":notes:",
        unicode: "🎶",
    },
    {
        colonCode: ":rocket:",
        unicode: "🚀",
    },
    {
        colonCode: ":guitar:",
        unicode: "🎸",
    },
    {
        colonCode: ":bomb:",
        unicode: "💣",
    },
    {
        colonCode: ":cinema:",
        unicode: "🎦",
    },
    {
        colonCode: ":scream:",
        unicode: "😱",
    },
    {
        colonCode: ":face_with_cowboy_hat:",
        unicode: "🤠",
    },
];

export type { Emoji };
export { EMOJI_LIST };
