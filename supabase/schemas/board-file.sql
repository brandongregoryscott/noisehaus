
CREATE TABLE public.board_file (
    board_id uuid NOT NULL,
    board_slug varchar(64) NOT NULL,
    created_at timestamp WITH time zone NOT NULL DEFAULT NOW(),
    deleted_at timestamp WITH time zone NULL,
    display_name text NOT NULL,
    emoji varchar(128) NULL,
    id uuid NOT NULL,
    position smallint NULL,
    size bigint NOT NULL,
    updated_at timestamp WITH time zone NULL,
    CONSTRAINT board_file_pkey PRIMARY KEY (id),
    CONSTRAINT board_file_fkey FOREIGN KEY (id) REFERENCES STORAGE.objects (id) ON DELETE CASCADE,
    CONSTRAINT board_file_board_id_fkey FOREIGN KEY (board_id) REFERENCES public.board (id) ON DELETE CASCADE,
    CONSTRAINT board_file_board_slug_fkey FOREIGN KEY (board_slug) REFERENCES public.board (slug) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT board_file_display_name_length CHECK (length(display_name) >= 1)
);

ALTER TABLE public.board_file enable ROW LEVEL SECURITY;

CREATE TRIGGER update_board_file_updated_at before
UPDATE ON public.board_file FOR each ROW EXECUTE PROCEDURE extensions.moddatetime(updated_at);