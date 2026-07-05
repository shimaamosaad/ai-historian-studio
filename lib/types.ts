export interface Project {
  id: string;
  name: string;
  description: string;
  period: string;
  region: string;
  language: string;

  status: "new" | "processing" | "completed";

  documentsCount: number;
  peopleCount: number;
  placesCount: number;
  eventsCount: number;

  createdAt: string;
  updatedAt: string;
}