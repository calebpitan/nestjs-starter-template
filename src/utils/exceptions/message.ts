function joinMessages<T extends Record<string, string[]>, R = { [P in keyof T]: string }>(
  messagesRecord: T,
): R {
  return (Object.fromEntries(
    Object.entries(messagesRecord).map(([key, messages]) => [key, messages.join(' ')]),
  ) as unknown) as R;
}

export const ErrorMessage = joinMessages({
  INCORRECT_PASSWORD: [`Incorrect password`],
  UNAUTHENTICATED: [`You are unauthenticated`],
  UNAUTHORIZED: [`You are unauthorized to make this request`],
  UNASSOCIATED_SESSION: [`You can not revoke a session you are not associated with`],
  NON_DETEMINISTIC_AUTHORIZATION: [`Authorization can not be unambiguously distinguished`],
  TOKEN_COMPROMISED: [`Authorization token could be valid but possibly compromised or ambiguous`],
});
