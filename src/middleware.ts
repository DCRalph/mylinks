import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from 'next-auth/react';
import { api } from './utils/api';


export async function middleware(request: NextRequest) {



  // if (user.data?.user?.requireSetup == true) {
  //   return NextResponse.redirect('/setup')
  // }


}

// See "Matching Paths" below to learn more
export const config = {
  // matcher: '/:path*',
}