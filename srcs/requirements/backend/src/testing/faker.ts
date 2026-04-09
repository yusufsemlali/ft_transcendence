import { faker } from '@faker-js/faker';

const envSeed = process.env.FAKER_SEED;
if (envSeed) {
    faker.seed(Number(envSeed));
}

export { faker };

export function setSeed(seed?: number) {
    faker.seed(seed);
}
