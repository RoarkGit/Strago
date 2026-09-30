/**
 * Collapses runs of blank lines in data file text into single line breaks.
 * @param text the text to clean
 * @returns The text with blank lines removed and surrounding whitespace trimmed.
 */
export const collapseBlankLines = (text: string): string =>
  text.replace(/\n{2,}/g, '\n').trim()

/**
 * Filters autocomplete choices to those containing the typed query, ignoring case.
 * @param choices the available choices
 * @param query what the user has typed so far
 * @returns The matching choices.
 */
export const matchingChoices = (
  choices: Iterable<string>,
  query: string,
): string[] =>
  Array.from(choices).filter((c) =>
    c.toLowerCase().includes(query.toLowerCase()),
  )
