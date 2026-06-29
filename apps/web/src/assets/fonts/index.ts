import { Fraunces, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";

// Display: Fraunces — a characterful "old-style" serif with optical sizing, used with
// restraint for the masthead and section titles (the bulletin voice).
export const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  style: ["normal", "italic"],
});

// Body: Plus Jakarta Sans — a clean humanist sans for reading.
export const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Data: Geist Mono — every figure is set here, tabular, like a ledger.
export const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});
