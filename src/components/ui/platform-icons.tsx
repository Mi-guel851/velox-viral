import React from "react";
import { Platform } from "@/lib/types";

interface PlatformIconProps {
  platform: Platform;
  className?: string;
  size?: number;
}

export const PlatformIcon: React.FC<PlatformIconProps> = ({
  platform,
  className = "w-5 h-5",
  size = 20,
}) => {
  switch (platform) {
    case "instagram":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <rect
            x="2"
            y="2"
            width="20"
            height="20"
            rx="6"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="2" />
          <circle cx="18" cy="6" r="1.2" fill="currentColor" />
        </svg>
      );
    case "twitter":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.88 2.896 2.896 2.896 0 0 1-2.896-2.896 2.896 2.896 0 0 1 2.896-2.896c.29 0 .567.042.833.118V9.38a6.34 6.34 0 0 0-.833-.056 6.341 6.341 0 0 0-6.341 6.341 6.341 6.341 0 0 0 6.341 6.341 6.341 6.341 0 0 0 6.341-6.341V8.33a8.196 8.196 0 0 0 4.754 1.503V6.686z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76c.97 0 1.76-.79 1.76-1.76a1.76 1.76 0 0 0-3.52 0c0 .97.79 1.76 1.76 1.76m1.39 9.74V9.93H5.07v8.57h2.78z" />
        </svg>
      );
    case "threads":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <path d="M12.186 20.5c-4.717 0-8.528-3.528-8.528-8.322 0-4.871 3.916-8.678 8.73-8.678 4.764 0 8.441 3.654 8.441 8.397 0 5.437-4.225 8.163-7.854 8.163-2.656 0-4.524-1.464-4.524-3.593 0-2.378 1.956-3.708 4.673-3.708.97 0 1.83.134 2.583.398-.06-1.636-.889-2.585-2.62-2.585-1.196 0-2.146.474-2.484 1.258l-2.033-.949c.683-1.603 2.527-2.532 4.619-2.532 3.197 0 4.887 1.802 4.887 5.064v4.712h-2.228v-1.189c-.689.865-1.854 1.398-3.045 1.398-2.673 0-4.48-1.782-4.48-4.148 0-2.496 1.952-4.168 5.179-4.168 1.233 0 2.274.225 3.09.673v-.539c0-2.261-1.439-3.614-3.793-3.614-2.131 0-3.693 1.222-4.043 3.093l-2.29-.684c.642-2.993 3.199-4.882 6.43-4.882 3.738 0 6.223 2.158 6.223 5.923v7.411c-1.378 1.823-3.81 2.809-6.666 2.809zm.504-6.398c-1.611 0-2.73.918-2.73 2.224 0 1.233 1.059 2.115 2.551 2.115 1.706 0 2.845-1.077 2.845-2.695v-.425c-.751-.555-1.696-.807-2.666-.807z" />
        </svg>
      );
    case "youtube":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case "facebook":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    default:
      return null;
  }
};
