import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const lang = req.headers.get('accept-language')?.split(',')[0].split('-')[0] || 'en';
  const url = req.nextUrl.clone();

  if (!url.pathname.startsWith(`/${lang}`) && ['en','cs'].includes(lang)) {
    url.pathname = `/${lang}${url.pathname}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
