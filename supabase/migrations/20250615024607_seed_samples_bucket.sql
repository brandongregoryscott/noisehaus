INSERT INTO "storage"."buckets" (
        id,
        name,
        public,
        file_size_limit
    )
VALUES (
        'samples',
        'samples',
        false,
        5242880
    ) ON CONFLICT DO NOTHING;
