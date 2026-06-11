import { test, expect } from "@playwright/test";

test("locked match returns 409 via API", async ({ request }) => {
  const login = await request.post("/api/auth/login", {
    data: { name: "admin", pin: "1234" },
  });

  if (!login.ok()) {
    test.skip();
    return;
  }

  const matches = await request.get("/api/matches");
  const data = await matches.json();
  const locked = data.find((m: { locked: boolean }) => m.locked);

  if (!locked) {
    test.skip();
    return;
  }

  const res = await request.put(`/api/predictions/${locked.id}`, {
    data: { homeScore: 1, awayScore: 0 },
  });

  expect(res.status()).toBe(409);
});
