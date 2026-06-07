export class InvalidSlideError extends Error {
	readonly row: number | undefined;

	constructor(message: string, row?: number) {
		super(message);
		this.name = "InvalidSlideError";
		this.row = row;
	}
}

export class EmptyDeckError extends Error {
	constructor() {
		super("A deck must contain at least one slide");
		this.name = "EmptyDeckError";
	}
}

export class InvalidDeckNameError extends Error {
	constructor() {
		super("Deck name must not be empty");
		this.name = "InvalidDeckNameError";
	}
}
