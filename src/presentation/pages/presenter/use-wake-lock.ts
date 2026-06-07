import { useEffect } from "react";
import type { ScreenWakeLock } from "../../../infrastructure/wake-lock";

/**
 * Acquires a screen wake lock when the component mounts and releases it when
 * the component unmounts. Re-acquires when the page becomes visible again after
 * backgrounding (the Wake Lock API automatically releases on visibility loss).
 *
 * The hook is a no-op if the provided wakeLock implementation degrades silently
 * (e.g. FakeWakeLock in tests, BrowserWakeLock on unsupported browsers).
 */
export function useWakeLock(wakeLock: ScreenWakeLock): void {
	useEffect(() => {
		void wakeLock.acquire();

		function handleVisibilityChange(): void {
			if (document.visibilityState === "visible") {
				void wakeLock.acquire();
			}
		}

		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			void wakeLock.release();
		};
	}, [wakeLock]);
}
