export type NewsCategory = "news" | "storia" | "lore";

export const isStoryCategory = ( category?: NewsCategory | string | null ) =>
  category === "storia" || category === "lore";

export const normalizeNewsCategory = (
  category?: NewsCategory | string | null,
): "news" | "storia" => ( isStoryCategory( category ) ? "storia" : "news" );

export const getNewsCategoryLabel = (
  category?: NewsCategory | string | null,
  options?: { uppercase?: boolean },
) => {
  const label = isStoryCategory( category ) ? "Storia" : "News";
  return options?.uppercase ? label.toUpperCase() : label;
};
