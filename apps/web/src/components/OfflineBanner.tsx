import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/** Offline state: your ticket and door code still work without a connection. */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    setOffline(!navigator.onLine);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="fixed left-1/2 top-0 z-[70] flex w-full max-w-md -translate-x-1/2 items-center gap-2 bg-destructive px-4 py-2 text-destructive-foreground"
    >
      <WifiOff className="h-4 w-4 shrink-0" />
      <p className="text-xs font-bold">You're offline — your tickets and door codes still work.</p>
    </div>
  );
}
