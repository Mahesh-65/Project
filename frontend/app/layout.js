import "./globals.css";
import AppShell from "../components/AppShell";

export const metadata = { title: "Sports Community", description: "Find players, teams, tournaments, grounds, and gear." };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
