CREATE TABLE public.feedback (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    board_id uuid NULL,
    board_slug varchar(64) NULL,
    created_at timestamp WITH time zone NOT NULL DEFAULT NOW(),
    email text NULL,
    feedback text NOT NULL,
    CONSTRAINT feedback_pkey PRIMARY KEY (id),
    CONSTRAINT feedback_board_id_fkey FOREIGN KEY (board_id) REFERENCES public.board (id) ON DELETE SET NULL,
    CONSTRAINT feedback_board_slug_fkey FOREIGN KEY (board_slug) REFERENCES public.board (slug) ON DELETE SET NULL ON UPDATE CASCADE
);

ALTER TABLE public.feedback enable ROW LEVEL SECURITY;
