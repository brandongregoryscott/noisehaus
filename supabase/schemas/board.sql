
CREATE TABLE public.board (
    created_at timestamp WITH time zone NOT NULL DEFAULT NOW(),
    deleted_at timestamp WITH time zone NULL,
    id uuid NOT NULL DEFAULT gen_random_uuid (),
    name varchar(256) NOT NULL,
    slug varchar(64) NOT NULL,
    updated_at timestamp WITH time zone NULL,
    view_permission text NOT NULL DEFAULT 'by_slug'::text,
    CONSTRAINT board_pkey PRIMARY KEY (id),
    CONSTRAINT board_slug_key UNIQUE (slug),
    CONSTRAINT board_name_length CHECK (length(name) >= 1),
    CONSTRAINT board_slug_length CHECK (length(slug) >= 6),
    CONSTRAINT board_view_permission_check CHECK (
        (
            view_permission = any (
                array ['by_token'::text, 'by_slug'::text, 'public'::text]
            )
        )
    )
);

ALTER TABLE public.board enable ROW LEVEL SECURITY;

CREATE TRIGGER update_board_updated_at before
UPDATE ON public.board FOR each ROW EXECUTE PROCEDURE extensions.moddatetime(updated_at);