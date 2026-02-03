import { NextRequest, NextResponse } from "next/server";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
  : "http://localhost:3000/api/auth/google/callback";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/?auth=error&message=" + error, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/?auth=error&message=no_code", request.url));
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(new URL("/?auth=error&message=not_configured", request.url));
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenResponse.json();

    if (tokens.error) {
      return NextResponse.redirect(
        new URL("/?auth=error&message=" + tokens.error, request.url)
      );
    }

    // Redirect back with tokens encoded in URL (in production, use secure cookies or session)
    const redirectUrl = new URL("/", request.url);
    redirectUrl.searchParams.set("auth", "success");
    redirectUrl.searchParams.set("access_token", tokens.access_token);
    if (tokens.refresh_token) {
      redirectUrl.searchParams.set("refresh_token", tokens.refresh_token);
    }

    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error("Token exchange error:", err);
    return NextResponse.redirect(new URL("/?auth=error&message=token_exchange_failed", request.url));
  }
}
