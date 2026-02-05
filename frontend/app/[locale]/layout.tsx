import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { DM_Sans } from "next/font/google";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { setRequestLocale } from 'next-intl/server';
import "../globals.css"; // Fixed path
import { Providers } from "@/components/providers";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "BankToBook AI",
  description: "Convert & Split Bank Statements Automatically",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Ensure compliance with valid locales
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${dmSans.className} antialiased bg-background text-foreground transition-colors duration-500`}
      >
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Providers locale={locale}>
            {children}
          </Providers>
        </NextIntlClientProvider>
      </body>
      <GoogleAnalytics gaId="G-GC3QGCL5YW" />
    </html>
  );
}