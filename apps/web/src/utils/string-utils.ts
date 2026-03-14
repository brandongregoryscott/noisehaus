import { kebabCase } from "lodash-es";
import { ADJECTIVES, ANIMAL_TYPES, COLORS } from "@/constants";

const generateSlug = (): string =>
    [randomItem(ADJECTIVES), randomItem(COLORS), randomItem(ANIMAL_TYPES)]
        .map(kebabCase)
        .join("-");

const randomItem = <T>(items: T[]): T =>
    items[Math.floor(Math.random() * items.length)];

export { generateSlug };
