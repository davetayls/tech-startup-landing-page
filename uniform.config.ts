import { uniformConfig } from "@uniformdev/cli/config";

const createOrUpdatePush = {
    push: {
        mode: "createOrUpdate"
    },
} as const;

const allConfig = uniformConfig({
    preset: "all",
    overrides: {
        entitiesConfig: {
            entry: createOrUpdatePush,
            entryPattern: createOrUpdatePush,
            composition: createOrUpdatePush,
            componentPattern: createOrUpdatePush
        }
    },
    disableEntities: ['webhook']
})

export default allConfig;

