import { NextRequest, NextResponse } from 'next/server';

// 简化的中间件实现 - 专注于根路径重定向
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  console.log('🔄 Middleware processing:', pathname);

  // 跳过 API 路由和静态资源
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    console.log('⏭️ Skipping:', pathname);
    return NextResponse.next();
  }

  const supportedLocales = ['en', 'zh', 'ko', 'ja'];
  const defaultLocale = 'zh';

  // 检查是否已有语言前缀
  const hasLocale = supportedLocales.some(locale => 
    pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // 处理根路径重定向
  if (pathname === '/') {
    console.log('🔄 Redirecting root to:', `/${defaultLocale}`);
    return NextResponse.redirect(new URL(`/${defaultLocale}`, request.url));
  }

  // 处理没有语言前缀的路径（排除管理员路径）
  if (!hasLocale && !pathname.startsWith('/admin')) {
    console.log('🔄 Adding locale to:', pathname);
    return NextResponse.redirect(new URL(`/${defaultLocale}${pathname}`, request.url));
  }

  console.log('✅ Proceeding with:', pathname);
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 匹配除了以下内容的所有请求:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - 文件扩展名（如 .js, .css, .png 等）
     */
    '/((?!api/|_next/static|_next/image|favicon.ico|.*\\..*).+)',
    '/',
  ],
};
