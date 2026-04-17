import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const ALLOWED_DOMAIN = "tfg.co.za";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/explore";

  if (!code) {
    return NextResponse.redirect(new URL("/auth/sign-in?error=auth_failed", origin));
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/auth/sign-in?error=auth_failed", origin));
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.redirect(new URL("/auth/sign-in?error=auth_failed", origin));
  }

  // Domain check
  if (!user.email.endsWith(`@${ALLOWED_DOMAIN}`)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/auth/sign-in?error=unauthorized_domain", origin));
  }

  // Ensure user record exists in DB
  const dbUser = await prisma.user.upsert({
    where: { id: user.id },
    update: { email: user.email },
    create: {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name ?? user.email.split("@")[0],
      image: user.user_metadata?.avatar_url ?? null,
    },
    select: { team: true },
  });

  // New users (no team set) go through onboarding first, preserving the post-auth destination
  if (!dbUser.team) {
    const helloUrl = new URL("/hello", origin);
    if (next !== "/explore") helloUrl.searchParams.set("redirect", next);
    return NextResponse.redirect(helloUrl);
  }

  return NextResponse.redirect(new URL(next, origin));
}
