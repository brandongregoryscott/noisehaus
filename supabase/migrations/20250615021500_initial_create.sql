create extension if not exists "moddatetime" with schema "extensions";


create table "public"."board" (
    "created_at" timestamp with time zone not null default now(),
    "deleted_at" timestamp with time zone,
    "id" uuid not null default gen_random_uuid(),
    "name" character varying(256) not null,
    "slug" character varying(64) not null,
    "updated_at" timestamp with time zone,
    "view_permission" text not null default 'by_slug'::text
);


alter table "public"."board" enable row level security;

create table "public"."board_file" (
    "board_id" uuid not null,
    "board_slug" character varying(64) not null,
    "created_at" timestamp with time zone not null default now(),
    "deleted_at" timestamp with time zone,
    "display_name" text not null,
    "emoji" character varying(128),
    "id" uuid not null,
    "position" smallint,
    "size" bigint not null,
    "updated_at" timestamp with time zone
);


alter table "public"."board_file" enable row level security;

create table "public"."board_token" (
    "board_id" uuid not null,
    "board_slug" character varying(64) not null,
    "created_at" timestamp with time zone not null default now(),
    "deleted_at" timestamp with time zone,
    "id" uuid not null default gen_random_uuid(),
    "token" character(8) not null default split_part((gen_random_uuid())::text, '-'::text, 1),
    "updated_at" timestamp with time zone
);


alter table "public"."board_token" enable row level security;

CREATE UNIQUE INDEX board_file_pkey ON public.board_file USING btree (id);

CREATE UNIQUE INDEX board_pkey ON public.board USING btree (id);

CREATE UNIQUE INDEX board_slug_key ON public.board USING btree (slug);

CREATE UNIQUE INDEX board_token_pkey ON public.board_token USING btree (id);

alter table "public"."board" add constraint "board_pkey" PRIMARY KEY using index "board_pkey";

alter table "public"."board_file" add constraint "board_file_pkey" PRIMARY KEY using index "board_file_pkey";

alter table "public"."board_token" add constraint "board_token_pkey" PRIMARY KEY using index "board_token_pkey";

alter table "public"."board" add constraint "board_name_length" CHECK ((length((name)::text) >= 1)) not valid;

alter table "public"."board" validate constraint "board_name_length";

alter table "public"."board" add constraint "board_slug_key" UNIQUE using index "board_slug_key";

alter table "public"."board" add constraint "board_slug_length" CHECK ((length((slug)::text) >= 6)) not valid;

alter table "public"."board" validate constraint "board_slug_length";

alter table "public"."board" add constraint "board_view_permission_check" CHECK ((view_permission = ANY (ARRAY['by_token'::text, 'by_slug'::text, 'public'::text]))) not valid;

alter table "public"."board" validate constraint "board_view_permission_check";

alter table "public"."board_file" add constraint "board_file_board_id_fkey" FOREIGN KEY (board_id) REFERENCES board(id) ON DELETE CASCADE not valid;

alter table "public"."board_file" validate constraint "board_file_board_id_fkey";

alter table "public"."board_file" add constraint "board_file_board_slug_fkey" FOREIGN KEY (board_slug) REFERENCES board(slug) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."board_file" validate constraint "board_file_board_slug_fkey";

alter table "public"."board_file" add constraint "board_file_display_name_length" CHECK ((length(display_name) >= 1)) not valid;

alter table "public"."board_file" validate constraint "board_file_display_name_length";

alter table "public"."board_file" add constraint "board_file_fkey" FOREIGN KEY (id) REFERENCES storage.objects(id) ON DELETE CASCADE not valid;

alter table "public"."board_file" validate constraint "board_file_fkey";

alter table "public"."board_token" add constraint "board_token_board_id_fkey" FOREIGN KEY (board_id) REFERENCES board(id) ON DELETE CASCADE not valid;

alter table "public"."board_token" validate constraint "board_token_board_id_fkey";

alter table "public"."board_token" add constraint "board_token_board_slug_fkey" FOREIGN KEY (board_slug) REFERENCES board(slug) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."board_token" validate constraint "board_token_board_slug_fkey";

alter table "public"."board_token" add constraint "board_token_token_length" CHECK ((length(token) >= 6)) not valid;

alter table "public"."board_token" validate constraint "board_token_token_length";

grant delete on table "public"."board" to "anon";

grant insert on table "public"."board" to "anon";

grant references on table "public"."board" to "anon";

grant select on table "public"."board" to "anon";

grant trigger on table "public"."board" to "anon";

grant truncate on table "public"."board" to "anon";

grant update on table "public"."board" to "anon";

grant delete on table "public"."board" to "authenticated";

grant insert on table "public"."board" to "authenticated";

grant references on table "public"."board" to "authenticated";

grant select on table "public"."board" to "authenticated";

grant trigger on table "public"."board" to "authenticated";

grant truncate on table "public"."board" to "authenticated";

grant update on table "public"."board" to "authenticated";

grant delete on table "public"."board" to "service_role";

grant insert on table "public"."board" to "service_role";

grant references on table "public"."board" to "service_role";

grant select on table "public"."board" to "service_role";

grant trigger on table "public"."board" to "service_role";

grant truncate on table "public"."board" to "service_role";

grant update on table "public"."board" to "service_role";

grant delete on table "public"."board_file" to "anon";

grant insert on table "public"."board_file" to "anon";

grant references on table "public"."board_file" to "anon";

grant select on table "public"."board_file" to "anon";

grant trigger on table "public"."board_file" to "anon";

grant truncate on table "public"."board_file" to "anon";

grant update on table "public"."board_file" to "anon";

grant delete on table "public"."board_file" to "authenticated";

grant insert on table "public"."board_file" to "authenticated";

grant references on table "public"."board_file" to "authenticated";

grant select on table "public"."board_file" to "authenticated";

grant trigger on table "public"."board_file" to "authenticated";

grant truncate on table "public"."board_file" to "authenticated";

grant update on table "public"."board_file" to "authenticated";

grant delete on table "public"."board_file" to "service_role";

grant insert on table "public"."board_file" to "service_role";

grant references on table "public"."board_file" to "service_role";

grant select on table "public"."board_file" to "service_role";

grant trigger on table "public"."board_file" to "service_role";

grant truncate on table "public"."board_file" to "service_role";

grant update on table "public"."board_file" to "service_role";

grant delete on table "public"."board_token" to "anon";

grant insert on table "public"."board_token" to "anon";

grant references on table "public"."board_token" to "anon";

grant select on table "public"."board_token" to "anon";

grant trigger on table "public"."board_token" to "anon";

grant truncate on table "public"."board_token" to "anon";

grant update on table "public"."board_token" to "anon";

grant delete on table "public"."board_token" to "authenticated";

grant insert on table "public"."board_token" to "authenticated";

grant references on table "public"."board_token" to "authenticated";

grant select on table "public"."board_token" to "authenticated";

grant trigger on table "public"."board_token" to "authenticated";

grant truncate on table "public"."board_token" to "authenticated";

grant update on table "public"."board_token" to "authenticated";

grant delete on table "public"."board_token" to "service_role";

grant insert on table "public"."board_token" to "service_role";

grant references on table "public"."board_token" to "service_role";

grant select on table "public"."board_token" to "service_role";

grant trigger on table "public"."board_token" to "service_role";

grant truncate on table "public"."board_token" to "service_role";

grant update on table "public"."board_token" to "service_role";

CREATE TRIGGER update_board_updated_at BEFORE UPDATE ON public.board FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');

CREATE TRIGGER update_board_file_updated_at BEFORE UPDATE ON public.board_file FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');

CREATE TRIGGER update_board_token_updated_at BEFORE UPDATE ON public.board_token FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');


