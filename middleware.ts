import { type NextRequest, NextResponse } from 'next/server';
import { rootDomain } from '@/lib/utils'; // Keep if you use it for custom domains

// Your Render domain root (update if you change your project name)
const RENDER_ROOT_DOMAIN = 'sakib-kahadi-multi-tenet.onrender.com';

function extractSubdomain(request: NextRequest): string | null {
  const host = request.headers.get('host') || '';
  const hostname = host.split(':')[0]; // Remove port if any

  // 1. Localhost (dev)
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    const localMatch = hostname.match(/^([^.]+)\.localhost$/);
    if (localMatch) return localMatch[1];
    return null;
  }

  // 2. Preview deployment (e.g. tenant1.myproject.vercel.app)
  if (hostname.endsWith('.vercel.app')) {
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      return parts[0]; // tenant1
    }
  }

  // 3. Render domain subdomain (tenant1.sakib-kahadi-multi-tenet.onrender.com)
  if (hostname.endsWith(RENDER_ROOT_DOMAIN)) {
    const parts = hostname.split('.');
    // parts example: ['tenant1', 'sakib-kahadi-multi-tenet', 'onrender', 'com']
    // so subdomain is parts[0] if parts.length >=4
    if (parts.length >= 4) {
      return parts[0]; // tenant1
    }
  }

  // 4. Custom root domain (optional)
  if (rootDomain) {
    const root = rootDomain.split(':')[0];
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
    // Block access to /admin from subdomains
    if (pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Rewrite subdomain root (/) to /s/[subdomain]
    if (pathname === '/') {
      return NextResponse.rewrite(new URL(`/s/${subdomain}`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next|[\\w-]+\\.\\w+).*)'
  ]
};
