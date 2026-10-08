export function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--fg-primary)] flex flex-col items-center justify-center p-8">
      <h1 className="text-5xl font-bold mb-4">InfraGuard</h1>
      <p className="text-xl text-[var(--fg-secondary)] mb-8">Smart Bridge Digital Twin</p>
      <button onClick={() => window.location.href = '/overview'} className="px-6 py-3 bg-[var(--accent-cyan)] text-[var(--bg-primary)] rounded-lg">
        Enter Overview
      </button>
    </div>
  );
}