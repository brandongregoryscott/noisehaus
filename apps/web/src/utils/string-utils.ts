import { faker } from "@faker-js/faker/locale/en";
import { kebabCase } from "lodash-es";

const generateSlug = (): string =>
    [faker.hacker.ingverb(), faker.color.human(), faker.animal.type()]
        .map(kebabCase)
        .join("-");

export { generateSlug };
