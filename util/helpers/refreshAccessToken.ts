// util/refreshAccessToken.ts
import axios from "axios";

export async function refreshAccessToken(
  refreshToken: string
): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const tokenUri = "https://www.googleapis.com/oauth2/v3/token";

  const response = await axios.post(tokenUri, {
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  console.log("Response Refresh Access Token", response);

  if (response.data && response.data.access_token) {
    return response.data.access_token;
  } else {
    throw new Error("Failed to refresh access token");
  }
}
