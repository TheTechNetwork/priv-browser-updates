export type Schema = {
  photos: {
    id?: number;
    title: string;
    description: string | null;
    imageUrl: string;
    category: string;
    featured: boolean;
    dateCreated: string;
  };
  categories: {
    id?: number;
    name: string;
  };
  contactMessages: {
    id?: number;
    name: string;
    email: string;
    message: string;
    dateSubmitted: string;
  };
}