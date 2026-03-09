import { vi } from "vitest";
import { SupabaseClientMock } from "@/test/mocks/supabase-client";

vi.mock("../supabase-client", () => ({
    SupabaseClient: SupabaseClientMock,
}));
