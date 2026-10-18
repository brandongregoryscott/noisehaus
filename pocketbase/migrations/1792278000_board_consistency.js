/// <reference path="../data/types.d.ts" />
migrate(
    (app) => {
        for (const name of ["boardFiles", "boardTokens", "feedback"]) {
            const collection = app.findCollectionByNameOrId(name);
            collection.fields.getByName("boardId").cascadeDelete = true;
            app.save(collection);
        }

        const settings = app.settings();
        settings.batch.enabled = true;
        settings.batch.maxRequests = Math.max(settings.batch.maxRequests, 10);
        settings.batch.timeout = Math.max(settings.batch.timeout, 10);
        settings.batch.maxBodySize = Math.max(
            settings.batch.maxBodySize,
            12 * 1024 * 1024
        );
        app.save(settings);

        // Match common/MAXIMUM_BOARD_SIZE_IN_BYTES. Enforce at the write itself:
        // application preflight checks cannot serialize concurrent API instances.
        app.db()
            .newQuery(
                `
        CREATE TRIGGER board_files_quota_insert
        BEFORE INSERT ON boardFiles
        WHEN NEW.size + COALESCE((SELECT SUM(size) FROM boardFiles WHERE boardId = NEW.boardId), 0) > 10485760
        BEGIN
            SELECT RAISE(ABORT, 'Board storage capacity exceeded');
        END
    `
            )
            .execute();

        app.db()
            .newQuery(
                `
        CREATE TRIGGER board_files_quota_update
        BEFORE UPDATE OF size, boardId ON boardFiles
        WHEN (NEW.size > OLD.size OR NEW.boardId != OLD.boardId)
            AND NEW.size + COALESCE((SELECT SUM(size) FROM boardFiles WHERE boardId = NEW.boardId AND id != OLD.id), 0) > 10485760
        BEGIN
            SELECT RAISE(ABORT, 'Board storage capacity exceeded');
        END
    `
            )
            .execute();
    },
    (app) => {
        app.db()
            .newQuery("DROP TRIGGER IF EXISTS board_files_quota_insert")
            .execute();
        app.db()
            .newQuery("DROP TRIGGER IF EXISTS board_files_quota_update")
            .execute();

        for (const name of ["boardFiles", "boardTokens", "feedback"]) {
            const collection = app.findCollectionByNameOrId(name);
            collection.fields.getByName("boardId").cascadeDelete = false;
            app.save(collection);
        }

        const settings = app.settings();
        settings.batch.enabled = false;
        app.save(settings);
    }
);
