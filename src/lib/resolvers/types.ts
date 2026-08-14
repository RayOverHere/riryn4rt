export interface ResolvedImage {
  imageUrl: string;
  sourcePlatform: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
  mimeType?: string;
  format?: string;
  title?: string;
}

export interface ResolveResult {
  success: boolean;
  image?: ResolvedImage;
  error?: string;
  platform?: string;
  canFallbackToDirectUpload?: boolean;
}

export interface SocialImageResolver {
  name: string;
  canHandle(url: URL): boolean;
  resolve(url: URL): Promise<ResolveResult>;
}
