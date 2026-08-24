import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Household Ledger",
  description: "Rental applicant and tenant management",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-bg text-ink">{children}</body>
    </html>
  );
}
