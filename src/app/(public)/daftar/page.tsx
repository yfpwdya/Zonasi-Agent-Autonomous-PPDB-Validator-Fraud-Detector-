import { PublicFooter, PublicHeader } from "@/components/PublicShell";
import { KKScannerPanel } from "@/components/forms/KKScannerPanel";

export default function ScannerKKPage() {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <PublicHeader />
      <main className="flex-1 max-w-7xl w-full mx-auto px-margin py-space-xl space-y-6">
        <KKScannerPanel />
      </main>
      <PublicFooter />
    </div>
  );
}
