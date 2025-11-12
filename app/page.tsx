import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <main className="flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm">
          <span className="text-blue-400">●</span>
          <span className="text-gray-300">Made for Soldiers by Soldiers</span>
        </div>

        <h1 className="mb-6 max-w-4xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl md:text-7xl">
          Draft. Review.
          <br />
          Win Your Evaluation.
        </h1>

        <p className="mb-12 max-w-2xl text-lg text-gray-400 sm:text-xl">
          AI-powered tool to help Soldiers and Leaders craft strong,
          regulation-ready NCOERs & OERs.
        </p>

        <Link
          href="/auth/signin"
          className="group inline-flex items-center gap-2 rounded-full bg-blue-600 px-8 py-4 text-lg font-medium text-white transition-all hover:bg-blue-700 hover:gap-3"
        >
          Get Started
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
        </Link>

        <div className="mt-20 text-center text-sm text-gray-500">
          © 2025 MilEvalAI
        </div>
      </main>
    </div>
  );
}
