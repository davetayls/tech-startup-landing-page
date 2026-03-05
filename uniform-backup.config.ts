/**!
 * Uniform Project Example Backup and Restore
 * ==========================================
 *
 * Not Included
 * ------------
 * The following project data is not included in this backup:
 * 1. Integrations
 * 2. Project Settings
 * 3. Users
 *
 * Data Sources
 * ------------
 * Data Sources are backed up for reference, but they cannot be restored
 * automatically.
 *
 *
 * Restore from Disaster Process
 * ------------
 * 1. Create / use empty Uniform Project
 * 2. Setup Project Settings
 * 3. Add integrations manually
 * 4. Add Data Sources manually
 * 5. Run pnpm uniform:restore
 */
import { uniformConfig } from "@uniformdev/cli/config"

const state = process.env.BACKUP_STATE as 'preview' | 'published';
console.info(`Using backup state: ${state}`);

if (!['preview', 'published'].includes(state)) {
    throw new Error('BACKUP_STATE must be either "preview" or "published"');
}

const publishable = {
    state,
    publish: state === 'published'
} as const;

const config = uniformConfig({
    preset: "all",
    overrides: {
        serializationConfig: {
            mode: 'mirror',
            directory: `uniform-backup/${state}`,
        },
        entitiesConfig: {
            entry: publishable,
            entryPattern: publishable,
            composition: publishable,
            componentPattern: publishable,
            compositionPattern: publishable,
        }
    },
    disableEntities: ['webhook']
})

export default config;
