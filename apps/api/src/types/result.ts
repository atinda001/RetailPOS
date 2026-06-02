export type Result<TValue, TError> =
  | Readonly<{ ok: true; value: TValue }>
  | Readonly<{ ok: false; error: TError }>;

/**
 * Creates a successful result wrapper.
 * @param value Value to wrap.
 * @returns Successful result.
 */
export const ok = <TValue, TError = never>(value: TValue): Result<TValue, TError> => ({ ok: true, value });

/**
 * Creates a failed result wrapper.
 * @param error Error to wrap.
 * @returns Failed result.
 */
export const err = <TValue = never, TError = never>(error: TError): Result<TValue, TError> => ({ ok: false, error });
