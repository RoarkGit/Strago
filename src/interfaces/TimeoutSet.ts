/**
 * Set used for rate limiting commands. Elements are removed a specified time after being added.
 */
export class TimeoutSet extends Set<string> {
  private timeoutMs: number

  constructor(timeoutSeconds: number) {
    super()
    this.timeoutMs = timeoutSeconds * 1000
  }

  /**
   * Inserts an element into the set, then sets a timer to remove it when the rate limit expires.
   * @param element The element being inserted.
   */
  public add(element: string): this {
    setTimeout(() => this.delete(element), this.timeoutMs)
    return super.add(element)
  }
}
