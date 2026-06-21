import { ClerkProvider } from "@clerk/nextjs";

export const metadata = {
  title: "Archive 2k5",
  description: "Pre-loved clothes, picked with love. Pune only.",
};

export default function RootLayout({ children }) {
  const isDummy = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes("xxxx") || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (isDummy) {
    return (
      <html lang="en">
        <body style={{ margin: 0 }}>{children}</body>
      </html>
    );
  }

  return (
    <ClerkProvider>
      <html lang="en">
        <body style={{ margin: 0 }}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
