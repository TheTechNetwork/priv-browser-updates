export type Schema = {
  releases: {
    id?: number;
    version: string;
    channel: string;
    platform: string;
    downloadUrl: string;
    releaseNotes?: string | null;
    fileSize?: number | null;
    sha256?: string | null;
    createdAt?: string;
    isActive?: boolean;
  };
  
  configurations: {
    id?: number;
    key: string;
    value: string;
    updatedAt?: string;
  };
  
  updateRequests: {
    id?: number;
    clientVersion?: string | null;
    platform?: string | null;
    channel?: string | null;
    ip?: string | null;
    userAgent?: string | null;
    timestamp?: string;
  };
}