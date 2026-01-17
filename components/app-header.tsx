"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function AppHeader() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | undefined>();

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserEmail(user?.email);
    };
    loadUser();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/signin");
  };

  return (
    <header className="border-b border-white/10 bg-black shadow-sm w-full">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <h1
          className="text-xl font-bold cursor-pointer hover:text-blue-400 transition-colors"
          onClick={() => router.push("/dashboard")}
        >
          MilEvalAI
        </h1>
        <div className="flex items-center gap-4">
          {userEmail && <span className="text-sm text-gray-400">{userEmail}</span>}
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black shadow-sm px-3 py-2 text-sm transition-colors hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
