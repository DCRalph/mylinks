export default function ProfileLoading() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Decorative Elements */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl"></div>
        <div className="absolute -right-20 bottom-20 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl"></div>
        <div className="absolute left-1/3 top-1/3 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl"></div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-md px-6 text-center">
        <div className="glass-card relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <div className="relative flex flex-col items-center">
            <div className="flex h-16 w-16 animate-spin items-center justify-center rounded-full border-2 border-b-blue-500 border-l-blue-500 border-r-transparent border-t-transparent"></div>
            <p className="mt-6 text-lg text-zinc-300">Loading profile...</p>
          </div>
        </div>
      </div>
    </main>
  );
} 