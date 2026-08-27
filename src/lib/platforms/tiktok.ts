/**
 * TikTok Content Posting API Architecture Provider
 */

export class TikTokProvider {
  static readonly BASE_URL = "https://open.tiktokapis.com/v2";
  static readonly OAUTH_AUTH_URL = "https://www.tiktok.com/v2/auth/authorize/";

  static readonly REQUIRED_SCOPES = [
    "user.info.basic",
    "video.publish",
    "video.upload"
  ];

  static getAuthorizationUrl(params: { clientKey: string; redirectUri: string; state: string }): string {
    const searchParams = new URLSearchParams({
      client_key: params.clientKey,
      scope: this.REQUIRED_SCOPES.join(","),
      response_type: "code",
      redirect_uri: params.redirectUri,
      state: params.state,
    });
    return `${this.OAUTH_AUTH_URL}?${searchParams.toString()}`;
  }

  static validate(content: string, mediaUrls: string[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (content.length > 2200) {
      errors.push(`TikTok caption exceeds 2,200 characters (${content.length}/2200).`);
    }
    if (mediaUrls.length === 0) {
      errors.push("TikTok requires at least one video file.");
    }
    return { valid: errors.length === 0, errors };
  }
}
