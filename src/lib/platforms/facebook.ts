/**
 * Facebook Graph API Provider
 */
export class FacebookProvider {
  static readonly BASE_URL = "https://graph.facebook.com/v20.0";
  static readonly OAUTH_AUTH_URL = "https://www.facebook.com/v20.0/dialog/oauth";

  static readonly REQUIRED_SCOPES = [
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_posts"
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
    if (content.length > 63206) {
      errors.push("Facebook post exceeds maximum length.");
    }
    return { valid: errors.length === 0, errors };
  }
}
