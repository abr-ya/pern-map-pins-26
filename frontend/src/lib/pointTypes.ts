/** Mirrors GET /api/public/latest `Point` DTO (OpenAPI) */
export type PublicPoint = {
  id: string;
  title: string;
  description: string | null;
  photoUrl: string | null;
  latitude: number;
  longitude: number;
  createdAt: string;
  authorId: string;
  visibility: 'public' | 'group_only';
  groupId: string | null;
  folderId: string | null;
  averageRating: number | null;
  myRating: number | null;
};

export type FolderDto = {
  id: string;
  name: string;
  groupId: string | null;
  createdAt: string;
};

export type TagDto = {
  id: string;
  name: string;
};

export type PhotoUploadPayload = {
  uploadUrl: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  uploadPreset: string;
  cloudName: string;
  folder: string;
  photoKey: string;
};

export type CommentDto = {
  id: string;
  body: string;
  authorId: string;
  displayName: string;
  createdAt: string;
};
