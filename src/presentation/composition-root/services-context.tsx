import { createContext, type ReactNode, useContext } from "react";
import type { ScreenWakeLock } from "../../infrastructure/wake-lock";

/**
 * Infrastructure services exposed to the React component tree beyond use cases.
 *
 * Kept separate from UseCases so each concern can be tested and provided
 * independently without coupling the use-case context to browser APIs.
 */
export interface Services {
	readonly wakeLock: ScreenWakeLock;
}

const ServicesContext = createContext<Services | null>(null);

interface ServicesProviderProps {
	readonly services: Services;
	readonly children: ReactNode;
}

/**
 * Provides infrastructure services to the React component tree.
 * Tests supply a fake wake lock; production supplies the BrowserWakeLock.
 */
export function ServicesProvider({
	services,
	children,
}: ServicesProviderProps) {
	return (
		<ServicesContext.Provider value={services}>
			{children}
		</ServicesContext.Provider>
	);
}

/**
 * Hook for components to obtain infrastructure services.
 * Must be called inside a ServicesProvider.
 */
export function useServices(): Services {
	const ctx = useContext(ServicesContext);
	if (ctx === null) {
		throw new Error("useServices must be used within a ServicesProvider");
	}
	return ctx;
}
