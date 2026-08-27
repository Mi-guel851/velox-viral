/**
 * Threads Publishing API Provider
 */
export class ThreadsProvider {
  static readonly BASE_URL = "https://graph.threads.net/v1.0";
  static readonly OAUTH_AUTH_URL = "https://threads.net/oauth/authorize";

  static readonly REQUIRED_SCOPES = [
    "threads_basic",
    "threads_content_publish",
    "threads_read_replies",
    "threads_manage_replies"
  ];

  static getAuthorizationUrl(params: { clientId: string; redirectUri: string; state: string }): string {
    const searchParams = new URLSearchParams({
      client_id: params.clientId,
      redirect_uri: params.redirectUri,
      scope: this.REQUIRED_SCOPES.join(","),
      response_type: "code",
      state: params.state,
    });
    return `${this.OAUTH_AUTH_URL}?${searchParams.toString()}`;
  }

  static validate(content: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (content.length > 500) {
      errors.push(`Threads posts must be 500 characters or fewer (${content.length}/500).`);
    }
    return { valid: errors.length === 0, errors };
  }
}
