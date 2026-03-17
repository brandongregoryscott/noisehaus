import { kebabCase } from "lodash-es";
import { ADJECTIVES, ANIMAL_TYPES, COLORS } from "@/constants";
import { randomItem } from "@/utils/core-utils";

const generateSlug = (): string =>
    [randomItem(ADJECTIVES), randomItem(COLORS), randomItem(ANIMAL_TYPES)]
        .map(kebabCase)
        .join("-");

export { generateSlug };
