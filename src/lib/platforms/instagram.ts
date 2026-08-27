/**
 * Instagram Graph API v20.0 Architecture Provider
 * Implements Meta Graph API specifications for Instagram Professional & Creator accounts.
 */

export interface InstagramOAuthParams {
  clientId: string;
  redirectUri: string;
  state: string;
}

export interface InstagramPublishPayload {
  caption: string;
  imageUrl?: string;
  videoUrl?: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL";
  children?: string[]; // Media container IDs for carousels
  locationId?: string;
  userTags?: { username: string; x: number; y: number }[];
}

export class InstagramProvider {
  static readonly API_VERSION = "v20.0";
  static readonly BASE_URL = `https://graph.facebook.com/${InstagramProvider.API_VERSION}`;
  static readonly OAUTH_AUTH_URL = "https://www.facebook.com/v20.0/dialog/oauth";
  
  static readonly REQUIRED_SCOPES = [
    "instagram_basic",
    "instagram_content_publish",
    "instagram_manage_comments",
    "instagram_manage_insights",
    "pages_show_list",
    "pages_read_engagement"
  ];

  /**
   * Generates official Meta OAuth 2.0 authorization URL
   */
  static getAuthorizationUrl(params: InstagramOAuthParams): string {
    const searchParams = new URLSearchParams({
      client_id: params.clientId,
      redirect_uri: params.redirectUri,
      scope: this.REQUIRED_SCOPES.join(","),
      response_type: "code",
      state: params.state,
    });
    return `${this.OAUTH_AUTH_URL}?${searchParams.toString()}`;
  }

  /**
   * Validates Instagram post constraints
   */
  static validate(content: string, mediaUrls: string[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (content.length > 2200) {
      errors.push(`Caption exceeds Instagram 2,200 character limit (${content.length}/2200).`);
    }
    const hashtags = (content.match(/#[a-zA-Z0-9_]+/g) || []).length;
    if (hashtags > 30) {
      errors.push(`Instagram allows up to 30 hashtags (${hashtags} detected).`);
    }
    if (mediaUrls.length === 0) {
      errors.push("Instagram requires at least one image or video.");
    }
    return { valid: errors.length === 0, errors };
  }

  /**
   * Constructs container creation payload for Meta Graph API
   */
  static buildContainerPayload(igUserId: string, payload: InstagramPublishPayload) {
    const endpoint = `${this.BASE_URL}/${igUserId}/media`;
    const params: Record<string, string> = {
      caption: payload.caption,
    };

    if (payload.mediaType === "IMAGE" && payload.imageUrl) {
      params.image_url = payload.imageUrl;
    } else if (payload.mediaType === "VIDEO" && payload.videoUrl) {
      params.media_type = "REELS";
      params.video_url = payload.videoUrl;
    }

    return { endpoint, params };
  }

  /**
   * Constructs publish payload to release container
   */
  static buildPublishPayload(igUserId: string, creationId: string) {
    const endpoint = `${this.BASE_URL}/${igUserId}/media_publish`;
    return { endpoint, params: { creation_id: creationId } };
  }
}
