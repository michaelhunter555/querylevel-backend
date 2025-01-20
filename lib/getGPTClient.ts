import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources";

//create GPT client
export const createGPTClient = () => {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORG_ID,
    project: process.env.OPENAI_PROJECT_ID,
  });
};

//create Message for GPT
export const messages = (
  timePeriod: string,
  type: string,
  data: any
): ChatCompletionMessageParam[] => [
  {
    role: "system",
    content: `
            You are a google ads & google shopping professional 
            providing insight and suggestions based on data-set analysis provided
            from a user's Google ads performance data. Your aim to spark new ideas and consult users to help get more sales.`,
  },
  {
    role: "user",
    content: `
  Analyze the past performance for the ${timePeriod} for ${type} in 
  under 500 words. Your response should include the following:
  1. A current overall score out 100 points relating to the current state of the ${type} during ${timePeriod}.
  2. Possible options to improve performance both on and off Google ads (i.e. increase cpc, check your search terms and add negative keyword, utilize google analytics or hotjar, etc.).
  3. Set a list of reasonable Key Performance Indicators (KPIs) for for the next ${timePeriod} (i.e. Get X clicks, X conversions, X impressions, etc.).
  4. Ideas to help further trigger customer actions. For example, creating a promotion.
  5. Competitor strategy - Advice on how the user can analyze what the their competition is doing.
  6. If product_group_view, your feedback should also consider critical competitive factors in relation to the data. For example, is the current CPC too low compared to the benchmark? Consider other competitive data as well. Remember that google uses millionths Please format this to a readable number so we don't confuse the user (i.e. 100,000 / 1,000,000 = $0.10).
  7. Format your response in <div> and do not include the <html> tags, so that we can use dangerouslysetInnerHTML when returning your response to the user. this is for a next.js frontend, so only provide what is needed (i.e. <h2>, <div>, <span> and do not change colors through style that's handle on client-side by us)

  Always provide reasoning with explanation & examples to help the user understand your rationale. Note that cost per click is in millionths, so a cpc of 150,000 (150,000 / 1,000,000) is really $0.15 per click.

  Data to analyze: ${JSON.stringify(data)}.`,
  },
];
