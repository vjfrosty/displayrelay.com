export type ProviderImageResult = {
  id: string;
  provider: "pexels";
  src: string;
  thumbnailSrc: string;
  width: number;
  height: number;
  attribution: string;
};

type PexelsPhoto = {
  id: number;
  width: number;
  height: number;
  photographer: string;
  photographer_url: string;
  src: { large: string; medium: string };
};

type PexelsSearchResponse = {
  photos: PexelsPhoto[];
};

const PEXELS_SEARCH_URL = "https://api.pexels.com/v1/search";

export async function searchPexels(
  query: string,
  orientation?: "landscape" | "portrait" | "square",
): Promise<ProviderImageResult[]> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    throw new Error("PEXELS_API_KEY is not configured");
  }

  const url = new URL(PEXELS_SEARCH_URL);
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", "20");
  if (orientation) url.searchParams.set("orientation", orientation);

  const response = await fetch(url, { headers: { Authorization: apiKey } });
  if (!response.ok) {
    throw new Error(`Pexels search failed with status ${response.status}`);
  }

  const data = (await response.json()) as PexelsSearchResponse;
  return data.photos.map((photo) => ({
    id: String(photo.id),
    provider: "pexels",
    src: photo.src.large,
    thumbnailSrc: photo.src.medium,
    width: photo.width,
    height: photo.height,
    attribution: `Photo by ${photo.photographer} on Pexels`,
  }));
}
