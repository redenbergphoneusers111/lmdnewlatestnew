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
import pickupOrderService, {
  PickupOrder,
  PickupOrderItem,
  PickupStageDetails,
} from "../services/pickupOrderService";
import { useAuth } from "../contexts/AuthContext";
import SuccessDialog from "../components/ui/SuccessDialog";

export type PickupStage = "open" | "picking" | "picked" | "completed";

interface PickupStageDetailsScreenProps {
  orderData: PickupOrder;
  currentStage: PickupStage;
  onBack: () => void;
  onStageChange?: (newStage: PickupStage) => void;
}

const PickupStageDetailsScreen: React.FC<PickupStageDetailsScreenProps> = ({
  orderData,
  currentStage,
  onBack,
  onStageChange,
}) => {
  const { selectedVehicle } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectAll, setSelectAll] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCardSelected, setIsCardSelected] = useState(false);
  const [selectedCards, setSelectedCards] = useState<any[]>([]);

  // API data states
  const [stagesData, setStagesData] = useState<any[]>([]);
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [reasonsData, setReasonsData] = useState<any[]>([]);
  const [stageDetailsData, setStageDetailsData] =
    useState<PickupStageDetails | null>(null);
  const [paymentModeData, setPaymentModeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Pickup stage form data
  const [itemFormData, setItemFormData] = useState<PickupOrderItem[]>([]);
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

  // Get active pickup items (non-completed)
  const getActivePickupItems = (items: PickupOrderItem[]) => {
    return items.filter((item: PickupOrderItem) => !item.isCancelled);
  };

  // Get completed pickup items
  const getCompletedPickupItems = (items: PickupOrderItem[]) => {
    return items.filter((item: PickupOrderItem) => item.isCancelled);
  };

  // Helper function to get the correct menu name for API calls
  const getMenuNameForAPI = (stage: PickupStage, pickupStatus: string) => {
    console.log("getMenuNameForAPI called with:", { stage, pickupStatus });
    return pickupOrderService.getPickupMenuName(stage, pickupStatus);
  };

  // API call functions
  const fetchStagesData = async () => {
    try {
      const stageType = "Pickup%20order";
      const menuName = getMenuNameForAPI(currentStage, orderData.status);
      const vehicleId = selectedVehicle?.id || 5;

      const response = await pickupOrderService.getPickupStages(
        stageType,
        menuName,
        vehicleId
      );
      if (response.success && response.data) {
        setStagesData(Array.isArray(response.data) ? response.data : []);
        console.log("Stages data loaded:", response.data);
      }
    } catch (error) {
      console.error("Error fetching stages data:", error);
    }
  };

  const fetchStageDetailsData = async () => {
    try {
      const stageType = "Pickup%20order";
      const menuName = getMenuNameForAPI(currentStage, orderData.status);

      // Use doStr (pickup string) instead of id for the API call
      const pickupString =
        orderData.doStr || orderData.id?.toString() || orderData.docNum;
      console.log("Using pickup string for API call:", pickupString);

      const response = await pickupOrderService.getPickupStageDetails(
        pickupString,
        stageType,
        menuName
      );
      if (response.success && response.data) {
        setStageDetailsData(response.data);
        console.log("Pickup stage details data loaded:", response.data);
        console.log(
          "Items in response:",
          response.data?.pu_Head?.pu_Detail?.length || 0
        );
        console.log("Items data:", response.data?.pu_Head?.pu_Detail);
      } else {
        console.log("Failed to load stage details:", response.error);
      }
    } catch (error) {
      console.error("Error fetching pickup stage details data:", error);
    }
  };

  const fetchPaymentModeData = async () => {
    try {
      const response = await pickupOrderService.getPaymentModeMaster();
      if (response.success && response.data) {
        setPaymentModeData(Array.isArray(response.data) ? response.data : []);
        console.log("Payment mode data loaded:", response.data);
      }
    } catch (error) {
      console.error("Error fetching payment mode data:", error);
    }
  };

  const fetchFeedbackData = async () => {
    try {
      const response = await pickupOrderService.getFeedbackData();
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
      const stageType = "Pickup%20order";
      const menuName = getMenuNameForAPI(currentStage, orderData.status);

      const response = await pickupOrderService.getPickupReasons(
        stageType,
        menuName
      );
      if (response.success && response.data) {
        setReasonsData(Array.isArray(response.data) ? response.data : []);
        console.log("Reasons data loaded:", response.data);
      }
    } catch (error) {
      console.error("Error fetching reasons data:", error);
    }
  };

  // Initialize pickup form data for picking stage
  const initializePickupFormData = () => {
    console.log("Initializing pickup form data...");
    console.log("stageDetailsData:", stageDetailsData);
    console.log("reasonsData length:", reasonsData.length);

    if (stageDetailsData?.pu_Head?.pu_Detail) {
      // Filter out cancelled items and only include active items
      const activeItems = getActivePickupItems(
        stageDetailsData.pu_Head.pu_Detail
      );
      console.log("Active pickup items count:", activeItems.length);

      const items = activeItems.map((item: PickupOrderItem) => ({
        ...item,
        pickedQty: item.openQty || 0, // Initialize with open quantity
        pickupRemarks: item.pickupRemarks || "",
        condition: item.condition || "Good", // Default condition
        isSelected: false, // Initialize selection state
      }));
      console.log("Setting pickup form data (active items only):", items);
      setItemFormData(items);
    } else {
      console.log(
        "Cannot initialize pickup form data - missing stage details data"
      );
    }
  };

  const loadAllAPIData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchStagesData(),
        fetchStageDetailsData(),
        fetchPaymentModeData(),
        fetchFeedbackData(),
        fetchReasonsData(),
      ]);
    } catch (error) {
      console.error("Error loading API data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    console.log("PickupStageDetailsScreen mounted with orderData:", orderData);
    console.log("Available orderData properties:", {
      id: orderData.id,
      doStr: orderData.doStr,
      docNum: orderData.docNum,
      cardName: orderData.cardName,
      status: orderData.status,
    });
    loadAllAPIData();
  }, []);

  // Initialize pickup form data when stage details are loaded
  useEffect(() => {
    if (stageDetailsData) {
      initializePickupFormData();
    }
  }, [stageDetailsData]);

  // Show success dialog with configuration
  const showSuccessDialogWithConfig = (
    title: string,
    message: string,
    type: "success" | "confirmation"
  ) => {
    setSuccessDialogConfig({ title, message, type });
    setShowSuccessDialog(true);
  };

  // Handle success dialog close
  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false);
    onBack(); // Go back to previous screen
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancel Pickup",
      "Are you sure you want to cancel this pickup order?",
      [
        {
          text: "No",
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: () => {
            onBack(); // Go back to previous screen
          },
        },
      ]
    );
  };

  // Handle confirmation when no items are loaded
  const handleConfirmWithEmptyItems = async () => {
    try {
      setLoading(true);

      // Create pickup stage payload for OPEN -> REQUESTED transition with empty items
      const payload = createPickupStagePayload("REQUESTED");

      console.log("Submitting pickup stage payload (empty items):", payload);

      // Submit to API
      const response = await pickupOrderService.submitPickupStage(payload);

      console.log("Pickup stage API response:", response);

      if (response.success && response.data) {
        showSuccessDialogWithConfig(
          "Pickup Requested!",
          "The pickup order has been successfully requested. You can now proceed with the pickup confirmation.",
          "success"
        );
      } else {
        throw new Error(response.error || "Failed to request pickup");
      }
    } catch (error) {
      console.error("Error requesting pickup:", error);
      Alert.alert("Error", "Failed to request pickup. Please try again.", [
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
  };

  const handleConfirm = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // For picking stage (OPEN -> REQUESTED), handle API submission
    if (currentStage === "picking") {
      // Allow proceeding even if no items are loaded yet
      if (itemFormData.length === 0) {
        Alert.alert(
          "No Items Loaded",
          "No pickup items are currently loaded. Do you want to proceed anyway?",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Proceed", onPress: () => handleConfirmWithEmptyItems() },
          ]
        );
        return;
      }

      try {
        setLoading(true);

        // Create pickup stage payload for OPEN -> REQUESTED transition
        const payload = createPickupStagePayload("REQUESTED");

        console.log("Submitting pickup stage payload:", payload);

        // Submit to API
        const response = await pickupOrderService.submitPickupStage(payload);

        console.log("Pickup stage API response:", response);

        if (response.success && response.data) {
          showSuccessDialogWithConfig(
            "Pickup Requested!",
            "The pickup order has been successfully requested. You can now proceed with the pickup confirmation.",
            "success"
          );
        } else {
          throw new Error(response.error || "Failed to request pickup");
        }
      } catch (error) {
        console.error("Error requesting pickup:", error);
        Alert.alert("Error", "Failed to request pickup. Please try again.", [
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

    // For picked stage (REQUESTED -> CLOSED), handle API submission
    if (currentStage === "picked") {
      if (itemFormData.length === 0) {
        Alert.alert("No Items", "No pickup items available to complete.");
        return;
      }

      // Validate required fields for pickup confirmation
      if (!customerSignature) {
        Alert.alert(
          "Validation Error",
          "Customer signature is required for pickup confirmation."
        );
        return;
      }

      if (!uploadedFile) {
        Alert.alert(
          "Validation Error",
          "File upload is required for pickup confirmation."
        );
        return;
      }

      if (!selectedFeedbackEmoji) {
        Alert.alert(
          "Validation Error",
          "Customer feedback is required for pickup confirmation."
        );
        return;
      }

      try {
        setLoading(true);

        // Upload file if not already uploaded
        if (uploadedFile && !uploadedFileUrl) {
          try {
            console.log("Uploading file before confirmation...");
            const uploadResult = await uploadFile(false); // Don't show success alert during confirmation
            const fileUploadUrl =
              uploadResult?.url || uploadResult?.fileUrl || "";
            console.log("File uploaded successfully, URL:", fileUploadUrl);
          } catch (uploadError) {
            console.error("File upload failed:", uploadError);
            Alert.alert(
              "Upload Error",
              "Failed to upload file. Please try again."
            );
            return;
          }
        }

        // Create pickup completion payload for REQUESTED -> CLOSED transition
        const payload = createPickupStagePayload("CLOSED");

        console.log("Submitting pickup completion payload:", payload);

        // Submit to API
        const response = await pickupOrderService.submitPickupStage(payload);

        console.log("Pickup completion API response:", response);

        if (response.success && response.data) {
          showSuccessDialogWithConfig(
            "Pickup Completed!",
            "The pickup order has been successfully completed. Thank you for your service!",
            "success"
          );
        } else {
          throw new Error(response.error || "Failed to complete pickup");
        }
      } catch (error) {
        console.error("Error completing pickup:", error);
        Alert.alert("Error", "Failed to complete pickup. Please try again.", [
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

    // For completed stage, show popup that item is closed
    if (currentStage === "completed") {
      Alert.alert(
        "Item Closed",
        "This pickup order is already completed and cannot be opened.",
        [{ text: "OK" }]
      );
      return;
    }

    // For other stages, use the original logic
    console.log("No specific handling for stage:", currentStage);
  };

  // Create pickup stage payload based on the API specification
  const createPickupStagePayload = (stageStatus: string) => {
    const stageDefinitionID =
      stageDetailsData?.stage_Def_Detail?.stageDefinitionID?.toString() || "3";
    const stageDefinitionDetailsID =
      stageDetailsData?.stage_Def_Detail?.details_ID?.toString() || "11";
    const menuName =
      currentStage === "picking" ? "Pickup Order" : "Return Confirmation";

    return [
      {
        stageDate: new Date().toISOString(),
        orderID: orderData.id?.toString() || orderData.docNum,
        stageDefinitionID,
        stageDefinitionDetailsID,
        menuName,
        stageRemarks: remarks,
        isSignatureAdded: currentStage === "picked", // Signature required for Return Confirmation
        latitude: "",
        longitude: "",
        locationTimeStamp: "",
        stageStatus,
        isActive: true,
        cby: "1",
        isPartialPreviousStage: false,
        reasonID: 0,
        reasonDescription: "",
        vehicleID: selectedVehicle?.id?.toString() || "5",
        locationID: "0",
        isScanned: false,
        paymentModeId: selectedPaymentMode || "0",
        expectedAmount: "0",
        signatures: customerSignature || "",
        fileUploadUrl: uploadedFileUrl || "",
        physicalSigned: false,
        fileUploadValidation: currentStage === "picked", // File upload required for Return Confirmation
        isHappy: selectedFeedbackEmoji === "Happy",
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
          itemFormData.length > 0
            ? itemFormData
                .filter((item) => !item.isCancelled)
                .map((item) => ({
                  orderDetailsID: item.details_ID,
                  lineNo: item.lineNo,
                  itemCode: item.itemCode,
                  orderQty: item.returnQty,
                  stageQty: item.pickedQty || item.returnQty,
                  openQty: item.openQty,
                  stageStatus,
                  stageRemarks: item.pickupRemarks || "",
                  paymentModeId: "",
                  expectedAmount: "0",
                  reasonID: "5", // Default to "Cancelled" reason
                  reasonDescription: "Cancelled",
                  oQty: item.returnQty,
                  nonReturnQty: 0,
                  returnQty: item.pickedQty || item.returnQty,
                }))
            : [], // Empty array when no items are loaded,
      },
    ];
  };

  // Handle pickup form data updates
  const updatePickupFormData = (index: number, field: string, value: any) => {
    const updatedData = [...itemFormData];
    updatedData[index] = { ...updatedData[index], [field]: value };
    setItemFormData(updatedData);
  };

  // Handle reason selection
  const handleReasonSelection = (itemIndex: number, reasonId: string) => {
    const selectedReason = reasonsData.find(
      (r) => r.id?.toString() === reasonId
    );
    updatePickupFormData(itemIndex, "reasonID", reasonId);
    updatePickupFormData(
      itemIndex,
      "reasonDescription",
      selectedReason?.reasonDescription || ""
    );
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

  // Handle card selection
  const handleCardSelect = () => {
    setIsCardSelected(!isCardSelected);
  };

  // Handle card press (expand/collapse)
  const handleCardPress = () => {
    setIsExpanded(!isExpanded);
  };

  // Handle select all
  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);

    // Update all items
    setItemFormData((prevData) =>
      prevData.map((item) => ({
        ...item,
        isSelected: newSelectAll,
      }))
    );

    // Update card selection state
    setIsCardSelected(newSelectAll);
    setSelectedCards(newSelectAll ? itemFormData : []);
  };

  // Handle call action
  const handleCall = () => {
    const phoneNumber = orderData.mobileNo || orderData.contactNumber;
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      Alert.alert(
        "No Phone Number",
        "Phone number not available for this pickup order."
      );
    }
  };

  // Get filtered items based on search query
  const getFilteredItems = () => {
    if (!searchQuery.trim()) {
      return itemFormData;
    }
    return itemFormData.filter(
      (item) =>
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.itemCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.details_ID?.toString().includes(searchQuery.toLowerCase())
    );
  };

  // Format date helper function
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  // Format amount helper function
  const formatAmount = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) return "N/A";
    return `$${amount.toFixed(2)}`;
  };

  // Get stage-specific UI elements
  const getStageColor = (stage: PickupStage) => {
    switch (stage) {
      case "open":
        return "#3b82f6"; // Blue
      case "picking":
        return "#f59e0b"; // Orange
      case "picked":
        return "#8b5cf6"; // Purple
      case "completed":
        return "#10b981"; // Green
      default:
        return "#6b7280"; // Gray
    }
  };

  const getStageIcon = (stage: PickupStage) => {
    switch (stage) {
      case "open":
        return Package;
      case "picking":
        return ClipboardList;
      case "picked":
        return Truck;
      case "completed":
        return CheckCircle2;
      default:
        return Package;
    }
  };

  const getStageTitle = (stage: PickupStage) => {
    switch (stage) {
      case "open":
        return "Pickup Details";
      case "picking":
        return "Pickup Items";
      case "picked":
        return "Pickup Confirmation";
      case "completed":
        return "Pickup Completed";
      default:
        return "Pickup Order";
    }
  };

  const stageColor = getStageColor(currentStage);
  const StageIcon = getStageIcon(currentStage);
  const filteredItems = getFilteredItems();

  // Show search bar for picking and picked stages
  const showSearchBar = currentStage === "picking" || currentStage === "picked";

  // Stage-specific logic
  const isCompleted = currentStage === "completed";
  const canCancel = currentStage !== "completed";
  const canConfirm = currentStage !== "completed";
  const showSelectionControls =
    currentStage === "picking" || currentStage === "picked";

  return (
    <>
      <SafeAreaView className="flex-1 bg-gray-50">
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(600)}
          className="px-4 py-2"
          style={{ backgroundColor: stageColor }}
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
            <ActivityIndicator size="large" color={stageColor} />
            <Text className="text-gray-600 mt-2">Loading data...</Text>
          </View>
        )}

        {!loading && (
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* Search Bar - Show for picking and picked stages */}
            {showSearchBar && (
              <Animated.View
                entering={SlideInDown.delay(200).duration(500)}
                className="bg-white px-4 py-3 border-b border-gray-100"
              >
                <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
                  <QrCode size={20} color="#6b7280" />
                  <TextInput
                    className="flex-1 ml-3 text-gray-900"
                    placeholder="Search Item Code/Description"
                    placeholderTextColor="#9ca3af"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  <View className="w-px h-6 bg-gray-300 mx-2" />
                  <Search size={20} color="#6b7280" />
                </View>
              </Animated.View>
            )}

            {/* Selection Controls */}
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
                    <Pressable
                      onPress={handleConfirm}
                      disabled={loading}
                      className="w-10 h-10 rounded-full items-center justify-center"
                      style={{
                        backgroundColor: loading ? "#9ca3af" : "#10b981",
                        opacity: loading ? 0.6 : 1,
                      }}
                      android_ripple={{ color: "rgba(255,255,255,0.3)" }}
                    >
                      <Check size={20} color="white" />
                    </Pressable>
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
                      borderColor: isCardSelected ? stageColor : "#d1d5db",
                      backgroundColor: isCardSelected
                        ? stageColor
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
                      style={{ backgroundColor: stageColor }}
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
                      ✓ Pickup Completed Successfully
                    </Text>
                  </View>
                )}

                {/* Picking Stage Form - Show for picking stage (OPEN) */}
                {currentStage === "picking" && isExpanded && (
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
                        Pickup Items
                      </Text>

                      {itemFormData.length > 0 ? (
                        <>
                          {/* Items Count Header */}
                          <View className="mb-2">
                            <Text className="text-sm text-gray-600">
                              {itemFormData.length} pickup items loaded
                            </Text>
                          </View>

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
                          {filteredItems.map((item, index) => (
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
                                      {item.returnQty}
                                    </Text>
                                  </View>
                                  <View className="w-20">
                                    <Text className="text-purple-600 font-medium text-center">
                                      {item.childStatus || "Open"}
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
                                    value={item.pickedQty?.toString() || ""}
                                    onChangeText={(value) =>
                                      updatePickupFormData(
                                        index,
                                        "pickedQty",
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
                                              handleReasonSelection(
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
                                      {item.reasonDescription ||
                                        "Select reason"}
                                    </Text>
                                    <ChevronDown size={16} color="#9ca3af" />
                                  </Pressable>

                                  <TextInput
                                    className="border border-gray-300 rounded px-3 py-2 text-gray-900"
                                    placeholder="Enter remarks..."
                                    placeholderTextColor="#9ca3af"
                                    value={item.pickupRemarks || ""}
                                    onChangeText={(value) =>
                                      updatePickupFormData(
                                        index,
                                        "pickupRemarks",
                                        value
                                      )
                                    }
                                  />
                                </View>
                              </View>
                            </View>
                          ))}
                        </>
                      ) : (
                        <View className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <Text className="text-gray-500 text-center mb-2">
                            No pickup items available yet.
                          </Text>
                          <Text className="text-gray-400 text-center text-sm">
                            Items will be loaded when stage details are fetched
                            from the API.
                          </Text>
                          {stageDetailsData && (
                            <Text className="text-gray-400 text-center text-xs mt-2">
                              Stage details loaded:{" "}
                              {stageDetailsData?.pu_Head?.pu_Detail?.length ||
                                0}{" "}
                              items
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                  </Animated.View>
                )}

                {/* Picked Stage Form - Show for picked stage (REQUESTED) */}
                {currentStage === "picked" && isExpanded && (
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
                        Pickup Items
                      </Text>

                      {itemFormData.length > 0 ? (
                        <>
                          {/* Items Count Header */}
                          <View className="mb-2">
                            <Text className="text-sm text-gray-600">
                              {itemFormData.length} pickup items loaded
                            </Text>
                          </View>

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
                          {filteredItems.map((item, index) => (
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
                                      {item.returnQty}
                                    </Text>
                                  </View>
                                  <View className="w-20">
                                    <Text className="text-purple-600 font-medium text-center">
                                      {item.childStatus || "Open"}
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
                                    value={item.pickedQty?.toString() || ""}
                                    onChangeText={(value) =>
                                      updatePickupFormData(
                                        index,
                                        "pickedQty",
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
                                              handleReasonSelection(
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
                                      {item.reasonDescription ||
                                        "Select reason"}
                                    </Text>
                                    <ChevronDown size={16} color="#9ca3af" />
                                  </Pressable>

                                  <TextInput
                                    className="border border-gray-300 rounded px-3 py-2 text-gray-900"
                                    placeholder="Enter remarks..."
                                    placeholderTextColor="#9ca3af"
                                    value={item.pickupRemarks || ""}
                                    onChangeText={(value) =>
                                      updatePickupFormData(
                                        index,
                                        "pickupRemarks",
                                        value
                                      )
                                    }
                                  />
                                </View>
                              </View>
                            </View>
                          ))}
                        </>
                      ) : (
                        <View className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <Text className="text-gray-500 text-center mb-2">
                            No pickup items available yet.
                          </Text>
                          <Text className="text-gray-400 text-center text-sm">
                            Items will be loaded when stage details are fetched
                            from the API.
                          </Text>
                          {stageDetailsData && (
                            <Text className="text-gray-400 text-center text-xs mt-2">
                              Stage details loaded:{" "}
                              {stageDetailsData?.pu_Head?.pu_Detail?.length ||
                                0}{" "}
                              items
                            </Text>
                          )}
                        </View>
                      )}
                    </View>

                    {/* Customer Feedback */}
                    <View className="space-y-3">
                      <Text className="text-gray-600 font-medium mb-2">
                        Customer Feedback{" "}
                        <Text className="text-red-500">*</Text>
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
                        Customer Signature{" "}
                        <Text className="text-red-500">*</Text>
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
                          File upload <Text className="text-red-500">*</Text>
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
                  </Animated.View>
                )}

                {/* Debug Information */}
                {__DEV__ && (
                  <View className="mt-4 p-3 bg-gray-100 rounded-lg">
                    <Text className="text-xs font-medium text-gray-700 mb-2">
                      Debug Information
                    </Text>
                    <Text className="text-xs text-gray-500">
                      Current Stage: {currentStage}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      Pickup Status: {orderData.status}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      Menu Name:{" "}
                      {getMenuNameForAPI(currentStage, orderData.status)}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      Pickup Form Data: {itemFormData.length} items (Active
                      only)
                    </Text>
                    <Text className="text-xs text-gray-500">
                      Total Items:{" "}
                      {stageDetailsData?.pu_Head?.pu_Detail?.length || 0} items
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
                        style={{ backgroundColor: stageColor }}
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
                        style={{ backgroundColor: stageColor }}
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

export default PickupStageDetailsScreen;
