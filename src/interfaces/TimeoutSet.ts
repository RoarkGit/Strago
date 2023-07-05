/**
 * Set used for rate limiting commands. Elements are removed a specified time after being added.
 */
export class TimeoutSet extends Set<string> {
    timeoutSeconds: number

    constructor(timeoutSeconds: number) {
        super()
        this.timeoutSeconds = timeoutSeconds * 1000
    }

    /**
     * Checks if an element exists in the set.
     * @param element The value to test for presence in the set.
     * @returns Returns true if 'element' was found in the set.
     */
    public has(element: string): boolean {
        return super.has(element)
    }

    /**
     * Inserts an element into the set, then sets a timer to remove it when the rate limit expires.
     * @param element The element being inserted.
     */
    public add(element: string): this {
        setTimeout(() => this.delete(element), this.timeoutSeconds)
        return super.add(element)
    }
}
