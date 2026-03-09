import { faker } from "@faker-js/faker/locale/en";

/**
 * Returns a random suffix for appending to a slug or other field that needs to be unique.
 */
const randomSuffix = (): string =>
    faker.internet.ipv6().replace(/\:/g, "").slice(0, 5);

export { randomSuffix };
