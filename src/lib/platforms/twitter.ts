/**
 * X (Twitter) API v2 Architecture Provider
 * Implements Twitter API v2 endpoints with OAuth 2.0 PKCE.
 */

export interface TwitterOAuthParams {
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
}

export class TwitterProvider {
  static readonly BASE_URL = "https://api.twitter.com/2";
  static readonly UPLOAD_URL = "https://upload.twitter.com/1.1/media/upload.json";
  static readonly OAUTH_AUTH_URL = "https://twitter.com/i/oauth2/authorize";

  static readonly REQUIRED_SCOPES = [
    "tweet.read",
    "tweet.write",
    "users.read",
    "offline.access",
    "media.write"
  ];

  static getAuthorizationUrl(params: TwitterOAuthParams): string {
    const searchParams = new URLSearchParams({
      response_type: "code",
      client_id: params.clientId,
      redirect_uri: params.redirectUri,
      scope: this.REQUIRED_SCOPES.join(" "),
      state: params.state,
      code_challenge: params.codeChallenge,
      code_challenge_method: "S256",
    });
    return `${this.OAUTH_AUTH_URL}?${searchParams.toString()}`;
  }

  /**
   * Automatically splits long content into an authentic tweet thread
   */
  static splitIntoThread(content: string, limit: number = 280): string[] {
    if (content.length <= limit) return [content];

    const paragraphs = content.split(/\n\n+/);
    const tweets: string[] = [];
    let currentTweet = "";

    for (const para of paragraphs) {
      if ((currentTweet + "\n\n" + para).trim().length <= limit) {
        currentTweet = currentTweet ? `${currentTweet}\n\n${para}` : para;
      } else {
        if (currentTweet) tweets.push(currentTweet.trim());
        if (para.length <= limit) {
          currentTweet = para;
        } else {
          // Split by sentence
          const sentences = para.match(/[^.!?]+[.!?]+(\s|$)/g) || [para];
          currentTweet = "";
          for (const s of sentences) {
            if ((currentTweet + s).length <= limit) {
              currentTweet += s;
            } else {
              if (currentTweet) tweets.push(currentTweet.trim());
              currentTweet = s;
            }
          }
        }
      }
    }
    if (currentTweet) tweets.push(currentTweet.trim());

    // Add thread index indicator if multiple
    if (tweets.length > 1) {
      return tweets.map((t, idx) => {
        const counter = `(${idx + 1}/${tweets.length})`;
        return `${t}\n\n${counter}`;
      });
    }

    return tweets;
  }

  static validate(content: string): { valid: boolean; errors: string[]; threadCount: number } {
    const errors: string[] = [];
    const threadParts = this.splitIntoThread(content);
    
    if (content.trim().length === 0) {
      errors.push("Tweet text cannot be empty.");
    }
    return { valid: errors.length === 0, errors, threadCount: threadParts.length };
  }
}
