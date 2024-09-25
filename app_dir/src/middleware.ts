
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServerAuthSession } from "./server/auth";

const requireAuthPages = ["/dashboard", "/settings"]


// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {

  const url = new URL(request.url)
  console.log(url.pathname)

  if (requireAuthPages.includes(url.pathname)) {
    console.log('require auth')

  }


  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    // '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}