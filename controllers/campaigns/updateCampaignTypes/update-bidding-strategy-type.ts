import { Request, Response } from "express";
import {
  enums,
  errors,
  MutateOperation,
  ResourceNames,
  resources,
  services,
} from "google-ads-api";

import { getClient } from "../../../lib/getClient";
import { decryptData } from "../../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../../util/helpers/findGoogleAuthById";
import { googleError } from "../../../util/helpers/googleError";

export default async function (req: Request, res: Response) {
  const { id } = req.query;
  const { campaignId, biddingStrategy } = req.body;
  //connect to database

  //get credentials & decrypt them
  const user = await findGoogleAuthById(id as string, res);
  const refreshToken = decryptData(user.refresh_token);
  const accountId = decryptData(user.googleAccountId);

  //instantiate client & account id and token
  const client = getClient();
  const customer = client.Customer({
    customer_id: accountId,
    refresh_token: refreshToken,
  });

  //campaign resource name helper
  const campaignResourceName = ResourceNames.campaign(
    customer.credentials.customer_id,
    campaignId
  );

  //might pass as a string, so convert to number just in case
  const biddingStrategyType = Number(biddingStrategy.bidding_strategy_type);

  //check if user selects an existing bidding strategy
  const biddingStrategyResource = biddingStrategy.bidding_strategy;

  //operation will either be targetRoas or manualCpc after if check and pushed here
  const mutateBiddingStrategyOperation: MutateOperation<services.CampaignOperation>[] =
    [];

  //check bidding strategy type
  if (biddingStrategyType === enums.BiddingStrategyType.TARGET_ROAS) {
    const updateTargetRoas = new resources.Campaign({
      resource_name: campaignResourceName,
      bidding_strategy_type: biddingStrategyType,
      //resource might have been added
      ...(biddingStrategyResource
        ? {
            bidding_strategy: biddingStrategyResource,
          }
        : {}),
      target_roas: {
        target_roas: biddingStrategy.target_roas as number,
      },
    });

    //prepare for mutate operation
    const createUpdateCampaignOperation: MutateOperation<services.CampaignOperation> =
      {
        entity: "campaign",
        operation: "update",
        resource: updateTargetRoas,
        update_mask: {
          paths: ["bidding_strategy_type", "target_roas"],
        },
      };
    //push into final array for operation
    mutateBiddingStrategyOperation.push(createUpdateCampaignOperation);
  } else if (biddingStrategyType === enums.BiddingStrategyType.MANUAL_CPC) {
    /*---Might need to update ad_group as well for cpc--- */
    const updateManualCpc = new resources.Campaign({
      resource_name: campaignResourceName,
      bidding_strategy_type: biddingStrategyType,
      ...(biddingStrategyResource
        ? {
            bidding_strategy: biddingStrategyResource,
          }
        : {}),
      manual_cpc: {
        enhanced_cpc_enabled: biddingStrategy?.enhanced_click,
      },
    });

    const createUpdateCampaignOperation: MutateOperation<services.CampaignOperation> =
      {
        entity: "campaign",
        operation: "update",
        resource: updateManualCpc,
        update_mask: {
          paths: [
            "bidding_strategy_type",
            "manual_cpc",
            "enhanced_cpc_enabled",
          ],
        },
      };

    mutateBiddingStrategyOperation.push(createUpdateCampaignOperation);
  }

  // console.log("BiddingStrategy", mutateBiddingStrategyOperation);

  try {
    await customer.mutateResources([...mutateBiddingStrategyOperation]);
    res
      .status(200)
      .json({ message: "Campaign successfully updated", ok: true });
  } catch (err) {
    console.log(err);
    if (err instanceof errors.GoogleAdsFailure) {
      googleError(err);
    }
    res
      .status(500)
      .json({ message: "Failed to update bidding strategy type.", ok: false });
  }
}
