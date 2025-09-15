import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Linking,
  ActivityIndicator,
  TouchableOpacity,
  PanResponder,
  Dimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import Svg, { Path } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInUp,
  FadeInDown,
  FadeIn,
  SlideInDown,
  FadeOutUp,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  ArrowLeft,
  Search,
  QrCode,
  Check,
  X,
  Phone,
  ChevronDown,
  Calendar,
  User,
  MapPin,
  CreditCard,
  Package,
  ClipboardList,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import apiService from "../services/apiService";
import { useAuth } from "../contexts/AuthContext";
import SuccessDialog from "../components/ui/SuccessDialog";

export type DeliveryStage = "open" | "picking" | "delivered" | "completed";

interface DeliveryStageDetailsScreenProps {
  orderData: {
    id: number;
    docNum: string;
    cardName: string;
    status: string;
    docDate: string;
    bpfName: string;
    amount: number;
    paymentType: string;
    mobileNo: string;
    contactNumber: string;
    customerReference: string;
    vehicleNo: string;
    deliveryDate?: string;
  };
  currentStage: DeliveryStage;
  onBack: () => void;
  onStageChange?: (newStage: DeliveryStage) => void;
}

const DeliveryStageDetailsScreen: React.FC<DeliveryStageDetailsScreenProps> = ({
  orderData,
  currentStage,
  onBack,
  onStageChange,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectAll, setSelectAll] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCardSelected, setIsCardSelected] = useState(false);
  const [selectedCards, setSelectedCards] = useState<any[]>([]);

  // API data states
  const [stagesData, setStagesData] = useState<any[]>([]);
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [reasonsData, setReasonsData] = useState<any[]>([]);
  const [stageDetailsData, setStageDetailsData] = useState<any>(null);
  const [paymentModeData, setPaymentModeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Dispatching stage form data
  const [itemFormData, setItemFormData] = useState<any[]>([]);
  const [selectedVehicleForDispatch, setSelectedVehicleForDispatch] =
    useState<string>("");
  const [selectedLocationForDispatch, setSelectedLocationForDispatch] =
    useState<string>("");
  const [remarks, setRemarks] = useState<string>("");

  // Confirmation stage form data
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>("");
  const [selectedFeedbackEmoji, setSelectedFeedbackEmoji] =
    useState<string>("");
  const [customerSignature, setCustomerSignature] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>("");

  // Signature pad state
  const [signaturePaths, setSignaturePaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(
    null
  );

  // Success dialog state
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successDialogConfig, setSuccessDialogConfig] = useState({
    title: "",
    message: "",
    type: "success" as "success" | "confirmation",
  });

  const { selectedVehicle } = useAuth();

  // Helper function to show success dialog
  const showSuccessDialogWithConfig = (
    title: string,
    message: string,
    type: "success" | "confirmation" = "success"
  ) => {
    console.log("Showing success dialog:", { title, message, type });
    setSuccessDialogConfig({ title, message, type });
    setShowSuccessDialog(true);
  };

  // Helper functions to filter items
  const getActiveItems = (items: any[]) => {
    return items.filter((item: any) => !item.isCancelled);
  };

  const getCancelledItems = (items: any[]) => {
    return items.filter((item: any) => item.isCancelled);
  };

  // Helper function to get the correct menu name for API calls
  const getMenuNameForAPI = (stage: DeliveryStage, orderStatus: string) => {
    console.log("getMenuNameForAPI called with:", { stage, orderStatus });

    // Special handling for PARTIALLYDISPATCHED status - it should always use Dispatching
    if (orderStatus === "PARTIALLYDISPATCHED") {
      console.log(
        "Returning 'Dispatching' for PARTIALLYDISPATCHED status regardless of stage"
      );
      return "Dispatching";
    }

    switch (stage) {
      case "open":
        console.log("Returning 'Open' for open stage");
        return "Open";
      case "picking":
        // For picking stage, determine based on order status
        if (orderStatus === "OPEN") {
          console.log("Returning 'Picking' for OPEN status");
          return "Picking";
        } else if (orderStatus === "PICKED") {
          console.log("Returning 'Dispatching' for PICKED status");
          return "Dispatching";
        }
        console.log("Returning 'Picking' as default for picking stage");
        return "Picking";
      case "delivered":
        // For delivered stage, always use Confirmation
        console.log("Returning 'Confirmation' for delivered stage");
        return "Confirmation";
      case "completed":
        console.log("Returning 'Completed' for completed stage");
        return "Completed";
      default:
        console.log("Returning 'Open' as default");
        return "Open";
    }
  };

  // API call functions
  const fetchStagesData = async () => {
    if (!selectedVehicle) return;

    try {
      // Use the helper function to get the correct menu name
      const menuName = getMenuNameForAPI(currentStage, orderData.status);
      console.log(
        "fetchStagesData - Using menuName:",
        menuName,
        "for status:",
        orderData.status
      );
      const response = await apiService.makeRequest(
        `/api/Stages?StageType=Delivery%20order&MenuName=${menuName}&vehicleid=${selectedVehicle.id}`
      );
      if (response.success && response.data) {
        setStagesData(Array.isArray(response.data) ? response.data : []);
        console.log("Stages data loaded:", response.data);
      }
    } catch (error) {
      console.error("Error fetching stages data:", error);
    }
  };

  const fetchFeedbackData = async () => {
    try {
      const response = await apiService.makeRequest("/api/feedback?Mode=All");
      if (response.success && response.data) {
        setFeedbackData(response.data);
        console.log("Feedback data loaded:", response.data);
      }
    } catch (error) {
      console.error("Error fetching feedback data:", error);
    }
  };

  const fetchReasonsData = async () => {
    try {
      // Use the helper function to get the correct menu name
      const menuName = getMenuNameForAPI(currentStage, orderData.status);
      console.log(
        "fetchReasonsData - Using menuName:",
        menuName,
        "for status:",
        orderData.status
      );
      const response = await apiService.makeRequest(
        `/api/Reasons?StageType=Delivery%20order&MenuName=${menuName}`
      );
      if (response.success && response.data) {
        setReasonsData(Array.isArray(response.data) ? response.data : []);
        console.log("Reasons data loaded:", response.data);
      }
    } catch (error) {
      console.error("Error fetching reasons data:", error);
    }
  };

  const fetchStageDetailsData = async () => {
    if (!orderData.docNum) return;

    try {
      // Use the helper function to get the correct menu name
      const menuName = getMenuNameForAPI(currentStage, orderData.status);
      console.log(
        "fetchStageDetailsData - Using menuName:",
        menuName,
        "for status:",
        orderData.status
      );
      const response = await apiService.makeRequest(
        `/api/Stages?DOStr=${orderData.docNum}&StageType=Delivery%20order&MenuName=${menuName}&uid=1&vehicleid=0`
      );
      if (response.success && response.data) {
        setStageDetailsData(response.data);
        console.log("Stage details data loaded:", response.data);
      }
    } catch (error) {
      console.error("Error fetching stage details data:", error);
    }
  };

  const fetchPaymentModeData = async () => {
    try {
      const response = await apiService.makeRequest("/api/PaymentModeMaster");
      if (response.success && response.data) {
        setPaymentModeData(Array.isArray(response.data) ? response.data : []);
        console.log("Payment mode data loaded:", response.data);
      }
    } catch (error) {
      console.error("Error fetching payment mode data:", error);
    }
  };

  // Initialize item form data for dispatching stage
  const initializeItemFormData = () => {
    console.log("Initializing item form data...");
    console.log("stageDetailsData:", stageDetailsData);
    console.log("reasonsData length:", reasonsData.length);

    if (stageDetailsData?.do_Head?.do_Detail && reasonsData.length > 0) {
      // Filter out cancelled items and only include active items
      const activeItems = getActiveItems(stageDetailsData.do_Head.do_Detail);
      console.log("Active items count:", activeItems.length);
      console.log(
        "Total items count:",
        stageDetailsData.do_Head.do_Detail.length
      );

      const items = activeItems.map((item: any) => ({
        orderDetailsID: item.details_ID,
        lineNo: item.lineNo,
        itemCode: item.itemCode,
        itemName: item.description,
        orderQty: item.invoiceQty,
        stageQty: item.deliveryQty,
        openQty: item.openQty,
        stageStatus: item.childStatus,
        stageRemarks: "",
        reasonID: reasonsData[0]?.id?.toString() || "0",
        reasonDescription: reasonsData[0]?.reasonDescription || "",
        pickingQty: item.deliveryQty, // Initialize with delivery quantity
        isCancelled: item.isCancelled || false, // Preserve cancellation status
      }));
      console.log("Setting item form data (active items only):", items);
      setItemFormData(items);
    } else {
      console.log("Cannot initialize item form data - missing data");
    }
  };

  const loadAllAPIData = async () => {
    setLoading(true);
    try {
      const apiCalls = [
        fetchStagesData(),
        fetchFeedbackData(),
        fetchReasonsData(),
        fetchStageDetailsData(),
      ];

      // Add payment mode API call for confirmation stage
      if (currentStage === "delivered") {
        apiCalls.push(fetchPaymentModeData());
      }

      await Promise.all(apiCalls);
    } catch (error) {
      console.error("Error loading API data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load API data when component mounts
  useEffect(() => {
    loadAllAPIData();
  }, [currentStage, orderData.docNum, selectedVehicle]);

  // Initialize item form data when stage details and reasons are loaded
  useEffect(() => {
    if (
      currentStage === "picking" &&
      (orderData.status === "OPEN" ||
        orderData.status === "PICKED" ||
        orderData.status === "PARTIALLYDISPATCHED") &&
      stageDetailsData &&
      reasonsData.length > 0
    ) {
      initializeItemFormData();
    }
  }, [stageDetailsData, reasonsData, currentStage, orderData.status]);

  // Initialize payment mode for confirmation stage
  useEffect(() => {
    if (
      currentStage === "delivered" &&
      paymentModeData.length > 0 &&
      !selectedPaymentMode
    ) {
      setSelectedPaymentMode(paymentModeData[0]?.id?.toString() || "");
    }
  }, [paymentModeData, currentStage, selectedPaymentMode]);

  const getStageTitle = (stage: DeliveryStage) => {
    switch (stage) {
      case "open":
        return "Open";
      case "picking":
        // Check if order status is OPEN, PICKED, or PARTIALLYDISPATCHED to determine title
        if (orderData.status === "OPEN") {
          return "Picking";
        } else if (
          orderData.status === "PICKED" ||
          orderData.status === "PARTIALLYDISPATCHED"
        ) {
          return "Dispatching";
        }
        return "Picking";
      case "delivered":
        return "Confirmation";
      case "completed":
        return "Completed";
      default:
        return "Delivery Stage";
    }
  };

  const getStageColor = (stage: DeliveryStage) => {
    switch (stage) {
      case "open":
        return "#f59e0b"; // Yellow
      case "picking":
        return "#3b82f6"; // Blue
      case "delivered":
        return "#10b981"; // Green
      case "completed":
        return "#059669"; // Dark Green
      default:
        return "#6b7280"; // Gray
    }
  };

  const getStageIcon = (stage: DeliveryStage) => {
    switch (stage) {
      case "open":
        return ClipboardList;
      case "picking":
        return Package;
      case "delivered":
        return CheckCircle2;
      case "completed":
        return CheckCircle2;
      default:
        return ClipboardList;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  const formatAmount = (amount: number) => {
    return amount ? `$${amount.toFixed(2)}` : "N/A";
  };

  const handleCall = () => {
    const phoneNumber = orderData.mobileNo || orderData.contactNumber;
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      Alert.alert("No phone number available");
    }
  };

  const handleSelectAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);

    if (newSelectAll) {
      // Select all cards from stages data
      setSelectedCards(stagesData);
      setIsCardSelected(true);
    } else {
      // Deselect all cards
      setSelectedCards([]);
      setIsCardSelected(false);
    }
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Cancel Order", "Are you sure you want to cancel this order?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        style: "destructive",
        onPress: () => {
          // Handle order cancellation logic here
          console.log("Order cancelled");
          onBack(); // Go back to previous screen
        },
      },
    ]);
  };

  const handleConfirm = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // For Picking stage (Dispatching), handle API submission
    if (currentStage === "picking") {
      if (itemFormData.length === 0) {
        Alert.alert("No Items", "No items available to dispatch.");
        return;
      }

      try {
        setLoading(true);

        // Prepare the API payload for dispatching
        const payload = [
          {
            stageDate: new Date().toISOString(),
            orderID: orderData.id?.toString() || orderData.docNum,
            stageDefinitionID:
              stageDetailsData?.stage_Def_Detail?.stageDefinitionID?.toString() ||
              "2",
            stageDefinitionDetailsID:
              stageDetailsData?.stage_Def_Detail?.details_ID?.toString() || "9",
            menuName: "Dispatching",
            stageRemarks: remarks,
            isSignatureAdded: false,
            latitude: "",
            longitude: "",
            locationTimeStamp: "",
            stageStatus: "DISPATCHED",
            isActive: true,
            cby: "1",
            isPartialPreviousStage: false,
            reasonID: 0,
            reasonDescription: "",
            vehicleID: selectedVehicle?.id?.toString() || "5",
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
            FeedbackStage_Details:
              feedbackData?.feedBack_Details?.map((feedback: any) => ({
                feedbackDetails_ID: feedback.details_ID,
                feedBackID: feedback.feedBackID,
                description: feedback.description,
                feedbackValues: "",
                bpfbdescription: feedback.bpfbdescription,
                ischecked: false,
                isCheckedNo: false,
              })) || [],
            stages_Details: itemFormData
              .filter((item: any) => !item.isCancelled) // Only include active items
              .map((item: any) => ({
                orderDetailsID: item.orderDetailsID,
                lineNo: item.lineNo,
                itemCode: item.itemCode,
                orderQty: item.orderQty,
                stageQty: item.pickingQty,
                openQty: item.openQty,
                stageStatus: "DISPATCHED",
                stageRemarks: item.stageRemarks,
                reasonID: item.reasonID,
                reasonDescription: item.reasonDescription,
                oQty: item.orderQty,
                nonReturnQty: 0,
              })),
          },
        ];

        console.log("Submitting dispatching payload:", payload);

        // Submit to API
        const response = await apiService.makeRequest("/api/Stages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (response.success && response.data) {
          showSuccessDialogWithConfig(
            "Order Dispatched!",
            "Your order has been successfully dispatched and is now on its way to the customer.",
            "success"
          );
        } else {
          throw new Error(response.error || "Failed to dispatch order");
        }
      } catch (error) {
        console.error("Error dispatching order:", error);
        Alert.alert("Error", "Failed to dispatch order. Please try again.", [
          {
            text: "OK",
            onPress: () => {
              onBack(); // Go back to previous screen
            },
          },
        ]);
      } finally {
        setLoading(false);
      }
      return;
    }

    // For Confirmation stage (delivered), handle API submission
    if (currentStage === "delivered") {
      console.log("Starting confirmation validation...");
      console.log("selectedPaymentMode:", selectedPaymentMode);
      console.log("selectedFeedbackEmoji:", selectedFeedbackEmoji);
      console.log("customerSignature:", !!customerSignature);
      console.log("uploadedFile:", !!uploadedFile);
      console.log("uploadedFileUrl:", uploadedFileUrl);

      // Mandatory validation for confirmation stage
      if (!selectedPaymentMode) {
        console.log("Validation failed: Payment mode not selected");
        Alert.alert("Payment Mode Required", "Please select a payment mode.");
        return;
      }

      if (!selectedFeedbackEmoji) {
        console.log("Validation failed: Feedback not selected");
        Alert.alert(
          "Feedback Required",
          "Please select customer feedback (happy or sad emoji)."
        );
        return;
      }

      if (!customerSignature) {
        console.log("Validation failed: Signature not captured");
        Alert.alert("Signature Required", "Please capture customer signature.");
        return;
      }

      if (!uploadedFile && !uploadedFileUrl) {
        console.log("Validation failed: File not uploaded");
        Alert.alert(
          "File Upload Required",
          "Please upload a file (image or PDF)."
        );
        return;
      }

      if (
        !stageDetailsData?.do_Head?.do_Detail ||
        stageDetailsData.do_Head.do_Detail.length === 0
      ) {
        console.log("Validation failed: No items available");
        Alert.alert("No Items", "No items available for confirmation.");
        return;
      }

      console.log("All validations passed, proceeding with confirmation...");

      try {
        setLoading(true);

        // First upload file if available
        let fileUploadUrl = uploadedFileUrl; // Use already uploaded URL if available

        console.log(
          "File upload check - uploadedFile:",
          !!uploadedFile,
          "uploadedFileUrl:",
          uploadedFileUrl
        );

        if (uploadedFile && !uploadedFileUrl) {
          try {
            console.log("Uploading file before confirmation...");
            const uploadResult = await uploadFile(false); // Don't show success alert during confirmation
            fileUploadUrl = uploadResult?.url || uploadResult?.fileUrl || "";
            console.log("File uploaded successfully, URL:", fileUploadUrl);
          } catch (uploadError) {
            console.error("File upload failed:", uploadError);
            Alert.alert(
              "Upload Error",
              "Failed to upload file. Please try again."
            );
            return;
          }
        } else {
          console.log(
            "Skipping file upload - using existing URL:",
            fileUploadUrl
          );
        }

        // Prepare the API payload for confirmation
        const payload = [
          {
            stageDate: new Date().toISOString(),
            orderID: orderData.id?.toString() || orderData.docNum,
            stageDefinitionID:
              stageDetailsData?.stage_Def_Detail?.stageDefinitionID?.toString() ||
              "3",
            stageDefinitionDetailsID:
              stageDetailsData?.stage_Def_Detail?.details_ID?.toString() ||
              "10",
            menuName: "Confirmation",
            stageRemarks: remarks,
            isSignatureAdded: !!customerSignature,
            latitude: "",
            longitude: "",
            locationTimeStamp: "",
            stageStatus: "COMPLETED",
            isActive: true,
            cby: "1",
            isPartialPreviousStage: false,
            reasonID: 0,
            reasonDescription: "",
            vehicleID: selectedVehicle?.id?.toString() || "5",
            locationID: "0",
            isScanned: false,
            paymentModeId: selectedPaymentMode,
            expectedAmount: orderData.amount?.toString() || "0",
            signatures: customerSignature,
            fileUploadUrl: fileUploadUrl,
            physicalSigned: !!customerSignature,
            fileUploadValidation: !!uploadedFile,
            isHappy: selectedFeedbackEmoji === "happy",
            isSad: selectedFeedbackEmoji === "sad",
            FeedbackStage_Details:
              feedbackData?.feedBack_Details?.map((feedback: any) => ({
                feedbackDetails_ID: feedback.details_ID,
                feedBackID: feedback.feedBackID,
                description: feedback.description,
                feedbackValues: "",
                bpfbdescription: feedback.bpfbdescription,
                ischecked: false,
                isCheckedNo: false,
              })) || [],
            stages_Details:
              getActiveItems(stageDetailsData?.do_Head?.do_Detail || []).map(
                (item: any) => ({
                  orderDetailsID: item.details_ID,
                  lineNo: item.lineNo,
                  itemCode: item.itemCode,
                  orderQty: item.invoiceQty,
                  stageQty: item.deliveryQty,
                  openQty: item.openQty,
                  stageStatus: "COMPLETED",
                  stageRemarks: "",
                  reasonID: "0",
                  reasonDescription: "",
                  oQty: item.invoiceQty,
                  nonReturnQty: 0,
                })
              ) || [],
          },
        ];

        console.log("Submitting confirmation payload:", payload);
        console.log("About to call confirmation API...");

        // Submit to API
        const response = await apiService.makeRequest("/api/Stages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        console.log("Confirmation API response:", response);

        if (response.success && response.data) {
          showSuccessDialogWithConfig(
            "Order Confirmed!",
            "Your order has been successfully confirmed and completed. Thank you for your service!",
            "success"
          );
        } else {
          throw new Error(response.error || "Failed to confirm order");
        }
      } catch (error) {
        console.error("Error confirming order:", error);
        Alert.alert("Error", "Failed to confirm order. Please try again.", [
          {
            text: "OK",
            onPress: () => {
              onBack(); // Go back to previous screen
            },
          },
        ]);
      } finally {
        setLoading(false);
      }
      return;
    }

    // For other stages, use the original logic
    const getConfirmMessage = (stage: DeliveryStage) => {
      switch (stage) {
        case "open":
          return "Are you sure you want to start picking this order?";
        case "picking":
          return "Are you sure you want to mark this order as delivered?";
        case "delivered":
          return "Are you sure you want to complete this order?";
        case "completed":
          return "This order is already completed.";
        default:
          return "Are you sure you want to confirm this action?";
      }
    };

    const getNextStage = (stage: DeliveryStage): DeliveryStage | null => {
      switch (stage) {
        case "open":
          return "picking";
        case "picking":
          return "delivered";
        case "delivered":
          return "completed";
        case "completed":
          return null;
        default:
          return null;
      }
    };

    if (currentStage === "completed") {
      Alert.alert("Order Completed", "This order is already completed.");
      return;
    }

    const nextStage = getNextStage(currentStage);
    if (!nextStage) return;

    Alert.alert("Confirm", getConfirmMessage(currentStage), [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: () => {
          onStageChange?.(nextStage);
          console.log(`Order moved from ${currentStage} to ${nextStage}`);
        },
      },
    ]);
  };

  const handleExpand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsExpanded(!isExpanded);
  };

  const handleCardSelect = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsCardSelected(!isCardSelected);
  };

  const handleCardPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsExpanded(!isExpanded);
  };

  // Handle item form data updates
  const updateItemFormData = (index: number, field: string, value: any) => {
    const updatedData = [...itemFormData];
    updatedData[index] = { ...updatedData[index], [field]: value };
    setItemFormData(updatedData);
  };

  // Handle reason selection
  const handleReasonChange = (index: number, reasonId: string) => {
    const selectedReason = reasonsData.find(
      (reason: any) => reason.id.toString() === reasonId
    );
    updateItemFormData(index, "reasonID", reasonId);
    updateItemFormData(
      index,
      "reasonDescription",
      selectedReason?.reasonDescription || ""
    );
  };

  // Signature pad functions
  const clearSignature = () => {
    setSignaturePaths([]);
    setCurrentPath("");
    setCustomerSignature("");
    setIsDrawing(false);
    setLastPoint(null);
  };

  const captureSignature = () => {
    if (signaturePaths.length > 0 || currentPath) {
      setCustomerSignature("signature_data_" + Date.now());
      Alert.alert("Signature", "Signature captured successfully!");
    } else {
      Alert.alert("No Signature", "Please draw a signature first.");
    }
  };

  // File upload functions
  const openImagePicker = async () => {
    try {
      console.log("Requesting media library permissions...");
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Sorry, we need camera roll permissions to select images!"
        );
        return;
      }

      console.log("Opening image picker...");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7, // Compress image to 70% quality
      });

      console.log("Image picker result:", result);
      if (!result.canceled && result.assets[0]) {
        const selectedImage = result.assets[0];
        console.log("Image selected:", selectedImage);
        console.log(
          "Image size:",
          selectedImage.fileSize
            ? `${(selectedImage.fileSize / 1024 / 1024).toFixed(2)} MB`
            : "Unknown"
        );
        console.log(
          "Image dimensions:",
          selectedImage.width,
          "x",
          selectedImage.height
        );
        setUploadedFile(selectedImage);
        Alert.alert("Success", "Image selected successfully!");
      } else {
        console.log("Image picker canceled");
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const openCamera = async () => {
    try {
      console.log("Requesting camera permissions...");
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Sorry, we need camera permissions to take photos!"
        );
        return;
      }

      console.log("Opening camera...");
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7, // Compress image to 70% quality
      });

      console.log("Camera result:", result);
      if (!result.canceled && result.assets[0]) {
        const takenPhoto = result.assets[0];
        console.log("Photo taken:", takenPhoto);
        console.log(
          "Photo size:",
          takenPhoto.fileSize
            ? `${(takenPhoto.fileSize / 1024 / 1024).toFixed(2)} MB`
            : "Unknown"
        );
        console.log(
          "Photo dimensions:",
          takenPhoto.width,
          "x",
          takenPhoto.height
        );
        setUploadedFile(takenPhoto);
        Alert.alert("Success", "Photo taken successfully!");
      } else {
        console.log("Camera canceled");
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const openFileManager = async () => {
    try {
      console.log("Opening file manager...");
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      console.log("File manager result:", result);
      if (!result.canceled && result.assets[0]) {
        console.log("Document selected:", result.assets[0]);
        setUploadedFile(result.assets[0]);
        Alert.alert("Success", "Document selected successfully!");
      } else {
        console.log("File manager canceled");
      }
    } catch (error) {
      console.error("Error picking document:", error);
      Alert.alert("Error", "Failed to pick document");
    }
  };

  const selectFile = () => {
    console.log("Select file button pressed");
    Alert.alert("Select File", "Choose how you want to select a file:", [
      {
        text: "Camera",
        onPress: () => {
          console.log("Camera selected");
          openCamera();
        },
      },
      {
        text: "Gallery",
        onPress: () => {
          console.log("Gallery selected");
          openImagePicker();
        },
      },
      {
        text: "File Manager (PDF)",
        onPress: () => {
          console.log("File Manager selected");
          openFileManager();
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const uploadFile = async (showSuccessAlert: boolean = true) => {
    if (!uploadedFile) {
      Alert.alert("No File", "Please select a file first.");
      return;
    }

    try {
      setLoading(true);
      console.log("Uploading file:", uploadedFile);

      const formData = new FormData();

      // Append the file with proper multipart structure
      formData.append("file", {
        uri: uploadedFile.uri,
        type: uploadedFile.mimeType || uploadedFile.type || "image/jpeg",
        name: uploadedFile.name || uploadedFile.fileName || "uploaded_file",
      } as any);

      console.log("FormData created, sending request...");

      const response = await fetch("http://194.195.87.226:8090/api/Download", {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      console.log("Upload response status:", response.status);
      const responseData = await response.json();
      console.log("Upload response data:", responseData);

      if (response.ok) {
        const fileUrl = responseData?.url || responseData?.fileUrl || "";
        setUploadedFileUrl(fileUrl);
        if (showSuccessAlert) {
          Alert.alert("Success", "File uploaded successfully!");
        }
        return responseData; // Return the response data for use in confirmation
      } else {
        throw new Error(responseData.message || "Upload failed");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      Alert.alert("Error", `Failed to upload file`);
      throw error; // Re-throw to handle in confirmation logic
    } finally {
      setLoading(false);
    }
  };

  const clearFile = () => {
    console.log("Clearing file...");
    setUploadedFile(null);
    setUploadedFileUrl("");
    Alert.alert("File Cleared", "Selected file has been removed.");
  };

  // Debug uploadedFile state changes
  useEffect(() => {
    console.log("Uploaded file state changed:", uploadedFile);
  }, [uploadedFile]);

  // PanResponder for signature drawing with smooth curves
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      setIsDrawing(true);
      const x = evt.nativeEvent.locationX;
      const y = evt.nativeEvent.locationY;
      const newPath = `M${x},${y}`;
      setCurrentPath(newPath);
      setLastPoint({ x, y });
    },
    onPanResponderMove: (evt) => {
      if (isDrawing && lastPoint) {
        const x = evt.nativeEvent.locationX;
        const y = evt.nativeEvent.locationY;

        // Calculate control point for smooth curve
        const controlX = (lastPoint.x + x) / 2;
        const controlY = (lastPoint.y + y) / 2;

        setCurrentPath(
          (prev) =>
            `${prev} Q${lastPoint.x},${lastPoint.y} ${controlX},${controlY}`
        );
        setLastPoint({ x, y });
      }
    },
    onPanResponderRelease: () => {
      if (currentPath && lastPoint) {
        // Complete the curve to the final point
        setCurrentPath((prev) => `${prev} L${lastPoint.x},${lastPoint.y}`);
        setSignaturePaths((prev) => [...prev, currentPath]);
        setCurrentPath("");
        setLastPoint(null);
      }
      setIsDrawing(false);
    },
  });

  const stageColor = getStageColor(currentStage);
  const StageIcon = getStageIcon(currentStage);

  // Debug dialog state
  console.log(
    "Rendering SuccessDialog - showSuccessDialog:",
    showSuccessDialog,
    "config:",
    successDialogConfig
  );

  // Stage-specific logic
  const isCompleted = currentStage === "completed";
  const canCancel = currentStage !== "completed";
  const canConfirm = currentStage !== "completed";
  const showSearchBar =
    currentStage === "picking" || currentStage === "delivered";
  const showSelectionControls =
    currentStage === "picking" || currentStage === "delivered";

  return (
    <>
      <SafeAreaView className="flex-1 bg-gray-50">
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(600)}
          className="px-4 py-2"
          style={{ backgroundColor: "#8b5cf6" }}
        >
          <View className="flex-row items-center justify-between h-12">
            <Pressable
              onPress={onBack}
              className="w-10 h-10 items-center justify-center rounded-lg active:bg-white/20"
              android_ripple={{ color: "rgba(255,255,255,0.2)" }}
            >
              <ArrowLeft size={24} color="#FFFFFF" />
            </Pressable>
            <Text className="text-white font-bold text-lg text-center">
              {getStageTitle(currentStage)}
            </Text>
            <View style={{ width: 40 }} />
          </View>
        </Animated.View>

        {loading && (
          <View className="flex-1 items-center justify-center bg-gray-50">
            <ActivityIndicator size="large" color="#8b5cf6" />
            <Text className="text-gray-600 mt-2">Loading data...</Text>
          </View>
        )}

        {!loading && (
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* Search Bar - Show for picking and confirmation stages */}
            {showSearchBar && (
              <Animated.View
                entering={SlideInDown.delay(200).duration(500)}
                className="bg-white px-4 py-3 border-b border-gray-100"
              >
                <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
                  <QrCode size={20} color="#6b7280" />
                  <TextInput
                    className="flex-1 ml-3 text-gray-900"
                    placeholder={
                      currentStage === "delivered"
                        ? "Search DO/INV Number"
                        : "Search DO/INV Number"
                    }
                    placeholderTextColor="#9ca3af"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  <View className="w-px h-6 bg-gray-300 mx-2" />
                  <Search size={20} color="#6b7280" />
                </View>
              </Animated.View>
            )}

            {/* Selection Controls - Show for picking and confirmation stages */}
            {showSelectionControls && (
              <Animated.View
                entering={FadeInUp.delay(400).duration(600)}
                className="bg-white px-4 py-3 border-b border-gray-100"
              >
                <View className="flex-row items-center justify-between">
                  <Pressable
                    onPress={handleSelectAll}
                    className="flex-row items-center"
                  >
                    <View
                      className={`w-5 h-5 rounded border-2 mr-2 items-center justify-center ${
                        selectAll
                          ? "bg-purple-600 border-purple-600"
                          : "border-gray-300"
                      }`}
                    >
                      {selectAll && <Check size={12} color="white" />}
                    </View>
                    <Text className="text-gray-700 font-medium">
                      Select All
                    </Text>
                  </Pressable>

                  <View className="flex-row space-x-3">
                    {/* <Pressable
                    onPress={handleCancel}
                    className="w-10 h-10 bg-red-500 rounded-full items-center justify-center active:bg-red-600"
                    android_ripple={{ color: "rgba(255,255,255,0.3)" }}
                  >
                    <X size={20} color="white" />
                  </Pressable> */}
                    <TouchableOpacity
                      onPress={handleConfirm}
                      style={{
                        width: 40,
                        height: 40,
                        backgroundColor: "#10b981",
                        borderRadius: 20,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Check size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            )}

            {/* Order Details Card */}
            <Animated.View
              entering={FadeInUp.delay(600).duration(600)}
              className="flex-1 px-4 pt-4"
            >
              <View className="bg-white rounded-lg p-4 shadow-lg">
                {/* Top Row - Checkbox, Order Number, and Action Buttons */}
                <View className="flex-row items-center justify-between mb-4">
                  {/* Checkbox */}
                  <Pressable
                    onPress={handleCardSelect}
                    className="w-6 h-6 rounded border-2 items-center justify-center mr-3"
                    style={{
                      borderColor: isCardSelected ? "#8b5cf6" : "#d1d5db",
                      backgroundColor: isCardSelected
                        ? "#8b5cf6"
                        : "transparent",
                    }}
                  >
                    {isCardSelected && <Check size={14} color="white" />}
                  </Pressable>

                  {/* Order Number */}
                  <View className="flex-1">
                    <Text className="text-2xl font-bold text-gray-900">
                      {orderData.docNum}
                    </Text>
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row items-center space-x-2">
                    <Pressable
                      onPress={handleCall}
                      className="w-10 h-10 rounded-full items-center justify-center"
                      style={{ backgroundColor: "#8b5cf6" }}
                      android_ripple={{ color: "rgba(255,255,255,0.3)" }}
                    >
                      <Phone size={20} color="white" />
                    </Pressable>
                    <Pressable
                      onPress={() => {}}
                      className="w-10 h-10 rounded-full items-center justify-center"
                      style={{ backgroundColor: "#f59e0b" }}
                      android_ripple={{ color: "rgba(255,255,255,0.3)" }}
                    >
                      <MapPin size={20} color="white" />
                    </Pressable>
                  </View>
                </View>

                {/* Customer Info - Always visible */}
                <View className="mb-4">
                  <Text className="text-lg font-semibold text-gray-900">
                    {orderData.cardName}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <View className="w-4 h-4 border border-blue-500 rounded mr-2" />
                    <Text className="text-sm text-gray-600">
                      {orderData.mobileNo ||
                        orderData.contactNumber ||
                        "No phone"}
                    </Text>
                  </View>
                  <Text className="text-sm font-medium text-gray-600 mt-1">
                    (RC0103019)
                  </Text>
                </View>

                {/* Order Details - Collapsible */}
                {isExpanded && (
                  <Animated.View
                    entering={FadeInUp.duration(300)}
                    exiting={FadeOutUp.duration(300)}
                    className="space-y-3 mt-4"
                  >
                    <View className="flex-row justify-between items-center">
                      <Text className="text-gray-600 font-medium">Date</Text>
                      <Text
                        style={{ color: "#3b82f6" }}
                        className="font-semibold"
                      >
                        {formatDate(orderData.docDate)}
                      </Text>
                    </View>

                    <View className="flex-row justify-between items-center">
                      <Text className="text-gray-600 font-medium">Doc. No</Text>
                      <Text
                        style={{ color: "#3b82f6" }}
                        className="font-semibold"
                      >
                        {orderData.docNum}
                      </Text>
                    </View>

                    <View className="flex-row justify-between items-center">
                      <Text className="text-gray-600 font-medium">
                        Customer Name
                      </Text>
                      <Text
                        style={{ color: "#3b82f6" }}
                        className="font-semibold"
                      >
                        {orderData.cardName}
                      </Text>
                    </View>

                    <View className="flex-row justify-between items-center">
                      <Text className="text-gray-600 font-medium">Address</Text>
                      <Text
                        style={{ color: "#3b82f6" }}
                        className="font-semibold"
                      >
                        {orderData.bpfName || "N/A"}
                      </Text>
                    </View>

                    {/* Stage-specific information */}

                    {currentStage === "delivered" && orderData.deliveryDate && (
                      <View className="flex-row justify-between items-center">
                        <Text className="text-gray-600 font-medium">
                          Delivery Date
                        </Text>
                        <Text
                          style={{ color: "#3b82f6" }}
                          className="font-semibold"
                        >
                          {formatDate(orderData.deliveryDate)}
                        </Text>
                      </View>
                    )}

                    <View className="flex-row justify-between items-center">
                      <Text className="text-gray-600 font-medium">Amount</Text>
                      <Text
                        style={{ color: "#3b82f6" }}
                        className="font-semibold"
                      >
                        {formatAmount(orderData.amount)}
                      </Text>
                    </View>

                    <View className="flex-row justify-between items-center">
                      <Text className="text-gray-600 font-medium">
                        Payment Type
                      </Text>
                      <Text
                        style={{ color: "#3b82f6" }}
                        className="font-semibold"
                      >
                        {orderData.paymentType || ""}
                      </Text>
                    </View>

                    {/* Show customer reference for completed orders */}
                    {currentStage === "completed" &&
                      orderData.customerReference && (
                        <View className="flex-row justify-between items-center">
                          <Text className="text-gray-600 font-medium">
                            Customer Reference
                          </Text>
                          <Text
                            style={{ color: "#3b82f6" }}
                            className="font-semibold"
                          >
                            {orderData.customerReference}
                          </Text>
                        </View>
                      )}
                  </Animated.View>
                )}

                {/* Completed Status Message */}
                {isCompleted && (
                  <View className="mt-4 py-3 rounded-lg items-center bg-green-50 border border-green-200">
                    <Text className="text-green-700 font-semibold text-base">
                      ✓ Order Completed Successfully
                    </Text>
                  </View>
                )}

                {/* Dispatching Stage Form - Only show for PICKED and PARTIALLYDISPATCHED status */}
                {currentStage === "picking" &&
                  (orderData.status === "PICKED" ||
                    orderData.status === "PARTIALLYDISPATCHED") &&
                  itemFormData.length > 0 &&
                  isExpanded && (
                    <Animated.View
                      entering={FadeInUp.duration(300)}
                      className="mt-4 space-y-4"
                    >
                      {/* Remarks Field */}
                      <View className="space-y-3">
                        <View>
                          <Text className="text-gray-600 font-medium mb-2">
                            Remarks (if any)
                          </Text>
                          <TextInput
                            className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                            placeholder="Enter remarks..."
                            placeholderTextColor="#9ca3af"
                            value={remarks}
                            onChangeText={setRemarks}
                            multiline
                            numberOfLines={2}
                          />
                        </View>
                      </View>

                      {/* Items Table */}
                      <View className="mt-4">
                        <Text className="text-lg font-semibold text-gray-900 mb-3">
                          Items
                        </Text>

                        {/* Table Header */}
                        <View className="bg-purple-600 rounded-t-lg px-4 py-3">
                          <View className="flex-row">
                            <View className="flex-1">
                              <Text className="text-white font-semibold">
                                Item Name & Code
                              </Text>
                            </View>
                            <View className="w-20">
                              <Text className="text-white font-semibold text-center">
                                Quantity
                              </Text>
                            </View>
                            <View className="w-20">
                              <Text className="text-white font-semibold text-center">
                                Status
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Table Rows */}
                        {itemFormData.map((item, index) => (
                          <View
                            key={index}
                            className="border-l border-r border-b border-gray-200 last:rounded-b-lg"
                          >
                            {/* Item Row - Light Gray Background */}
                            <View className="px-4 py-3 bg-gray-100">
                              <View className="flex-row items-center">
                                <View className="flex-1">
                                  <Text className="text-gray-900 font-medium">
                                    {item.itemName}
                                  </Text>
                                  <Text className="text-gray-600 text-sm">
                                    ({item.itemCode})
                                  </Text>
                                </View>
                                <View className="w-20">
                                  <Text className="text-gray-600 text-center">
                                    {item.orderQty}
                                  </Text>
                                </View>
                                <View className="w-20">
                                  <Text className="text-purple-600 font-medium text-center">
                                    {item.stageStatus}
                                  </Text>
                                </View>
                              </View>
                            </View>

                            {/* Form Fields Row - Purple and White Design */}
                            <View className="flex-row">
                              {/* Left Column - Purple Background with Labels */}
                              <View className="w-32 bg-purple-600 px-3 py-3 space-y-3">
                                <Text className="text-white font-medium text-sm">
                                  Picking QTY
                                </Text>
                                <Text className="text-white font-medium text-sm">
                                  Reason
                                </Text>
                                <Text className="text-white font-medium text-sm">
                                  Remarks
                                </Text>
                              </View>

                              {/* Right Column - White Background with Input Fields */}
                              <View className="flex-1 bg-white px-3 py-3 space-y-3">
                                <TextInput
                                  className="border border-gray-300 rounded px-3 py-2 text-gray-900"
                                  value={item.pickingQty?.toString()}
                                  onChangeText={(value) =>
                                    updateItemFormData(
                                      index,
                                      "pickingQty",
                                      parseFloat(value) || 0
                                    )
                                  }
                                  keyboardType="numeric"
                                />

                                <Pressable
                                  className="border border-gray-300 rounded px-3 py-2 flex-row items-center justify-between"
                                  onPress={() => {
                                    // Show reason selection modal or dropdown
                                    Alert.alert(
                                      "Select Reason",
                                      "Choose a reason:",
                                      [
                                        ...reasonsData.map((reason: any) => ({
                                          text: reason.reasonDescription,
                                          onPress: () =>
                                            handleReasonChange(
                                              index,
                                              reason.id.toString()
                                            ),
                                        })),
                                        {
                                          text: "Cancel",
                                          style: "cancel" as const,
                                        },
                                      ]
                                    );
                                  }}
                                >
                                  <Text className="text-gray-900 flex-1">
                                    {item.reasonDescription}
                                  </Text>
                                  <ChevronDown size={16} color="#9ca3af" />
                                </Pressable>

                                <TextInput
                                  className="border border-gray-300 rounded px-3 py-2 text-gray-900"
                                  placeholder="Enter remarks..."
                                  placeholderTextColor="#9ca3af"
                                  value={item.stageRemarks}
                                  onChangeText={(value) =>
                                    updateItemFormData(
                                      index,
                                      "stageRemarks",
                                      value
                                    )
                                  }
                                />
                              </View>
                            </View>
                          </View>
                        ))}
                      </View>

                      {/* Cancelled Items Section - Only show if there are cancelled items */}
                      {getCancelledItems(
                        stageDetailsData?.do_Head?.do_Detail || []
                      ).length > 0 && (
                        <View className="mt-6">
                          <Text className="text-lg font-semibold text-gray-900 mb-3">
                            Cancelled Items
                          </Text>

                          {/* Table Header */}
                          <View className="bg-red-600 rounded-t-lg px-4 py-3">
                            <View className="flex-row">
                              <View className="flex-1">
                                <Text className="text-white font-semibold">
                                  Item Name & Code
                                </Text>
                              </View>
                              <View className="w-20">
                                <Text className="text-white font-semibold text-center">
                                  Quantity
                                </Text>
                              </View>
                              <View className="w-20">
                                <Text className="text-white font-semibold text-center">
                                  Status
                                </Text>
                              </View>
                            </View>
                          </View>

                          {/* Cancelled Items Rows */}
                          {getCancelledItems(
                            stageDetailsData.do_Head.do_Detail
                          ).map((item: any, index: number) => (
                            <View
                              key={`cancelled-dispatch-${index}`}
                              className="border-l border-r border-b border-gray-200 last:rounded-b-lg"
                            >
                              {/* Item Row - Light Red Background */}
                              <View className="px-4 py-3 bg-red-50">
                                <View className="flex-row items-center">
                                  <View className="flex-1">
                                    <Text className="text-gray-900 font-medium">
                                      {item.description}
                                    </Text>
                                    <Text className="text-gray-600 text-sm">
                                      ({item.itemCode})
                                    </Text>
                                  </View>
                                  <View className="w-20">
                                    <Text className="text-gray-600 text-center">
                                      {item.deliveryQty}
                                    </Text>
                                  </View>
                                  <View className="w-20">
                                    <Text className="text-red-600 font-medium text-center">
                                      CANCELLED
                                    </Text>
                                  </View>
                                </View>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}
                    </Animated.View>
                  )}

                {/* Confirmation Stage Form - Only show for DISPATCHED and PARTIALLYDISPATCHED status */}
                {currentStage === "delivered" &&
                  (orderData.status === "DISPATCHED" ||
                    orderData.status === "PARTIALLYDISPATCHED") &&
                  isExpanded && (
                    <Animated.View
                      entering={FadeInUp.duration(300)}
                      className="mt-4 space-y-4"
                    >
                      {/* Remarks Field */}
                      <View className="space-y-3">
                        <View>
                          <Text className="text-gray-600 font-medium mb-2">
                            Remarks (if any)
                          </Text>
                          <TextInput
                            className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                            placeholder="Enter remarks..."
                            placeholderTextColor="#9ca3af"
                            value={remarks}
                            onChangeText={setRemarks}
                            multiline
                            numberOfLines={2}
                          />
                        </View>
                      </View>

                      {/* Payment Mode Selection */}
                      <View className="space-y-3">
                        <Text className="text-gray-600 font-medium mb-2">
                          Payment Type
                        </Text>
                        <Pressable
                          className="border border-gray-300 rounded-lg px-3 py-2 flex-row items-center justify-between"
                          onPress={() => {
                            Alert.alert(
                              "Select Payment Mode",
                              "Choose a payment mode:",
                              [
                                ...paymentModeData.map((mode: any) => ({
                                  text: mode.paymentModeName,
                                  onPress: () =>
                                    setSelectedPaymentMode(mode.id.toString()),
                                })),
                                {
                                  text: "Cancel",
                                  style: "cancel" as const,
                                },
                              ]
                            );
                          }}
                        >
                          <Text className="text-gray-900 flex-1">
                            {paymentModeData.find(
                              (mode: any) =>
                                mode.id.toString() === selectedPaymentMode
                            )?.paymentModeName || "Select Payment Mode"}
                          </Text>
                          <ChevronDown size={16} color="#9ca3af" />
                        </Pressable>
                      </View>

                      {/* Feedback Emoji Selection */}
                      <View className="space-y-3">
                        <Text className="text-gray-600 font-medium mb-2">
                          Customer Feedback
                        </Text>
                        <View className="flex-row space-x-4">
                          <Pressable
                            onPress={() => setSelectedFeedbackEmoji("happy")}
                            className={`w-16 h-16 rounded-full items-center justify-center ${
                              selectedFeedbackEmoji === "happy"
                                ? "bg-green-100 border-2 border-green-500"
                                : "bg-gray-100 border-2 border-gray-300"
                            }`}
                          >
                            <Text className="text-2xl">😊</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => setSelectedFeedbackEmoji("sad")}
                            className={`w-16 h-16 rounded-full items-center justify-center ${
                              selectedFeedbackEmoji === "sad"
                                ? "bg-red-100 border-2 border-red-500"
                                : "bg-gray-100 border-2 border-gray-300"
                            }`}
                          >
                            <Text className="text-2xl">😞</Text>
                          </Pressable>
                        </View>
                      </View>

                      {/* Customer Signature */}
                      <View className="space-y-3">
                        <Text className="text-gray-600 font-medium mb-2">
                          Customer Signature
                        </Text>
                        <View className="border border-gray-300 rounded-lg bg-white">
                          {/* Signature Canvas Area */}
                          <View className="h-48 bg-white relative">
                            {/* Drawing Canvas */}
                            <View
                              className="flex-1 bg-white"
                              {...panResponder.panHandlers}
                            >
                              {customerSignature ? (
                                <View className="flex-1 items-center justify-center">
                                  <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center mb-2">
                                    <CheckCircle2 size={24} color="#10b981" />
                                  </View>
                                  <Text className="text-green-600 font-medium">
                                    Signature Captured
                                  </Text>
                                  <Text className="text-gray-500 text-sm mt-1">
                                    Tap to re-sign
                                  </Text>
                                </View>
                              ) : (
                                <View className="flex-1">
                                  {/* Render signature paths using SVG */}
                                  <Svg
                                    style={{
                                      position: "absolute",
                                      top: 0,
                                      left: 0,
                                      width: "100%",
                                      height: "100%",
                                    }}
                                  >
                                    {/* Render completed paths */}
                                    {signaturePaths.map((path, index) => (
                                      <Path
                                        key={index}
                                        d={path}
                                        stroke="#000000"
                                        strokeWidth="3"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeMiterlimit="10"
                                      />
                                    ))}
                                    {/* Render current path being drawn */}
                                    {currentPath && (
                                      <Path
                                        d={currentPath}
                                        stroke="#000000"
                                        strokeWidth="3"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeMiterlimit="10"
                                      />
                                    )}
                                  </Svg>
                                </View>
                              )}
                            </View>

                            {/* Clear Button - Bottom Right */}
                            <Pressable
                              onPress={clearSignature}
                              className="absolute bottom-3 right-3 w-8 h-8 bg-red-500 rounded-full items-center justify-center"
                            >
                              <X size={16} color="white" />
                            </Pressable>
                          </View>

                          {/* Signature Actions */}
                          <View className="px-4 py-3 border-t border-gray-200">
                            <Pressable
                              onPress={captureSignature}
                              className="w-full bg-purple-600 rounded-lg py-3 items-center"
                            >
                              <Text className="text-white font-medium">
                                {customerSignature
                                  ? "Re-sign"
                                  : "Capture Signature"}
                              </Text>
                            </Pressable>
                          </View>
                        </View>
                      </View>

                      {/* File Upload */}
                      <View className="space-y-3">
                        <View className="flex-row items-center space-x-3">
                          {/* File upload label */}
                          <Text className="text-gray-900 font-medium text-base">
                            File upload
                          </Text>

                          {/* Choose file button */}
                          <Pressable
                            onPress={selectFile}
                            className="border border-gray-300 rounded-lg px-4 py-2 bg-white"
                          >
                            <Text className="text-gray-600 font-medium">
                              {uploadedFile
                                ? uploadedFile.name ||
                                  uploadedFile.fileName ||
                                  "Selected file"
                                : "Choose file"}
                            </Text>
                          </Pressable>

                          {/* Upload icon button - only show when no file is selected */}
                          {!uploadedFile && (
                            <Pressable
                              onPress={selectFile}
                              className="w-8 h-8 items-center justify-center"
                            >
                              <View className="w-6 h-6">
                                {/* Upload icon */}
                                <View className="w-4 h-4 border-2 border-black rounded-sm items-center justify-center">
                                  <View className="w-2 h-1 bg-black" />
                                </View>
                                <View className="w-0 h-0 border-l-2 border-r-2 border-b-4 border-l-transparent border-r-transparent border-b-black absolute top-0 left-1" />
                              </View>
                            </Pressable>
                          )}
                        </View>

                        {/* Action buttons - only show when file is selected */}
                        {uploadedFile && (
                          <View className="flex-row space-x-3 mt-2">
                            <Pressable
                              onPress={clearFile}
                              className="px-4 py-2 bg-red-500 rounded-lg"
                            >
                              <Text className="text-white font-medium">
                                Clear
                              </Text>
                            </Pressable>
                            <Pressable
                              onPress={() => uploadFile(true)}
                              className="px-4 py-2 bg-green-500 rounded-lg"
                            >
                              <Text className="text-white font-medium">
                                Upload
                              </Text>
                            </Pressable>
                          </View>
                        )}
                      </View>

                      {/* Items Table - Always show table layout */}
                      <View className="mt-4">
                        <Text className="text-lg font-semibold text-gray-900 mb-3">
                          Items
                        </Text>

                        {/* Table Header */}
                        <View className="bg-purple-600 rounded-t-lg px-4 py-3">
                          <View className="flex-row">
                            <View className="flex-1">
                              <Text className="text-white font-semibold">
                                Item Name & Code
                              </Text>
                            </View>
                            <View className="w-20">
                              <Text className="text-white font-semibold text-center">
                                Quantity
                              </Text>
                            </View>
                            <View className="w-20">
                              <Text className="text-white font-semibold text-center">
                                Status
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Table Rows */}
                        {stageDetailsData?.do_Head?.do_Detail &&
                        stageDetailsData.do_Head.do_Detail.length > 0 ? (
                          getActiveItems(
                            stageDetailsData.do_Head.do_Detail
                          ).map((item: any, index: number) => (
                            <View
                              key={index}
                              className="border-l border-r border-b border-gray-200 last:rounded-b-lg"
                            >
                              {/* Item Row - Light Gray Background */}
                              <View className="px-4 py-3 bg-gray-100">
                                <View className="flex-row items-center">
                                  <View className="flex-1">
                                    <Text className="text-gray-900 font-medium">
                                      {item.description}
                                    </Text>
                                    <Text className="text-gray-600 text-sm">
                                      ({item.itemCode})
                                    </Text>
                                  </View>
                                  <View className="w-20">
                                    <Text className="text-gray-600 text-center">
                                      {item.deliveryQty}
                                    </Text>
                                  </View>
                                  <View className="w-20">
                                    <Text className="text-purple-600 font-medium text-center">
                                      {item.childStatus}
                                    </Text>
                                  </View>
                                </View>
                              </View>

                              {/* Form Fields Row - Purple and White Design */}
                              <View className="flex-row">
                                {/* Left Column - Purple Background with Labels */}
                                <View className="w-32 bg-purple-600 px-3 py-3 space-y-3">
                                  <Text className="text-white font-medium text-sm">
                                    Picking QTY
                                  </Text>
                                  <Text className="text-white font-medium text-sm">
                                    Reason
                                  </Text>
                                  <Text className="text-white font-medium text-sm">
                                    Remarks
                                  </Text>
                                </View>

                                {/* Right Column - White Background with Input Fields */}
                                <View className="flex-1 bg-white px-3 py-3 space-y-3">
                                  <TextInput
                                    className="border border-gray-300 rounded px-3 py-2 text-gray-900"
                                    value={item.deliveryQty?.toString()}
                                    onChangeText={(value) => {
                                      // Update the item data if needed
                                      console.log(
                                        `Updated picking quantity for item ${index}:`,
                                        value
                                      );
                                    }}
                                    keyboardType="numeric"
                                  />

                                  <Pressable
                                    className="border border-gray-300 rounded px-3 py-2 flex-row items-center justify-between"
                                    onPress={() => {
                                      // Show reason selection modal or dropdown
                                      Alert.alert(
                                        "Select Reason",
                                        "Choose a reason:",
                                        [
                                          ...reasonsData.map((reason: any) => ({
                                            text: reason.reasonDescription,
                                            onPress: () => {
                                              console.log(
                                                `Selected reason for item ${index}:`,
                                                reason.reasonDescription
                                              );
                                            },
                                          })),
                                          {
                                            text: "Cancel",
                                            style: "cancel" as const,
                                          },
                                        ]
                                      );
                                    }}
                                  >
                                    <Text className="text-gray-900 flex-1">
                                      {reasonsData[0]?.reasonDescription ||
                                        "Select Reason"}
                                    </Text>
                                    <ChevronDown size={16} color="#9ca3af" />
                                  </Pressable>

                                  <TextInput
                                    className="border border-gray-300 rounded px-3 py-2 text-gray-900"
                                    placeholder="Enter remarks..."
                                    placeholderTextColor="#9ca3af"
                                    value=""
                                    onChangeText={(value) => {
                                      console.log(
                                        `Updated remarks for item ${index}:`,
                                        value
                                      );
                                    }}
                                  />
                                </View>
                              </View>
                            </View>
                          ))
                        ) : (
                          /* Empty state when no data */
                          <View className="border-l border-r border-b border-gray-200 rounded-b-lg">
                            <View className="px-4 py-8 bg-gray-50">
                              <Text className="text-gray-500 text-center">
                                No items available
                              </Text>
                            </View>
                          </View>
                        )}
                      </View>

                      {/* Cancelled Items Section - Only show if there are cancelled items */}
                      {getCancelledItems(
                        stageDetailsData?.do_Head?.do_Detail || []
                      ).length > 0 && (
                        <View className="mt-6">
                          <Text className="text-lg font-semibold text-gray-900 mb-3">
                            Cancelled Items
                          </Text>

                          {/* Table Header */}
                          <View className="bg-red-600 rounded-t-lg px-4 py-3">
                            <View className="flex-row">
                              <View className="flex-1">
                                <Text className="text-white font-semibold">
                                  Item Name & Code
                                </Text>
                              </View>
                              <View className="w-20">
                                <Text className="text-white font-semibold text-center">
                                  Quantity
                                </Text>
                              </View>
                              <View className="w-20">
                                <Text className="text-white font-semibold text-center">
                                  Status
                                </Text>
                              </View>
                            </View>
                          </View>

                          {/* Cancelled Items Rows */}
                          {getCancelledItems(
                            stageDetailsData.do_Head.do_Detail
                          ).map((item: any, index: number) => (
                            <View
                              key={`cancelled-${index}`}
                              className="border-l border-r border-b border-gray-200 last:rounded-b-lg"
                            >
                              {/* Item Row - Light Red Background */}
                              <View className="px-4 py-3 bg-red-50">
                                <View className="flex-row items-center">
                                  <View className="flex-1">
                                    <Text className="text-gray-900 font-medium">
                                      {item.description}
                                    </Text>
                                    <Text className="text-gray-600 text-sm">
                                      ({item.itemCode})
                                    </Text>
                                  </View>
                                  <View className="w-20">
                                    <Text className="text-gray-600 text-center">
                                      {item.deliveryQty}
                                    </Text>
                                  </View>
                                  <View className="w-20">
                                    <Text className="text-red-600 font-medium text-center">
                                      CANCELLED
                                    </Text>
                                  </View>
                                </View>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}
                    </Animated.View>
                  )}

                {/* Debug Information - API Data */}
                {__DEV__ && (
                  <View className="mt-4 p-3 bg-gray-100 rounded-lg">
                    <Text className="text-xs text-gray-600 mb-2">
                      API Data Debug:
                    </Text>
                    <Pressable
                      onPress={() => {
                        console.log("Test dialog button pressed");
                        showSuccessDialogWithConfig(
                          "Test Dialog",
                          "This is a test dialog to verify it's working correctly.",
                          "success"
                        );
                      }}
                      className="mt-2 p-2 bg-blue-500 rounded"
                    >
                      <Text className="text-white text-xs">
                        Test Success Dialog
                      </Text>
                    </Pressable>
                    <Text className="text-xs text-gray-500">
                      Stages: {stagesData.length} items
                    </Text>
                    <Text className="text-xs text-gray-500">
                      Selected Cards: {selectedCards.length} items
                    </Text>
                    <Text className="text-xs text-gray-500">
                      Feedback: {feedbackData ? "Loaded" : "Not loaded"}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      Reasons: {reasonsData.length} items
                    </Text>
                    <Text className="text-xs text-gray-500">
                      Stage Details:{" "}
                      {stageDetailsData ? "Loaded" : "Not loaded"}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      Payment Modes: {paymentModeData.length} items
                    </Text>
                    <Text className="text-xs text-gray-500">
                      Item Form Data: {itemFormData.length} items (Active only)
                    </Text>
                    <Text className="text-xs text-gray-500">
                      Total Items:{" "}
                      {stageDetailsData?.do_Head?.do_Detail?.length || 0} items
                    </Text>
                    <Text className="text-xs text-gray-500">
                      Active Items:{" "}
                      {
                        getActiveItems(
                          stageDetailsData?.do_Head?.do_Detail || []
                        ).length
                      }{" "}
                      items
                    </Text>
                    <Text className="text-xs text-gray-500">
                      Cancelled Items:{" "}
                      {
                        getCancelledItems(
                          stageDetailsData?.do_Head?.do_Detail || []
                        ).length
                      }{" "}
                      items
                    </Text>
                    <Text className="text-xs text-gray-500">
                      Selected Payment Mode: {selectedPaymentMode}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      Feedback Emoji: {selectedFeedbackEmoji}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      Signature:{" "}
                      {customerSignature ? "Captured" : "Not captured"}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      File Upload: {uploadedFile ? "Uploaded" : "Not uploaded"}
                    </Text>
                  </View>
                )}

                {/* Expand Button - Bottom Center when collapsed */}
                {!isExpanded && (
                  <View className="items-center mt-4">
                    <Pressable
                      onPress={handleCardPress}
                      className="items-center active:bg-gray-50 rounded-lg p-2 -m-2"
                      android_ripple={{ color: "rgba(0,0,0,0.05)" }}
                    >
                      <Text className="text-gray-500 text-sm mb-2">Expand</Text>
                      <View
                        className="w-8 h-8 rounded-full items-center justify-center"
                        style={{ backgroundColor: "#8b5cf6" }}
                      >
                        <ChevronDown
                          size={16}
                          color="white"
                          style={{
                            transform: [{ rotate: "0deg" }],
                          }}
                        />
                      </View>
                    </Pressable>
                  </View>
                )}

                {/* Collapse Button - Bottom Center when expanded */}
                {isExpanded && (
                  <View className="items-center mt-4">
                    <Pressable
                      onPress={handleCardPress}
                      className="items-center active:bg-gray-50 rounded-lg p-2 -m-2"
                      android_ripple={{ color: "rgba(0,0,0,0.05)" }}
                    >
                      <Text className="text-gray-500 text-sm mb-2">
                        Collapse
                      </Text>
                      <View
                        className="w-8 h-8 rounded-full items-center justify-center"
                        style={{ backgroundColor: "#8b5cf6" }}
                      >
                        <ChevronDown
                          size={16}
                          color="white"
                          style={{
                            transform: [{ rotate: "180deg" }],
                          }}
                        />
                      </View>
                    </Pressable>
                  </View>
                )}
              </View>
            </Animated.View>
          </ScrollView>
        )}

        {/* Success Dialog */}
        <SuccessDialog
          visible={showSuccessDialog}
          title={successDialogConfig.title}
          message={successDialogConfig.message}
          type={successDialogConfig.type}
          confirmText="Continue"
          onConfirm={() => {
            console.log("Success dialog confirmed");
            setShowSuccessDialog(false);
            onBack(); // Go back to previous screen
          }}
          onCancel={() => {
            console.log("Success dialog cancelled");
            setShowSuccessDialog(false);
            onBack(); // Go back to previous screen
          }}
          showCancel={false}
        />
      </SafeAreaView>
    </>
  );
};

export default DeliveryStageDetailsScreen;
