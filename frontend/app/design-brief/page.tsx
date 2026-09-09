import { Suspense } from "react";
import DesignBriefClient from "./DesignBriefClient";

export const metadata = {
  title: "Personalized Architectural Design Brief | Bangla Sketch",
  description: "Curate your spatial parameters, aesthetic mood, and saved spaces into a comprehensive design brief for our studio architects.",
};

export default function DesignBriefPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F4F0E8] pt-32 pb-20 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#A45138] border-t-transparent animate-spin mx-auto" />
          <p className="font-mono text-xs text-[#727A61]">Initializing Architectural Brief...</p>
        </div>
      </div>
    }>
      <DesignBriefClient />
    </Suspense>
  );
}
