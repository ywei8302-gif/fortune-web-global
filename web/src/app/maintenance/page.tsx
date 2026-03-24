export default function MaintenancePage() {
  return (
    <main className="hero-bg mystic-page min-h-screen p-6">
      <section className="mx-auto mt-16 max-w-2xl">
        <div className="mystic-panel text-center">
          <p className="mystic-pill">MAINTENANCE MODE</p>
          <h1 className="mystic-title mt-4 text-4xl">网站临时关闭中</h1>
          <p className="mt-4 text-sm leading-8 text-[color:var(--ink-soft)]">
            当前站点处于调试维护状态，暂不对外开放。
            <br />
            请稍后再访问。
          </p>
          <p className="mt-6 text-xs text-[color:var(--ink-soft)]">Fortune Reflection Studio</p>
        </div>
      </section>
    </main>
  );
}

