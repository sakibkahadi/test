import { type NextRequest, NextResponse } from 'next/server';

// Hardcoded root domain
const CUSTOM_ROOT_DOMAIN = 'upturnbd.com';

function extractSubdomain(request: NextRequest): string | null {
  const host = request.headers.get('host') || '';
  const hostname = host.split(':')[0]; // Remove port if present

  // 1. Localhost (development)
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    const localMatch = hostname.match(/^([^.]+)\.localhost$/);
    if (localMatch) return localMatch[1];
    return null;
  }

  // 2. Vercel preview domain (tenant1.myproject.vercel.app)
  if (hostname.endsWith('.vercel.app')) {
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      return parts[0]; // tenant1
    }
  }

  // 3. Custom root domain (tenant1.upturnbd.com)
  if (CUSTOM_ROOT_DOMAIN) {
    const root = CUSTOM_ROOT_DOMAIN.split(':')[0];
    if (
      hostname !== root &&
      hostname !== `www.${root}` &&
      hostname.endsWith(`.${root}`)
    ) {
      return hostname.replace(`.${root}`, '');
    }
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const subdomain = extractSubdomain(request);

  if (subdomain) {
    // Block access to /admin for subdomain tenants
    if (pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Rewrite "/" to "/s/[subdomain]"
    if (pathname === '/') {
      return NextResponse.rewrite(new URL(`/s/${subdomain}`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Exclude static files, API routes, and public files
    '/((?!api|_next|[\\w-]+\\.\\w+).*)',
  ],
};
