import apiService, { ApiResponse } from "./apiService";

export type PickupStage = "open" | "picking" | "picked" | "completed";

export interface PickupOrder {
  id: number;
  doStr: string;
  doDate: string;
  docNum: string;
  cardName: string;
  status: string;
  ar_Status: string;
  menuName: string;
  ar_MenuName: string;
  isSelected: boolean;
  isCancelled: boolean;
  isForceClosed: boolean;
  isActive: boolean;
  bpfName: string;
  docDate: string;
  isPrint: boolean;
  articleNo: string;
  channelInvoice: string;
  mobileNo: string;
  contactNumber: string;
  customerReference: string;
  paymentType: string;
  amount: number;
  vehicleNo: string;
  // Add pickup-specific fields
  pickupLocation?: string;
  pickupInstructions?: string;
  expectedPickupTime?: string;
  actualPickupTime?: string;
  items?: PickupOrderItem[];
}

export interface PickupOrderItem {
  details_ID: number;
  lineNo: number;
  itemCode: string;
  description: string;
  returnQty: number;
  openQty: number;
  price: string;
  lineStatus: string;
  childStatus: string;
  itemGroup: string;
  lineDeliveryDate: string;
  nonReturnQty: number;
  isCancelled: boolean;
  // Add pickup-specific item fields
  pickedQty?: number;
  pickupRemarks?: string;
  condition?: string; // Good, Damaged, etc.
  isSelected?: boolean; // For UI selection state
  reasonID?: string;
  reasonDescription?: string;
}

export interface PickupStageDetails {
  isValid_DO: boolean;
  isValid_Stage: boolean;
  partial_Detected: boolean;
  partial_Denied: boolean;
  fromStatus: string;
  toStatus: string;
  stage_Def_Detail: {
    details_ID: number;
    stageDefinitionID: number;
    sequenceNo: number;
    menuName: string;
    fromStatus: string;
    toStatus: string;
    isRemarksMandatory: boolean;
    isCustomerSignatureMandatory: boolean;
    isLineLevelStatusAllowed: boolean;
    isLineLevelRemarksMandatory: boolean;
    isQuantityConfirmationRequired: boolean;
    isCapturingGeoLocationRequired: boolean;
    isEndingStage: boolean;
    allowPartial: boolean;
    isReasonMandatoryDocumentLevel: string;
    documentLevelStatus: string;
    isReasonMandatoryLineLevel: string;
    lineLevelStatus: string;
    captureVahicle: boolean;
    showVehicle: boolean;
    captureLocation: boolean;
    fileUpload: boolean;
    isCustomerFeedback: boolean;
    isSelectMultipleOrders: boolean;
    isShowScanOption: boolean;
    isLineLevelreturnQty: boolean;
    selectAllVehicleNo: boolean;
    ar_MenuName: string;
    ar_FromStaus: string;
    ar_StagesDescription: string;
  };
  do_Head: any;
  pu_Head: {
    id: number;
    puNo: number;
    puStr: string;
    puDate: string;
    docNum: string;
    docStatus: string;
    cardCode: string;
    cardName: string;
    docTotal: number;
    remarks: string;
    status: string;
    isCancelled: boolean;
    isPostponed: boolean;
    isForceClosed: boolean;
    isSync: boolean;
    isActive: boolean;
    deliveryAddress: string;
    mobileNo: string;
    documentDeliveryDate: string;
    customerReference: string;
    endCustomer: any;
    vehicleID: number;
    fromVehicleId: number;
    locationID: number;
    locationName: string;
    stageDefinitionID: number;
    pu_Detail: PickupOrderItem[];
  };
}

export interface PickupStagePayload {
  stageDate: string;
  orderID: string;
  stageDefinitionID: string;
  stageDefinitionDetailsID: string;
  menuName: string;
  stageRemarks: string;
  isSignatureAdded: boolean;
  latitude: string;
  longitude: string;
  locationTimeStamp: string;
  stageStatus: string;
  isActive: boolean;
  cby: string;
  isPartialPreviousStage: boolean;
  reasonID: number;
  reasonDescription: string;
  vehicleID: string;
  locationID: string;
  isScanned: boolean;
  paymentModeId: string;
  expectedAmount: string;
  signatures: string;
  fileUploadUrl: string;
  physicalSigned: boolean;
  fileUploadValidation: boolean;
  isHappy: boolean;
  isSad: boolean;
  FeedbackStage_Details: any[];
  stages_Details: PickupStageDetail[];
}

export interface PickupStageDetail {
  orderDetailsID: number;
  lineNo: number;
  itemCode: string;
  orderQty: number;
  stageQty: number;
  openQty: number;
  stageStatus: string;
  stageRemarks: string;
  reasonID: string;
  reasonDescription: string;
  oQty: number;
  nonReturnQty: number;
  // Pickup-specific fields
  pickedQty?: number;
  condition?: string;
  pickupRemarks?: string;
}

class PickupOrderService {
  /**
   * Fetch pickup orders for a specific vehicle and date
   */
  async getPickupOrders(
    vehicleId: number,
    date: string,
    status: string = "ALL"
  ): Promise<ApiResponse<PickupOrder[]>> {
    const params = new URLSearchParams({
      cdate: date,
      vehicleId: vehicleId.toString(),
      status: status,
      menuType: "Pickup Order",
    });

    const endpoint = `/api/RecentOrders?${params.toString()}`;

    console.log("📦 ===== PICKUP ORDERS API REQUEST =====");
    console.log("📍 Full URL:", `${apiService["baseUrl"]}${endpoint}`);
    console.log("📋 Request Parameters:", {
      cdate: date,
      vehicleId: vehicleId,
      status: status,
      menuType: "Pickup Order",
    });

    const result = await apiService.makeRequest<PickupOrder[]>(endpoint);

    console.log("📦 ===== PICKUP ORDERS API RESPONSE =====");
    console.log("✅ Request Success:", result.success);
    console.log("📊 HTTP Status Code:", result.statusCode);
    console.log("📈 Total Pickup Orders:", result.data?.length || 0);

    return result;
  }

  /**
   * Fetch pickup order filter statuses
   */
  async getPickupOrderFilterStatuses(
    vehicleId: number
  ): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams({
      vehicleId: vehicleId.toString(),
      menuType: "Pickup Order",
    });

    const endpoint = `/api/FilterStatus?${params.toString()}`;

    console.log("📦 ===== PICKUP FILTER STATUSES API REQUEST =====");
    console.log("📍 Full URL:", `${apiService["baseUrl"]}${endpoint}`);

    const result = await apiService.makeRequest<any[]>(endpoint);

    console.log("📦 ===== PICKUP FILTER STATUSES API RESPONSE =====");
    console.log("✅ Request Success:", result.success);
    console.log("📊 Total Status Options:", result.data?.length || 0);

    return result;
  }

  /**
   * Fetch pickup order stage details
   */
  async getPickupStageDetails(
    orderId: string,
    stageType: string = "Pickup%20order",
    menuName: string = "Pickup%20Order"
  ): Promise<ApiResponse<PickupStageDetails>> {
    const endpoint = `/api/Stages?DOStr=${orderId}&StageType=${stageType}&MenuName=${menuName}&uid=1&vehicleid=0`;

    console.log("📦 ===== PICKUP STAGE DETAILS API REQUEST =====");
    console.log("📍 Full URL:", `${apiService["baseUrl"]}${endpoint}`);
    console.log("📋 Order ID:", orderId);
    console.log("📋 Stage Type:", stageType);
    console.log("📋 Menu Name:", menuName);

    const result = await apiService.makeRequest<PickupStageDetails>(endpoint);

    console.log("📦 ===== PICKUP STAGE DETAILS API RESPONSE =====");
    console.log("✅ Request Success:", result.success);
    console.log(
      "📊 Items Count:",
      result.data?.pu_Head?.pu_Detail?.length || 0
    );

    return result;
  }

  /**
   * Submit pickup stage update
   */
  async submitPickupStage(
    payload: PickupStagePayload[]
  ): Promise<ApiResponse<any>> {
    console.log("📦 ===== PICKUP STAGE SUBMISSION =====");
    console.log("📋 Payload:", JSON.stringify(payload, null, 2));

    const result = await apiService.makeRequest("/api/Stages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log("📦 ===== PICKUP STAGE SUBMISSION RESPONSE =====");
    console.log("✅ Request Success:", result.success);
    console.log("📊 HTTP Status Code:", result.statusCode);

    return result;
  }

  /**
   * Get pickup order statistics
   */
  async getPickupOrderStatistics(
    vehicleId: number,
    userRole: string,
    fromDate?: string
  ): Promise<ApiResponse<any>> {
    const today = fromDate || new Date().toISOString().split("T")[0];
    const params = new URLSearchParams({
      fdate: today,
      vehicleId: vehicleId.toString(),
      userRole: userRole,
      menuType: "Pickup Order",
    });

    const endpoint = `/api/Statistics?${params.toString()}`;

    console.log("📦 ===== PICKUP STATISTICS API REQUEST =====");
    console.log("📍 Full URL:", `${apiService["baseUrl"]}${endpoint}`);

    const result = await apiService.makeRequest(endpoint);

    console.log("📦 ===== PICKUP STATISTICS API RESPONSE =====");
    console.log("✅ Request Success:", result.success);
    console.log("📊 Statistics Data:", result.data);

    return result;
  }

  /**
   * Map pickup order status to stage
   */
  getPickupStage(status: string): "open" | "picking" | "picked" | "completed" {
    switch (status) {
      case "PENDING":
        return "open";
      case "OPEN":
        return "picking";
      case "REQUESTED":
        return "picked";
      case "PICKED":
        return "picked";
      case "COMPLETED":
      case "CLOSED":
        return "completed";
      default:
        return "open";
    }
  }

  /**
   * Get menu name for pickup API calls
   */
  getPickupMenuName(stage: string, orderStatus: string): string {
    switch (stage) {
      case "open":
        return "Pickup Order";
      case "picking":
        if (orderStatus === "OPEN") {
          return "Pickup Order";
        } else if (orderStatus === "REQUESTED") {
          return "Return Confirmation";
        }
        return "Pickup Order";
      case "picked":
        if (orderStatus === "REQUESTED") {
          return "Return Confirmation";
        }
        return "Pickup Order";
      case "completed":
        return "Pickup Order";
      default:
        return "Pickup Order";
    }
  }

  /**
   * Create pickup stage payload
   */
  createPickupStagePayload(
    orderData: PickupOrder,
    stageDetails: PickupStageDetails,
    stage: string,
    items: PickupOrderItem[],
    remarks: string = "",
    vehicleId: string
  ): PickupStagePayload[] {
    const stageDefinitionID =
      stageDetails?.stage_Def_Detail?.stageDefinitionID?.toString() || "3";
    const stageDefinitionDetailsID =
      stageDetails?.stage_Def_Detail?.details_ID?.toString() || "10";

    return [
      {
        stageDate: new Date().toISOString(),
        orderID: orderData.id?.toString() || orderData.docNum,
        stageDefinitionID,
        stageDefinitionDetailsID,
        menuName: this.getPickupMenuName(stage, orderData.status),
        stageRemarks: remarks,
        isSignatureAdded: false,
        latitude: "",
        longitude: "",
        locationTimeStamp: "",
        stageStatus: stage.toUpperCase(),
        isActive: true,
        cby: "1",
        isPartialPreviousStage: false,
        reasonID: 0,
        reasonDescription: "",
        vehicleID: vehicleId,
        locationID: "0",
        isScanned: false,
        paymentModeId: "0",
        expectedAmount: orderData.amount?.toString() || "0",
        signatures: "",
        fileUploadUrl: "",
        physicalSigned: false,
        fileUploadValidation: false,
        isHappy: false,
        isSad: false,
        FeedbackStage_Details: [],
        stages_Details: items
          .filter((item) => !item.isCancelled)
          .map((item) => ({
            orderDetailsID: item.details_ID,
            lineNo: item.lineNo,
            itemCode: item.itemCode,
            orderQty: item.returnQty,
            stageQty: item.pickedQty || item.returnQty,
            openQty: item.openQty,
            stageStatus: "COMPLETED",
            stageRemarks: item.pickupRemarks || "",
            reasonID: "0",
            reasonDescription: "",
            oQty: item.returnQty,
            nonReturnQty: 0,
            pickedQty: item.pickedQty || item.returnQty,
            condition: item.condition || "Good",
            pickupRemarks: item.pickupRemarks || "",
          })),
      },
    ];
  }

  /**
   * Get stages for pickup orders
   */
  async getPickupStages(
    stageType: string,
    menuName: string,
    vehicleId: number
  ): Promise<ApiResponse<any[]>> {
    const endpoint = `/api/Stages?StageType=${stageType}&MenuName=${menuName}&vehicleid=${vehicleId}`;

    console.log("📦 ===== PICKUP STAGES API REQUEST =====");
    console.log("📍 Full URL:", `${apiService["baseUrl"]}${endpoint}`);
    console.log("📋 Stage Type:", stageType);
    console.log("📋 Menu Name:", menuName);
    console.log("📋 Vehicle ID:", vehicleId);

    const result = await apiService.makeRequest<any[]>(endpoint);

    console.log("📦 ===== PICKUP STAGES API RESPONSE =====");
    console.log("✅ Request Success:", result.success);
    console.log("📊 Stages Count:", result.data?.length || 0);

    return result;
  }

  /**
   * Get feedback data
   */
  async getFeedbackData(): Promise<ApiResponse<any>> {
    const endpoint = `/api/feedback?Mode=All`;

    console.log("📦 ===== FEEDBACK DATA API REQUEST =====");
    console.log("📍 Full URL:", `${apiService["baseUrl"]}${endpoint}`);

    const result = await apiService.makeRequest<any>(endpoint);

    console.log("📦 ===== FEEDBACK DATA API RESPONSE =====");
    console.log("✅ Request Success:", result.success);
    console.log("📊 Feedback Data:", result.data);

    return result;
  }

  /**
   * Get reasons for pickup orders
   */
  async getPickupReasons(
    stageType: string,
    menuName: string
  ): Promise<ApiResponse<any[]>> {
    const endpoint = `/api/Reasons?StageType=${stageType}&MenuName=${menuName}`;

    console.log("📦 ===== PICKUP REASONS API REQUEST =====");
    console.log("📍 Full URL:", `${apiService["baseUrl"]}${endpoint}`);
    console.log("📋 Stage Type:", stageType);
    console.log("📋 Menu Name:", menuName);

    const result = await apiService.makeRequest<any[]>(endpoint);

    console.log("📦 ===== PICKUP REASONS API RESPONSE =====");
    console.log("✅ Request Success:", result.success);
    console.log("📊 Reasons Count:", result.data?.length || 0);

    return result;
  }

  /**
   * Get payment mode master data
   */
  async getPaymentModeMaster(): Promise<ApiResponse<any[]>> {
    const endpoint = `/api/PaymentModeMaster`;

    console.log("📦 ===== PAYMENT MODE MASTER API REQUEST =====");
    console.log("📍 Full URL:", `${apiService["baseUrl"]}${endpoint}`);

    const result = await apiService.makeRequest<any[]>(endpoint);

    console.log("📦 ===== PAYMENT MODE MASTER API RESPONSE =====");
    console.log("✅ Request Success:", result.success);
    console.log("📊 Payment Modes Count:", result.data?.length || 0);

    return result;
  }
}

// Export singleton instance
export const pickupOrderService = new PickupOrderService();
export default pickupOrderService;
