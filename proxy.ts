import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — do not remove this
  const { data: { user } } = await supabase.auth.getUser();

  const isAuthPath = request.nextUrl.pathname.startsWith("/auth");
  const isSharePath = request.nextUrl.pathname.startsWith("/share");
  const isHelloPath = request.nextUrl.pathname.startsWith("/hello");
  const isTourPath = request.nextUrl.pathname.startsWith("/tour");
  const isOnboarded = request.cookies.get("onboarded")?.value === "1";

  // Unauthenticated: redirect to sign-in (except auth/share/hello/tour routes)
  if (!user && !isAuthPath && !isSharePath && !isHelloPath && !isTourPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/sign-in";
    return NextResponse.redirect(url);
  }

  // Onboarded users must not be able to go back to sign-in or onboarding
  if (user && isOnboarded && (isAuthPath || isHelloPath)) {
    const url = request.nextUrl.clone();
    url.pathname = "/explore";
    return NextResponse.redirect(url);
  }

  // Authenticated but not onboarded on sign-in page: send to explore
  if (user && !isOnboarded && request.nextUrl.pathname === "/auth/sign-in") {
    const url = request.nextUrl.clone();
    url.pathname = "/explore";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|fonts/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ttf|woff|woff2|json)$).*)",
  ],
};
