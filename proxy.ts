import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set("x-pathname", request.nextUrl.pathname);
  const theme = request.cookies.get("rotu-army-umt-theme")?.value;
  if (theme) {
    response.headers.set("x-theme", theme);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon|images|api|auth).*)"],
};
