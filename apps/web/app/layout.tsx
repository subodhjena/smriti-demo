import type { Metadata } from "next";
import {
  ClerkProvider,
} from "@clerk/nextjs";
import './global.css';

export const metadata: Metadata = {
  title: 'Smriti - Spiritual Guidance',
  description: 'AI-powered spiritual guidance platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
