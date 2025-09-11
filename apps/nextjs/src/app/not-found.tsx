import Link from 'next/link';
import { Button } from '@saasfly/ui/button';

// 自定义 404 页面
export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-purple-50 to-blue-50 dark:from-purple-950 dark:via-purple-900 dark:to-gray-900 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        {/* 404 图标 */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
            <span className="text-4xl font-bold text-white">404</span>
          </div>
        </div>

        {/* 错误信息 */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          页面未找到
        </h1>
        
        <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
          抱歉，您访问的页面不存在或已被移动。
          <br />
          <span className="text-sm text-gray-500">
            Sorry, the page you are looking for could not be found.
          </span>
        </p>

        {/* 返回按钮 */}
        <div className="space-y-4">
          <Link href="/zh">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
              返回首页
            </Button>
          </Link>
          
          <div className="text-sm text-gray-500 space-x-4">
            <Link href="/zh" className="hover:text-purple-600 underline">
              首页
            </Link>
            <span>·</span>
            <Link href="/zh/image-to-prompt" className="hover:text-purple-600 underline">
              图像转提示词
            </Link>
            <span>·</span>
            <Link href="/zh/pricing" className="hover:text-purple-600 underline">
              价格
            </Link>
          </div>
        </div>

        {/* 额外信息 */}
        <div className="mt-12 text-xs text-gray-400">
          <p>错误代码: NOT_FOUND</p>
          <p>如果问题持续存在，请联系技术支持</p>
        </div>
      </div>
    </div>
  );
}
