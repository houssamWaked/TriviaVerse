/**
 * Wrap an async Express handler and forward errors to `next()`.
 *
 * Express 4/5 doesn't automatically catch rejected promises from route handlers.
 * This utility standardizes error forwarding so controllers can `throw` and the
 * global `errorHandler` can format the response.
 *
 * @template {Function} T
 * @param {T} fn async (req, res, next) handler
 * @returns {(req: any, res: any, next: any) => Promise<void>}
 */
export default function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
