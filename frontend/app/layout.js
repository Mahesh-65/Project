import "./globals.css";
import AppShell from "../components/AppShell";
import { Manrope } from "next/font/google";

const manrope = Manrope({ subsets: ["latin"] });

export const metadata = { title: "Sports Community", description: "Find players, teams, tournaments, grounds, and gear." };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={manrope.className}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
