import { Customer } from "google-ads-api";
import { ChatCompletionMessageParam } from "openai/resources";

import { createGPTClient, messages } from "../lib/getGPTClient";
import {
  analyzeProductGroupView,
  analyzeTotalShoppingPerformance,
} from "../util/queries/queries";

//Analyze total Shopping performance
export const analyzeShoppingPerformance = async (
  customer: Customer,
  selectedPeriod: string,
  selectedType: string
) => {
  const query = analyzeTotalShoppingPerformance(selectedPeriod);

  try {
    //query data from google ads
    const appAnalytics = await customer.query(query);

    //instantiate GPT client
    const ai = createGPTClient();
    //pass prompt & data
    const task: ChatCompletionMessageParam[] = messages(
      selectedPeriod,
      selectedType,
      appAnalytics
    );

    //perform chat analysis
    const analyzeData = await ai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: task,
    });
    // console.log("analysis completed:", analyzeData);
    return analyzeData.choices[0].message.content;
  } catch (err) {
    console.log("error with analysis: ", err);
  }
};

export const analyzeProductPartitions = async (
  customer: Customer,
  adGroupId: number,
  selectedPeriod: string,
  selectedType: string
) => {
  const query = analyzeProductGroupView(adGroupId, selectedPeriod);
  const appAnalytics = await customer.query(query);

  const ai = createGPTClient();
  const task: ChatCompletionMessageParam[] = messages(
    selectedPeriod,
    selectedType,
    appAnalytics
  );
  const analyzeData = await ai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: task,
  });

  return analyzeData.choices[0].message.content;
};

export const handleDataAnalysisOperation = async (
  customer: Customer,
  type: string,
  selectedPeriod: string,
  selectedType: string,
  adGroupId?: number | string
) => {
  let query = null;
  switch (type) {
    case "shopping_performance_view":
      query = analyzeTotalShoppingPerformance(selectedPeriod);

      break;
    case "product_group_view":
      query = analyzeProductGroupView(Number(adGroupId), selectedPeriod);
      break;
    default:
      return query;
  }

  if (query) {
    const appAnalytics = await customer.query(query);
    const ai = createGPTClient();
    const task: ChatCompletionMessageParam[] = messages(
      selectedPeriod,
      selectedType,
      appAnalytics
    );
    const analyzeData = await ai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: task,
    });

    return analyzeData.choices[0].message;
  }

  return;
};
