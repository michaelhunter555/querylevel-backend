/**
 *
 * @param titles - product titles
 * @param brand - product brand
 * @param skuList - sku list for product (if available)
 * @returns Shortened product titles with non-alphanumeric, product brand and sku removed if present.
 */

export const adjustLongTitle = (
  titles: string[],
  brand: string,
  skuList: string[]
) => {
  // Prepare a case-insensitive regex pattern for the brand
  const brandRegex = new RegExp(brand.split(" ").join("\\s+"), "gi");

  return titles.map((title) => {
    // Replace all sequences of non-word characters or underscores with a single space
    title = title.replace(/[\W_]+/gi, " ");

    // Collapse multiple spaces into one
    title = title.replace(/\s+/g, " ");

    // Remove the brand by regex, regardless of case and spacing variations
    title = title.replace(brandRegex, " ");

    // Split the title into words
    const words = title.split(" ");

    // Filter out the SKUs
    let filteredWords = words.filter((word) => !skuList.includes(word));

    if (filteredWords.length > 10) {
      filteredWords = filteredWords.slice(0, 10);
    }
    // Join the words back into a string
    let newTitle = filteredWords.join(" ").trim();

    // If the new title is too long, cut down to 78 characters
    if (newTitle.length > 78) {
      newTitle = newTitle.slice(0, 78).trim();
    }

    return newTitle;
  });
};
