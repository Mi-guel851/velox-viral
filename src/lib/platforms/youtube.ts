/**
 * YouTube Data API v3 Provider (Shorts & Community)
 */
export class YouTubeProvider {
  static readonly BASE_URL = "https://www.googleapis.com/youtube/v3";
  static readonly UPLOAD_URL = "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable";
  static readonly OAUTH_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

  static readonly REQUIRED_SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube",
    "https://www.googleapis.com/auth/userinfo.profile"
  ];

  static getAuthorizationUrl(params: { clientId: string; redirectUri: string; state: string }): string {
    const searchParams = new URLSearchParams({
      client_id: params.clientId,
      redirect_uri: params.redirectUri,
      response_type: "code",
      scope: this.REQUIRED_SCOPES.join(" "),
      access_type: "offline",
      prompt: "consent",
      state: params.state,
    });
    return `${this.OAUTH_AUTH_URL}?${searchParams.toString()}`;
  }

  static validate(title: string, description: string, mediaUrls: string[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!title || title.trim().length === 0) {
      errors.push("YouTube Shorts require a video title.");
    }
    if (title && title.length > 100) {
      errors.push(`YouTube title must be 100 characters or fewer (${title.length}/100).`);
    }
    if (description && description.length > 5000) {
      errors.push(`YouTube description exceeds 5,000 characters (${description.length}/5000).`);
    }
    if (mediaUrls.length === 0) {
      errors.push("YouTube Shorts require a vertical video file.");
    }
    return { valid: errors.length === 0, errors };
  }
}
