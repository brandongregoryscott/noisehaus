import { MAXIMUM_BOARD_SIZE_IN_BYTES } from "common";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { runInNewContext } from "node:vm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type TestDatabase = {
    close: () => void;
    exec: (sql: string) => void;
    prepare: (sql: string) => { all: () => unknown[] };
};

// Node 24 is the project's runtime; the older @types/node package does not
// declare node:sqlite yet. Keep this small test-only view of its native module.
type SQLiteModule = { DatabaseSync: new (filename: string) => TestDatabase };

const { DatabaseSync } = createRequire(__filename)(
    "node:sqlite"
) as SQLiteModule;
const migration = readFileSync(
    path.resolve(__dirname, "../1792278000_board_consistency.js"),
    "utf8"
);

describe("board consistency migration", () => {
    let database: TestDatabase;
    let apply: () => void;
    let rollback: () => void;
    const relations = {
        boardFiles: { cascadeDelete: false },
        boardTokens: { cascadeDelete: false },
        feedback: { cascadeDelete: false },
    };
    const settings = {
        batch: { enabled: false, maxBodySize: 0, maxRequests: 0, timeout: 0 },
    };

    beforeEach(() => {
        database = new DatabaseSync(":memory:");
        database.exec(
            "CREATE TABLE boardFiles (id TEXT PRIMARY KEY, boardId TEXT NOT NULL, size INTEGER NOT NULL)"
        );
        const app = {
            db: () => ({
                newQuery: (sql: string) => ({
                    execute: () => database.exec(sql),
                }),
            }),
            findCollectionByNameOrId: (name: keyof typeof relations) => ({
                fields: { getByName: () => relations[name] },
            }),
            save: vi.fn(),
            settings: () => settings,
        };
        runInNewContext(migration, {
            migrate: (
                up: (value: typeof app) => void,
                down: (value: typeof app) => void
            ) => {
                apply = () => up(app);
                rollback = () => down(app);
            },
        });
        apply();
    });

    afterEach(() => {
        database.close();
    });

    it("enables transactional batches and cascading board deletion", () => {
        expect(settings.batch).toMatchObject({
            enabled: true,
            maxRequests: 10,
        });
        expect(settings.batch.maxBodySize).toBeGreaterThan(
            MAXIMUM_BOARD_SIZE_IN_BYTES
        );
        expect(relations).toEqual({
            boardFiles: { cascadeDelete: true },
            boardTokens: { cascadeDelete: true },
            feedback: { cascadeDelete: true },
        });
    });

    it("accepts exactly the shared quota and rejects the next write", () => {
        const limit = MAXIMUM_BOARD_SIZE_IN_BYTES;

        database.exec(
            `INSERT INTO boardFiles VALUES ('first', 'board-a', ${limit})`
        );

        expect(() =>
            database.exec(
                "INSERT INTO boardFiles VALUES ('second', 'board-a', 1)"
            )
        ).toThrow("Board storage capacity exceeded");
        expect(
            database.prepare("SELECT COUNT(*) AS count FROM boardFiles").all()
        ).toEqual([{ count: 1 }]);
    });

    it("checks each write even when callers preflight the same remaining space", () => {
        database.exec(
            `INSERT INTO boardFiles VALUES ('existing', 'board-a', ${MAXIMUM_BOARD_SIZE_IN_BYTES - 10})`
        );

        database.exec(
            "INSERT INTO boardFiles VALUES ('upload-a', 'board-a', 6)"
        );

        expect(() =>
            database.exec(
                "INSERT INTO boardFiles VALUES ('upload-b', 'board-a', 6)"
            )
        ).toThrow("Board storage capacity exceeded");
    });

    it("counts all files without a pagination limit", () => {
        for (let index = 0; index < 501; index += 1) {
            database.exec(
                `INSERT INTO boardFiles VALUES ('file-${index}', 'board-a', 1)`
            );
        }

        const upload = () =>
            database.exec(
                `INSERT INTO boardFiles VALUES ('large', 'board-a', ${MAXIMUM_BOARD_SIZE_IN_BYTES - 500})`
            );

        expect(upload).toThrow("Board storage capacity exceeded");
    });

    it("counts replacement size once and allows shrinking a full board", () => {
        database.exec(
            `INSERT INTO boardFiles VALUES ('first', 'board-a', ${MAXIMUM_BOARD_SIZE_IN_BYTES - 5}), ('second', 'board-a', 5)`
        );

        database.exec("UPDATE boardFiles SET size = 4 WHERE id = 'second'");
        database.exec("UPDATE boardFiles SET size = 5 WHERE id = 'second'");

        expect(() =>
            database.exec("UPDATE boardFiles SET size = 6 WHERE id = 'second'")
        ).toThrow("Board storage capacity exceeded");
        expect(
            database
                .prepare("SELECT size FROM boardFiles WHERE id = 'second'")
                .all()
        ).toEqual([{ size: 5 }]);
    });

    it("allows recovery by shrinking a legacy over-quota board", () => {
        rollback();
        database.exec(
            `INSERT INTO boardFiles VALUES ('legacy', 'board-a', ${MAXIMUM_BOARD_SIZE_IN_BYTES + 10})`
        );
        apply();

        database.exec(
            `UPDATE boardFiles SET size = ${MAXIMUM_BOARD_SIZE_IN_BYTES + 5} WHERE id = 'legacy'`
        );

        expect(database.prepare("SELECT size FROM boardFiles").all()).toEqual([
            { size: MAXIMUM_BOARD_SIZE_IN_BYTES + 5 },
        ]);
    });

    it("enforces the destination board's quota when a file moves", () => {
        database.exec(
            `INSERT INTO boardFiles VALUES ('full', 'board-a', ${MAXIMUM_BOARD_SIZE_IN_BYTES}), ('moving', 'board-b', 1)`
        );

        const move = () =>
            database.exec(
                "UPDATE boardFiles SET boardId = 'board-a' WHERE id = 'moving'"
            );

        expect(move).toThrow("Board storage capacity exceeded");
    });

    it("keeps quotas independent for different boards", () => {
        database.exec(
            `INSERT INTO boardFiles VALUES ('full', 'board-a', ${MAXIMUM_BOARD_SIZE_IN_BYTES})`
        );

        database.exec("INSERT INTO boardFiles VALUES ('other', 'board-b', 1)");

        expect(
            database.prepare("SELECT COUNT(*) AS count FROM boardFiles").all()
        ).toEqual([{ count: 2 }]);
    });

    it("rolls back earlier uploads when a transaction exceeds quota", () => {
        database.exec(
            `INSERT INTO boardFiles VALUES ('existing', 'board-a', ${MAXIMUM_BOARD_SIZE_IN_BYTES - 10})`
        );
        database.exec("BEGIN");

        database.exec("INSERT INTO boardFiles VALUES ('first', 'board-a', 6)");
        expect(() =>
            database.exec(
                "INSERT INTO boardFiles VALUES ('second', 'board-a', 6)"
            )
        ).toThrow("Board storage capacity exceeded");
        database.exec("ROLLBACK");

        expect(database.prepare("SELECT id FROM boardFiles").all()).toEqual([
            { id: "existing" },
        ]);
    });

    it("removes constraints and restores cascade flags when rolled back", () => {
        rollback();

        expect(settings.batch.enabled).toBe(false);
        expect(
            database
                .prepare(
                    "SELECT name FROM sqlite_master WHERE type = 'trigger'"
                )
                .all()
        ).toEqual([]);
        expect(relations.boardTokens.cascadeDelete).toBe(false);
    });
});
