import { redirect } from 'next/navigation';

// 根路径重定向页面 - 修复 404 NOT_FOUND 错误
export default function RootPage() {
  // 重定向到默认语言页面
  redirect('/zh');
}
