import { vi } from "vitest";
import { SupabaseClientMock } from "./mocks/supabase-client";

vi.mock("../supabase-client", () => ({
    SupabaseClient: SupabaseClientMock,
}));
