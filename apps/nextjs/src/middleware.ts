import { NextRequest, NextResponse } from 'next/server';

// 安全的中间件实现 - 修复 MIDDLEWARE_INVOCATION_FAILED 错误
export async function middleware(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;
    
    // 跳过所有静态资源和 API 路由
    if (
      pathname.includes('.') ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api/') ||
      pathname.startsWith('/trpc/') ||
      pathname.startsWith('/favicon.ico') ||
      pathname.startsWith('/logo.svg') ||
      pathname.includes('_logs')
    ) {
      return NextResponse.next();
    }

    const supportedLocales = ['en', 'zh', 'ko', 'ja'];
    const defaultLocale = 'zh';

    // 检查是否已经有locale路径
    const hasLocale = supportedLocales.some(locale => 
      pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    // 防止重定向循环 - 检查是否已经在重定向
    const isRedirecting = request.headers.get('x-middleware-redirect');
    if (isRedirecting) {
      return NextResponse.next();
    }

    // 只对根路径进行重定向
    if (pathname === '/') {
      const response = NextResponse.redirect(new URL(`/${defaultLocale}`, request.url));
      response.headers.set('x-middleware-redirect', '1');
      return response;
    }

    // 对没有locale的路径进行重定向（但排除特殊路径）
    const excludePaths = ['/admin', '/health', '/status'];
    const shouldExclude = excludePaths.some(path => pathname.startsWith(path));
    
    if (!hasLocale && !shouldExclude && pathname.length > 1) {
      const response = NextResponse.redirect(new URL(`/${defaultLocale}${pathname}`, request.url));
      response.headers.set('x-middleware-redirect', '1');
      return response;
    }

    return NextResponse.next();
  } catch (error) {
    // 安全的错误处理 - 记录错误但不抛出
    console.error('❌ Middleware error:', {
      pathname: request.nextUrl.pathname,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
    
    // 发生错误时直接放行请求
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径除了:
     * 1. /api routes (API routes)
     * 2. /_next (Next.js internals)
     * 3. /_logs (Vercel logs)
     * 4. /static files (assets with file extensions)
     */
    '/((?!api|_next|_logs|.*\\.).+)',
  ],
};
