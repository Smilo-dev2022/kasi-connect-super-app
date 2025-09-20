// TODO: Implement retry logic with exponential backoff

/**
 * Retries a function a given number of times with exponential backoff.
 * @param fn The function to retry.
 * @param retries The number of retries.
 * @param delay The initial delay in ms.
 */
export async function retry<T>(
  fn: () => Promise<T>,
  retries: number,
  delay: number
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retry(fn, retries - 1, delay * 2);
    } else {
      throw error;
    }
  }
}
