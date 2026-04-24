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
