import { auth } from '@/auth';

export type ActionFailure = {
  success: false;
  error: string;
};

export type ActionSuccess<T = Record<string, unknown>> = {
  success: true;
  error?: never;
} & T;

export type ActionOutcome<T = Record<string, unknown>> = ActionSuccess<T> | ActionFailure;

/**
 * Higher-order function that wraps a server action handler.
 * - Catches unexpected errors and returns a consistent { success: false, error: "..." } shape.
 * - Logs real error server-side with context (action name, user id/role).
 * - Normalizes returned objects containing { error: "..." } to ensure success: false is always set.
 */
export function actionWrapper<TArgs extends unknown[], TResult>(
  actionName: string,
  handler: (...args: TArgs) => Promise<TResult>
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    let userContext = 'unauthenticated';
    try {
      const session = await auth();
      if (session?.user?.id) {
        userContext = `${session.user.name || 'User'} (${session.user.id}, ${session.user.role || 'no-role'})`;
      }
    } catch {
      // Ignore auth extraction errors
    }

    try {
      const result = await handler(...args);

      // Normalize return shape if { error: '...' } was returned without success property
      if (result && typeof result === 'object') {
        const resObj = result as Record<string, unknown>;
        if (resObj.error && resObj.success === undefined) {
          return {
            ...resObj,
            success: false,
          } as TResult;
        }
      }

      return result;
    } catch (err: unknown) {
      console.error(`[ServerAction Error] [${actionName}] [User: ${userContext}]:`, err);
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      return {
        success: false,
        error: message,
      } as unknown as TResult;
    }
  };
}

/**
 * Inline executor variant for wrapping logic inside existing action functions.
 */
export async function executeAction<TResult>(
  actionName: string,
  fn: () => Promise<TResult>
): Promise<TResult> {
  return actionWrapper(actionName, fn)();
}
