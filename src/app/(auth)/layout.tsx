import type { Metadata } from "next";
import { Suspense } from "react";
import { PostAuthHandoff } from "@/components/auth/PostAuthHandoff";

export const metadata: Metadata = {
  title: "Account — The Sermon Coach",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-1 flex-col">
      <Suspense fallback={null}>
        <PostAuthHandoff />
      </Suspense>
      {children}
    </div>
  );
}
