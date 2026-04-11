/**
 * Global News Content Types
 * news: Recent operational updates and game changes.
 * storia/lore: Historical world-building and narrative fragments.
 */
export type NewsCategory = "news" | "storia" | "lore";

/**
 * Story Guard Logic
 * Verifies if a given category belongs to the historical/lore narrative spectrum.
 */
export const isStoryCategory = ( category?: NewsCategory | string | null ) =>
  category === "storia" || category === "lore";

/**
 * Category Normalization Bridge
 * Collapses narrative sub-types into a single 'storia' identifier for backend/API consistency.
 */
export const normalizeNewsCategory = (
  category?: NewsCategory | string | null,
): "news" | "storia" => ( isStoryCategory( category ) ? "storia" : "news" );

/**
 * UI Label Generator
 * Provides formatted, human-readable labels for the news categories.
 * Translates internal keys into UI-friendly Italian strings.
 */
export const getNewsCategoryLabel = (
  category?: NewsCategory | string | null,
  options?: { uppercase?: boolean },
) => {
  const label = isStoryCategory( category ) ? "Storia" : "News";
  return options?.uppercase ? label.toUpperCase() : label;
};
