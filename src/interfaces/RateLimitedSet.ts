/**
 * Set used for rate limiting commands. Elements are removed a specified time after being added.
 */
export class RateLimitedSet {
    rateLimitSeconds: number
    rateLimited: Set<string>

    constructor(rateLimitSeconds: number) {
        this.rateLimitSeconds = rateLimitSeconds * 1000
        this.rateLimited = new Set<string>()
    }

    /**
     * Checks if an element exists in the set.
     * @param element The value to test for presence in the set.
     * @returns Returns true if 'element' was found in the set.
     */
    public has(element: string): boolean {
        return this.rateLimited.has(element)
    }

    /**
     * Inserts an element into the set, then sets a timer to remove it when the rate limit expires.
     * @param element The element being inserted.
     */
    public add(element: string) {
        this.rateLimited.add(element)
        setTimeout(() => this.rateLimited.delete(element), this.rateLimitSeconds)
    }
}
