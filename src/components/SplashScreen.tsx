"use client";

interface SplashScreenProps {
  message?: string;
  submessage?: string;
  fullScreen?: boolean;
}

export function SplashScreen({ message, submessage, fullScreen = true }: SplashScreenProps) {
  const content = (
    <div className="flex flex-col items-center justify-center text-center px-6">
      <img
        src="/icon.png"
        alt="Tradcast"
        className="w-28 h-28 mb-6 animate-pulse rounded-2xl"
      />
      {message && (
        <p className="text-gray-600 font-medium text-base">{message}</p>
      )}
      {submessage && (
        <p className="text-gray-400 text-sm mt-2">{submessage}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-[#ebeff2] z-[9999] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <main className="flex-1">
      <section className="flex items-center justify-center min-h-screen bg-[#ebeff2]">
        {content}
      </section>
    </main>
  );
}
