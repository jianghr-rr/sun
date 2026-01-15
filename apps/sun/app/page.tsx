export default function HomePage() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-slate-200/70 dark:border-slate-800">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
              S
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Sun Workspace
              </p>
              <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                让项目更清晰
              </p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
            <a className="hover:text-slate-900 dark:hover:text-white" href="#">
              产品
            </a>
            <a className="hover:text-slate-900 dark:hover:text-white" href="#">
              解决方案
            </a>
            <a className="hover:text-slate-900 dark:hover:text-white" href="#">
              文档
            </a>
            <a className="hover:text-slate-900 dark:hover:text-white" href="#">
              定价
            </a>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <button className="btn btn-secondary">登录</button>
            <button className="btn btn-primary">开始使用</button>
          </div>
          <button className="btn btn-secondary md:hidden" aria-label="打开菜单">
            菜单
          </button>
        </div>
      </header>

      <section className="section">
        <div className="container grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <span className="badge">Beta 版本开放中</span>
            <h1 className="mt-4">一个面向团队的轻量项目空间</h1>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
              Sun 帮助你把任务、讨论、资料与里程碑统一在同一空间中，自动对齐节奏，减少重复沟通。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button className="btn btn-primary">预约演示</button>
              <button className="btn btn-secondary">查看产品手册</button>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              <div>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  2x
                </p>
                <p className="muted text-sm">交付速度提升</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  48%
                </p>
                <p className="muted text-sm">会议时间降低</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  7 天
                </p>
                <p className="muted text-sm">落地平均周期</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  工作区概览
                </p>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Q1 产品节奏
                </p>
              </div>
              <span className="badge">进行中</span>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  关键里程碑
                </p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  4/6 个模块已就绪，测试正在推进。
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  风险提示
                </p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  支付链路仍需评审，计划本周完成。
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-between">
                <span>需求评审</span>
                <span className="muted">周三 10:00</span>
              </div>
              <div className="flex items-center justify-between">
                <span>体验走查</span>
                <span className="muted">周四 14:30</span>
              </div>
              <div className="flex items-center justify-between">
                <span>发布清单</span>
                <span className="muted">周五 18:00</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section border-t border-slate-200/70 dark:border-slate-800">
        <div className="container">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                核心能力
              </p>
              <h2 className="mt-2">让团队信息回到同一频道</h2>
            </div>
            <p className="max-w-xl text-base text-slate-600 dark:text-slate-300">
              提供从需求到交付的完整协作链路，兼顾执行效率与项目透明度。
            </p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="card">
              <h3>结构化项目流</h3>
              <p className="mt-3">
                统一看板、里程碑与时间线，帮助你用更少的会议同步方向。
              </p>
            </div>
            <div className="card">
              <h3>协作资产沉淀</h3>
              <p className="mt-3">
                讨论、资料与决策记录自动归档，随时可追溯。
              </p>
            </div>
            <div className="card">
              <h3>节奏可视化</h3>
              <p className="mt-3">
                关键指标实时更新，风险提前预警，确保目标落地。
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              落地路径
            </p>
            <h2 className="mt-2">从搭建到运转只需三步</h2>
            <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
              我们为不同规模的团队提供模板，确保你可以快速导入现有流程。
            </p>
            <div className="mt-6 flex flex-col gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  01
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    建立工作区
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    选择团队模板与权限角色，完成基础配置。
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  02
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    导入项目节奏
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    里程碑与任务模板一键生成，快速进入执行。
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  03
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    持续运营
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    仪表盘与周报自动生成，帮助管理层掌握全局。
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="card">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                本周摘要
              </p>
              <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                12 项里程碑推进
              </p>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                需求到交付的平均周期缩短了 3.4 天。
              </p>
            </div>
            <div className="card">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                风险预警
              </p>
              <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                2 个模块待评审
              </p>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                系统已自动通知相关负责人完成校验。
              </p>
            </div>
            <div className="card sm:col-span-2">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                运营建议
              </p>
              <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
                邀请跨部门伙伴加入工作区，减少信息落差。
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                  会议纪要
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                  风险追踪
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                  协作日报
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section border-t border-slate-200/70 dark:border-slate-800">
        <div className="container">
          <div className="rounded-3xl bg-slate-900 px-6 py-12 text-white shadow-lg sm:px-10 lg:flex lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <p className="text-sm font-medium uppercase tracking-wide text-slate-300">
                开始体验
              </p>
              <h2 className="mt-3 text-white">准备好为团队提速了吗？</h2>
              <p className="mt-3 text-base text-slate-200">
                创建你的专属工作区，我们会在 24 小时内完成初始化支持。
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0">
              <button className="btn bg-white text-slate-900 hover:bg-slate-100">
                获取试用
              </button>
              <button className="btn border border-slate-600 text-white hover:border-slate-400">
                预约咨询
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200/70 dark:border-slate-800">
        <div className="container flex flex-col gap-4 py-8 text-sm text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Sun Workspace. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <a className="hover:text-slate-900 dark:hover:text-white" href="#">
              隐私
            </a>
            <a className="hover:text-slate-900 dark:hover:text-white" href="#">
              条款
            </a>
            <a className="hover:text-slate-900 dark:hover:text-white" href="#">
              联系我们
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}

