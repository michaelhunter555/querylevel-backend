import { AdGroupCriterionResource, CriterionData } from "../../../types";

/**
 * @name - determineSubdivisionCaseValues
 * @param productData - partitions passed in operation
 * @param selectedNode - node to be subdivided
 * @returns case_value property for UNIT to SUBDIVISION Nodes parent & "others"
 */
export const determineSubdivisionCaseValues = (
  productData?: CriterionData[],
  selectedNode?: AdGroupCriterionResource
) => {
  //first determine what case_value the selectedNode is
  // case_value is {} for root node so maybe check ev-else node
  // ev-else node should be that of the node

  //productData[0] we only need the first node because all partitions should
  //of the same partition type for each operation, so we don't mix.

  //check for truthy value -> set everything else node to this type.
  const hasBrand = productData?.[0]?.brand?.join("");
  const hasType = productData?.[0]?.productType?.join("");
  const hasProductId = productData?.[0]?.productId?.join("");

  //check selectedNode case_value to see what subdivided node should be
  const isRootNode =
    !selectedNode?.listing_group?.parent_ad_group_criterion ||
    Object.keys(selectedNode?.listing_group?.case_value || {}).length === 0;
  const nodeIsBrand =
    selectedNode?.listing_group?.case_value?.product_brand?.value;
  const nodeIsProductType =
    selectedNode?.listing_group?.case_value?.product_type?.value;
  //const nodeIsProductItemId = selectedNode?.listing_group?.case_value?.product_item_id?.value;

  let subdividedNodeCaseValue: { [key: string]: { [key: string]: string } } =
    {};
  let everythingElseCaseValue: { [key: string]: {} } = {};

  if (nodeIsBrand) {
    subdividedNodeCaseValue = { product_brand: { value: nodeIsBrand } };
    if (hasType) {
      everythingElseCaseValue = {
        product_type: { value: null, level: "LEVEL1" },
      };
    } else if (hasProductId) {
      everythingElseCaseValue = { product_item_id: {} };
    }
  } else if (nodeIsProductType) {
    subdividedNodeCaseValue = {
      product_type: { value: nodeIsProductType, level: "LEVEL1" },
    };
    if (hasBrand) {
      everythingElseCaseValue = { product_brand: {} };
    } else if (hasProductId) {
      everythingElseCaseValue = { product_item_id: {} };
    }
  } else if (isRootNode) {
    if (hasBrand) {
      everythingElseCaseValue = { product_brand: {} };
    } else if (hasType) {
      everythingElseCaseValue = { product_type: {} };
    } else if (hasProductId) {
      everythingElseCaseValue = { product_item_id: {} };
    }
  }

  return {
    subdividedNodeCaseValue,
    everythingElseCaseValue,
  };
};

/**
 *
 * @param node - partition passed in operation
 * @returns case_value property for SUBDIVISION to UNIT
 */
export const SubdivisionToUnitCaseValue = (node: AdGroupCriterionResource) => {
  let caseValue: { [key: string]: { [key: string]: string } } | null = {};
  const isRootNode =
    !node?.listing_group?.parent_ad_group_criterion ||
    Object.keys(node?.listing_group?.case_value || {}).length === 0;
  if (node) {
    const hasBrandName = node?.listing_group?.case_value?.product_brand?.value;
    const hasProductType = node?.listing_group?.case_value?.product_type?.value;
    const hasItemId = node?.listing_group?.case_value?.product_item_id?.value;

    if (hasBrandName) {
      caseValue = { product_brand: { value: hasBrandName } };
    } else if (hasProductType) {
      caseValue = { product_type: { value: hasProductType, level: "LEVEL1" } };
    } else if (hasItemId) {
      caseValue = { product_item_id: { value: hasItemId } };
    } else if (isRootNode) {
      caseValue = null;
    }
  }
  return caseValue;
};
