import "./globals.css";
import AppShell from "../components/AppShell";
import { Manrope } from "next/font/google";

const manrope = Manrope({ subsets: ["latin"] });

export const metadata = {
  title: "SportsHub — Your Sports Command Center",
  description: "Find players, build teams, run tournaments, book grounds and shop gear — all in one premium platform.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={manrope.className}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
