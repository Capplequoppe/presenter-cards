import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithUseCases } from "./render-with-use-cases";
import { useUseCases } from "./use-cases-context";

/**
 * Smoke-test component that renders the names of the use-case keys it can access.
 */
function UseCaseNames() {
	const useCases = useUseCases();
	return (
		<ul>
			{Object.keys(useCases).map((key) => (
				<li key={key}>{key}</li>
			))}
		</ul>
	);
}

describe("composition root — use-cases context", () => {
	it("component rendered through the test helper receives fake use cases", () => {
		renderWithUseCases(<UseCaseNames />);

		expect(screen.getByText("importDeck")).toBeInTheDocument();
		expect(screen.getByText("listDecks")).toBeInTheDocument();
		expect(screen.getByText("renameDeck")).toBeInTheDocument();
		expect(screen.getByText("reimportDeck")).toBeInTheDocument();
		expect(screen.getByText("deleteDeck")).toBeInTheDocument();
		expect(screen.getByText("updateDeckSettings")).toBeInTheDocument();
	});

	it("useUseCases throws when rendered outside a provider", () => {
		const originalError = console.error;
		// Suppress React's error boundary noise in test output
		console.error = () => {};
		expect(() => render(<UseCaseNames />)).toThrow(
			"useUseCases must be used within a UseCasesProvider",
		);
		console.error = originalError;
	});
});
