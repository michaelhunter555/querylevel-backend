import { Request, Response } from "express";
import { ResourceNames } from "google-ads-api";

import { getClient } from "../../../lib/getClient";
import { decryptData } from "../../../util/encryption/decryptData";
import { findGoogleAuthById } from "../../../util/helpers/findGoogleAuthById";
import {
  targetExcludeSubdivisionOperation,
  targetExcludeUnitOperation,
} from "../../../util/helpers/productPartition/excludePartitionsOperation";

export default async function (req: Request, res: Response) {
  const { id } = req.query;
  const { selectedNode, cpcBid } = req.body;

  //find user and get tokens decrypted
  const user = await findGoogleAuthById(id as string, res);
  const refreshToken = decryptData(user.refresh_token);
  const accountId = decryptData(user.googleAccountId);

  //instantiate client
  const client = getClient();

  //login details
  const customer = client.Customer({
    customer_id: accountId,
    refresh_token: refreshToken,
  });

  //customerId and adGroup Id to create temp resource
  const customerId = customer.credentials.customer_id;
  const adGroupId = Number(selectedNode?.adGroupResource?.split("/")[3]);

  const tempResource = ResourceNames.adGroupCriterion(
    customerId,
    adGroupId,
    -1
  );

  //if it was negative, then cpc_micros_was null.
  // so if it is currently null, then give it a cpc and remove if not currently negative
  const wasNull = selectedNode?.negative;
  const checkNullCaseValue = selectedNode?.listing_group?.case_value;
  let isEverythingElseNode = false;

  if (checkNullCaseValue) {
    //get keys of case_value (i.e. product_brand, product_type, etc.)
    Object.keys(checkNullCaseValue).forEach((property) => {
      //others has additional { property: {value: null }}, while {property: null} means it's not the 'others'
      //find the property that has a property of value: null
      //checkNullCaseValue[property]?.value === null
      if (!checkNullCaseValue[property]?.value) {
        //if found flag 'others' node as true;
        isEverythingElseNode = true;
      }
    });
  }

  if (isEverythingElseNode) {
    //temp resources for new root resource & others
    const tempRootResource = ResourceNames.adGroupCriterion(
      customerId,
      adGroupId,
      -1
    );
    const tempOthersResource = ResourceNames.adGroupCriterion(
      customerId,
      adGroupId,
      -2
    );
    //operation for subdivided nodes
    await targetExcludeSubdivisionOperation(
      customer,
      selectedNode,
      wasNull,
      cpcBid,
      tempRootResource,
      tempOthersResource,
      res
    );
  } else {
    //operation for unit nodes
    await targetExcludeUnitOperation(
      customer,
      selectedNode,
      wasNull,
      cpcBid,
      tempResource,
      res
    );
  }
}
