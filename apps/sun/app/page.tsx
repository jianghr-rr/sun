export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Sun</h1>
        <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
          项目已初始化为干净的 Next.js 代码库，你可以从这里开始构建业务页面。
        </p>
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          <p className="font-medium text-slate-900 dark:text-slate-100">
            下一步建议
          </p>
          <ul className="mt-3 space-y-2">
            <li>在 `app/` 下新增页面或路由</li>
            <li>在 `app/globals.css` 中调整全局样式</li>
            <li>按需安装 UI 或状态管理依赖</li>
          </ul>
        </div>
      </div>
    </main>
  )
}

