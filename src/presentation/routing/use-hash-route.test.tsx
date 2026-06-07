import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useHashRoute } from "./use-hash-route";

function HashRouteDisplay() {
	const route = useHashRoute();
	if (route.kind === "presenter") {
		return <div>presenter:{route.deckId}</div>;
	}
	return <div>menu</div>;
}

describe("useHashRoute", () => {
	beforeEach(() => {
		window.location.hash = "";
	});

	it("renders deck menu at empty hash (root route)", () => {
		window.location.hash = "";
		render(<HashRouteDisplay />);
		expect(screen.getByText("menu")).toBeInTheDocument();
	});

	it("renders deck menu at hash '/'", () => {
		window.location.hash = "/";
		render(<HashRouteDisplay />);
		expect(screen.getByText("menu")).toBeInTheDocument();
	});

	it("renders presenter route when hash is /deck/:id", () => {
		window.location.hash = "/deck/abc-123";
		render(<HashRouteDisplay />);
		expect(screen.getByText("presenter:abc-123")).toBeInTheDocument();
	});

	it("falls back to deck menu for unknown hash routes", () => {
		window.location.hash = "/unknown/route/xyz";
		render(<HashRouteDisplay />);
		expect(screen.getByText("menu")).toBeInTheDocument();
	});

	it("updates when the hash changes", () => {
		window.location.hash = "";
		render(<HashRouteDisplay />);
		expect(screen.getByText("menu")).toBeInTheDocument();

		act(() => {
			window.location.hash = "/deck/xyz";
			window.dispatchEvent(new HashChangeEvent("hashchange"));
		});

		expect(screen.getByText("presenter:xyz")).toBeInTheDocument();
	});
});
