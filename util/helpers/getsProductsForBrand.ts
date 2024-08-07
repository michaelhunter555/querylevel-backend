import axios from "axios";

export const getProductsForBrand = async (
  merchId: string,
  accessToken: string,
  refreshToken: string
) => {
  const contentApiUrl = `https://shoppingcontent.googleapis.com/content/v2.1/${merchId}/products`;

  try {
    const { data } = await axios.get(contentApiUrl, {
      params: {
        maxResults: 100,
        fields: "resources(brand), nextPageToken",
      },
      headers: { Authorzation: "Bearer " + accessToken },
    });

    const brands = data?.resources?.map(
      (product: { [key: string]: string }) => product?.brand
    );
    const uniqueBrands = [...new Set(brands)];
    return uniqueBrands;
  } catch (err) {
    console.log("Error retrieving Google Merchant data", err);
  }
};
