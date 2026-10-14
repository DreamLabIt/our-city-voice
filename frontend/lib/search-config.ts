/** Wait this long after the last keystroke before calling the suggestions API. */
export const SEARCH_DEBOUNCE_MS = 400;

/** The API rejects terms shorter than this with a 400. */
export const SEARCH_MIN_LENGTH = 2;

/** The API rejects terms longer than this with a 400. */
export const SEARCH_MAX_LENGTH = 120;

/** Items per page for the infinite scroll search results. */
export const SEARCH_PAGE_SIZE = 6;

/** Page that shows the full search results. */
export const REPORTS_PATH = "/reports";