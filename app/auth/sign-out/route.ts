import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const res = NextResponse.redirect(new URL("/auth/sign-in", process.env.NEXT_PUBLIC_APP_URL!));
  // Clear onboarded cookie so if they sign in with a different (new) account it goes through onboarding
  res.cookies.set("onboarded", "", { path: "/", maxAge: 0 });
  return res;
}
