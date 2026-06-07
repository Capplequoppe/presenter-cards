import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";

describe("App shell routing", () => {
	beforeEach(() => {
		window.location.hash = "";
	});

	it("renders the deck menu at the root route", () => {
		window.location.hash = "";
		render(<App />);
		expect(
			screen.getByRole("heading", { name: "Presenter Cards" }),
		).toBeInTheDocument();
	});

	it("renders the deck menu for unknown routes", () => {
		window.location.hash = "/unknown";
		render(<App />);
		expect(
			screen.getByRole("heading", { name: "Presenter Cards" }),
		).toBeInTheDocument();
	});

	it("renders the presenter placeholder when navigating to a presenter route", () => {
		act(() => {
			window.location.hash = "/deck/test-id";
			window.dispatchEvent(new HashChangeEvent("hashchange"));
		});
		render(<App />);
		expect(
			screen.getByText("Presenter screen — coming in Phase 6"),
		).toBeInTheDocument();
	});
});
