const cards = [
  ["Create or Join Matches", "Discover players by location and schedule games instantly.", "/matches"],
  ["Build Teams", "Manage captains, invites, and team performance.", "/teams"],
  ["Run Tournaments", "Generate fixtures and monitor standings in real-time.", "/tournaments"],
  ["Book Grounds", "Search turfs, reserve slots, and split expenses fairly.", "/grounds"],
  ["Sports Store", "Handle products, orders, and equipment checkout.", "/shop"],
  ["Admin Operations", "Review reports, moderation, and growth metrics.", "/admin"]
];

export default function HomePage() {
  return (
    <section className="dashboard">
      <div className="hero card">
        <h2>Welcome to your Sports Command Center</h2>
        <p className="muted">Manage players, matches, teams, tournaments, grounds, and storefront workflows from one dashboard.</p>
      </div>
      <div className="grid">
        {cards.map((c) => (
          <article className="card" key={c[0]}>
            <h3>{c[0]}</h3>
            <p className="muted">{c[1]}</p>
            <a className="cta-link" href={c[2]}>
              Open Module
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
