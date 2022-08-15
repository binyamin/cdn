/**
 * The response from each URL endpoint needs to be a JSON
 * document that is an array of strings or a _completions
 * list_.
 *
 * @note Taken from {@link https://deno.land/manual/language_server/imports}
 */
export interface CompletionList {
	/** The list (or partial list) of completion items. */
	items: string[];
	/** If the list is a partial list, and further queries to the endpoint will
	 * change the items, set `isIncomplete` to `true`. */
	isIncomplete?: boolean;
	/** If one of the items in the list should be preselected (the default
	 * suggestion), then set the value of `preselect` to the value of the item. */
	preselect?: string;
}

/**
 * Documentation endpoints should return a documentation
 * object with any documentation related to the requested
 * entity.
 *
 * @note Taken from {@link https://deno.land/manual/language_server/imports}
 */
export interface Documentation {
  kind: "markdown" | "plaintext";
  value: string;
}
