/**
 * LinkedIn Posts & Community Management API
 */

export class LinkedInProvider {
  static readonly BASE_URL = "https://api.linkedin.com/rest";
  static readonly OAUTH_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";

  static readonly REQUIRED_SCOPES = [
    "openid",
    "profile",
    "email",
    "w_member_social"
  ];

  static getAuthorizationUrl(params: { clientId: string; redirectUri: string; state: string }): string {
    const searchParams = new URLSearchParams({
      response_type: "code",
      client_id: params.clientId,
      redirect_uri: params.redirectUri,
      state: params.state,
      scope: this.REQUIRED_SCOPES.join(" "),
    });
    return `${this.OAUTH_AUTH_URL}?${searchParams.toString()}`;
  }

  static validate(content: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (content.length > 3000) {
      errors.push(`LinkedIn post exceeds 3,000 characters limit (${content.length}/3000).`);
    }
    return { valid: errors.length === 0, errors };
  }
}
