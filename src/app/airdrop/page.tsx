"use client";
import { useRouter } from "next/navigation";

const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
);

const RocketIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#A78BFA]">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
  </svg>
);

export default function AirdropPage() {
  const router = useRouter();

  return (
    <main className="flex flex-col min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#0F172A] relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#8B5CF6] opacity-12 blur-[80px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#A78BFA] opacity-10 blur-[70px] rounded-full pointer-events-none"></div>
      
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.05)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>

      {/* Back button */}
      <button
        onClick={() => router.push('/home')}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 rounded-xl text-slate-300 hover:text-white transition-all duration-300"
      >
        <BackIcon />
        <span className="text-sm font-medium">Back</span>
      </button>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center z-10 p-6">
        {/* Animated rocket */}
        <div className="relative mb-8 animate-bounce">
          <div className="absolute inset-0 bg-[#8B5CF6] blur-[40px] opacity-30 rounded-full"></div>
          <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-8 rounded-3xl border-2 border-slate-700/60 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <RocketIcon />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-[#A78BFA] to-white mb-4 text-center">
          Airdrop
        </h1>

        {/* Coming Soon badge */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-[#8B5CF6] blur-xl opacity-40 rounded-full"></div>
          <div className="relative px-8 py-3 bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] rounded-full border-2 border-white/20 shadow-[0_4px_24px_rgba(139,92,246,0.5)]">
            <span className="text-xl md:text-2xl font-bold text-white tracking-wider">
              COMING SOON
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-slate-400 text-center max-w-md text-sm md:text-base leading-relaxed">
          Stay tuned for exciting rewards! Our airdrop program will reward loyal Tradcast players with exclusive tokens.
        </p>

        {/* Decorative dots */}
        <div className="flex gap-2 mt-8">
          <div className="w-2 h-2 rounded-full bg-[#A78BFA] animate-pulse"></div>
          <div className="w-2 h-2 rounded-full bg-[#A78BFA] animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 rounded-full bg-[#A78BFA] animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce {
          animation: bounce 2s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}

