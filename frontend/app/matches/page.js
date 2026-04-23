export default async function MatchesPage() {
  const res = await fetch(process.env.PLAYER_SERVICE_URL ? `${process.env.PLAYER_SERVICE_URL}/matches` : "http://player-service:4002/matches", { cache: "no-store" }).catch(() => null);
  const matches = res && res.ok ? await res.json() : [];
  return (<section><h2>Matches</h2><div className="grid">{matches.map((m) => <article className="card" key={m.id}><h3>{m.title}</h3><p className="muted">{m.sport} | {m.location}</p></article>)}</div></section>);
}
