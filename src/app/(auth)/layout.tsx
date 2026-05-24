import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account — The Sermon Coach",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="flex flex-1 flex-col">{children}</div>;
}
