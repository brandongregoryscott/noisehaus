
CREATE TABLE public.board_token (
    board_id uuid NOT NULL,
    board_slug varchar(64) NOT NULL,
    created_at timestamp WITH time zone NOT NULL DEFAULT NOW(),
    deleted_at timestamp WITH time zone NULL,
    id uuid NOT NULL DEFAULT gen_random_uuid (),
    token char(8) NOT NULL DEFAULT split_part(gen_random_uuid()::text, '-', 1),
    updated_at timestamp WITH time zone NULL,
    CONSTRAINT board_token_pkey PRIMARY KEY (id),
    CONSTRAINT board_token_board_id_fkey FOREIGN KEY (board_id) REFERENCES public.board (id) ON DELETE CASCADE,
    CONSTRAINT board_token_board_slug_fkey FOREIGN KEY (board_slug) REFERENCES public.board (slug) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT board_token_token_length CHECK (length(token) >= 6)
);

ALTER TABLE public.board_token enable ROW LEVEL SECURITY;

CREATE TRIGGER update_board_token_updated_at before
UPDATE ON public.board_token FOR each ROW EXECUTE PROCEDURE extensions.moddatetime(updated_at);