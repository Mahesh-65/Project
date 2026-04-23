const cards = [
  ["Login & Profile", "Session-based authentication and user profile management.", "/auth"],
  ["Player Discovery & Matches", "Create/join games and list upcoming matches.", "/matches"],
  ["Team Management", "Create teams and join with invite code.", "/teams"],
  ["Tournaments", "Create tournaments and generate fixtures.", "/tournaments"],
  ["Ground Booking", "Add/search grounds and create bookings.", "/grounds"],
  ["Sports Shop", "Manage products and checkout test orders.", "/shop"],
  ["Admin Dashboard", "Check reports and analytics view.", "/admin"]
];

export default function HomePage() {
  return (
    <section>
      <h2>Sports Community Platform</h2>
      <p className="muted">All pages below are interactive and connected through frontend API proxy routes.</p>
      <div className="grid">
        {cards.map((c) => (
          <article className="card" key={c[0]}>
            <h3>{c[0]}</h3>
            <p className="muted">{c[1]}</p>
            <a href={c[2]}>Open module</a>
          </article>
        ))}
      </div>
    </section>
  );
}
