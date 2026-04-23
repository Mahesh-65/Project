const cards = [
  ["Player Discovery", "Find players by sport, city, skill, and availability."],
  ["Team Management", "Create teams, invite members, track wins/losses."],
  ["Tournaments", "Auto fixtures, rankings, and live score updates."],
  ["Ground Booking", "Search turfs, reserve slots, split expenses."],
  ["Sports Shop", "Buy gear, jerseys, and track orders/invoices."],
  ["Admin Analytics", "Moderation, reports, and revenue dashboards."]
];

export default function HomePage() {
  return (
    <section>
      <h2>Modern Sports Community Platform</h2>
      <p className="muted">Responsive microservices-based app with cookie sessions, Redis cache, and Docker deployment.</p>
      <div className="grid">
        {cards.map((c) => (
          <article className="card" key={c[0]}>
            <h3>{c[0]}</h3>
            <p className="muted">{c[1]}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
