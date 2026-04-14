type ErrorLike = {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
};

/**
 * Normalizes API/client errors into a user-facing verification message.
 */
export default function getVerifyEmailErrorMessage(err: unknown) {
  const errorLike = err as ErrorLike;
  return errorLike?.response?.data?.message || errorLike?.message || 'Verification failed.';
}
