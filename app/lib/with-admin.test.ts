import { beforeEach, describe, expect, it, vi } from "vitest";

const { auth } = vi.hoisted(() => ({ auth: vi.fn() }));
vi.mock("@/auth", () => ({ auth }));

import { withAdmin } from "@/app/lib/with-admin";

describe("withAdmin", () => {
  beforeEach(() => {
    auth.mockReset();
  });

  it("rejects a request with no session with 401 and doesn't run the handler", async () => {
    auth.mockResolvedValue(null);
    const handler = vi.fn<(req: Request) => Promise<Response>>(
      async () => Response.json({ ok: true }),
    );

    const res = await withAdmin(handler)(new Request("http://test/api/admin/x"));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
    expect(handler).not.toHaveBeenCalled();
  });

  it("rejects a signed-in user without the admin role with 401", async () => {
    auth.mockResolvedValue({ user: { name: "Someone" } });
    const handler = vi.fn<(req: Request) => Promise<Response>>(
      async () => Response.json({ ok: true }),
    );

    const res = await withAdmin(handler)(new Request("http://test/api/admin/x"));

    expect(res.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("runs the handler for an admin with its request and route context, returning its response", async () => {
    auth.mockResolvedValue({ user: { name: "Admin", role: "admin" } });
    const handler = vi.fn(
      async (_req: Request, { params }: { params: Promise<{ id: string }> }) =>
        Response.json({ id: (await params).id }, { status: 201 }),
    );
    const req = new Request("http://test/api/admin/albums/abc");

    const res = await withAdmin(handler)(req, {
      params: Promise.resolve({ id: "abc" }),
    });

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: "abc" });
    expect(handler.mock.calls[0][0]).toBe(req);
  });
});
