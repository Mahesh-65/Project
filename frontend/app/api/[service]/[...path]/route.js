import { NextResponse } from "next/server";

const serviceMap = {
  user: process.env.USER_SERVICE_URL || "http://user-service:4001",
  player: process.env.PLAYER_SERVICE_URL || "http://player-service:4002",
  team: process.env.TEAM_SERVICE_URL || "http://team-service:4003",
  tournament: process.env.TOURNAMENT_SERVICE_URL || "http://tournament-service:4004",
  ground: process.env.GROUND_SERVICE_URL || "http://ground-service:4005",
  shop: process.env.SHOP_SERVICE_URL || "http://shop-service:4006",
  admin: process.env.ADMIN_SERVICE_URL || "http://admin-service:4007"
};

async function proxy(req, { params }) {
  const { service, path = [] } = params;
  const base = serviceMap[service];
  if (!base) return NextResponse.json({ message: "Unknown service" }, { status: 404 });

  const qs = req.nextUrl.search || "";
  const target = `${base}/${path.join("/")}${qs}`;
  const body = req.method === "GET" || req.method === "HEAD" ? undefined : await req.text();

  const upstream = await fetch(target, {
    method: req.method,
    headers: {
      "content-type": req.headers.get("content-type") || "application/json",
      cookie: req.headers.get("cookie") || ""
    },
    body,
    cache: "no-store"
  });

  const text = await upstream.text();
  const response = new NextResponse(text, {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") || "application/json" }
  });

  const setCookie = upstream.headers.get("set-cookie");
  if (setCookie) response.headers.set("set-cookie", setCookie);
  return response;
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
