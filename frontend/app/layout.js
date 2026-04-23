import "./globals.css";

export const metadata = { title: "Sports Community", description: "Find players, teams, tournaments, grounds, and gear." };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="header">
          <h1>Sports Community</h1>
          <nav>
            <a href="/">Home</a>
            <a href="/matches">Matches</a>
            <a href="/teams">Teams</a>
            <a href="/tournaments">Tournaments</a>
            <a href="/grounds">Grounds</a>
            <a href="/shop">Shop</a>
            <a href="/admin">Admin</a>
          </nav>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
