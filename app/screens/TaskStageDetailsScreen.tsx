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
  FileText,
  Calendar as CalendarIcon,
  User as UserIcon,
  AlertCircle,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import apiService from "../services/apiService";
import taskService, {
  Task,
  TaskDetail,
  TaskStageDetails,
} from "../services/taskService";
import { useAuth } from "../contexts/AuthContext";
import SuccessDialog from "../components/ui/SuccessDialog";

export type TaskStage = "open" | "in_progress" | "completed";

interface TaskStageDetailsScreenProps {
  taskData: Task;
  currentStage: TaskStage;
  onBack: () => void;
  onStageChange?: (newStage: TaskStage) => void;
}

const TaskStageDetailsScreen: React.FC<TaskStageDetailsScreenProps> = ({
  taskData,
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
    useState<TaskStageDetails | null>(null);
  const [paymentModeData, setPaymentModeData] = useState<any[]>([]);
  const [assignedTaskDetails, setAssignedTaskDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // File upload states
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>("");

  // Signature states
  const [customerSignature, setCustomerSignature] = useState<string | null>(
    null
  );
  const [signaturePaths, setSignaturePaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(
    null
  );

  // Attachment checkbox state
  const [attachmentSentToSAP, setAttachmentSentToSAP] = useState(false);

  // Task stage form data
  const [taskFormData, setTaskFormData] = useState<TaskDetail[]>([]);
  const [selectedVehicleForDispatch, setSelectedVehicleForDispatch] =
    useState<string>("");
  const [selectedLocationForDispatch, setSelectedLocationForDispatch] =
    useState<string>("");
  const [remarks, setRemarks] = useState<string>("");

  // Confirmation stage form data
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>("");
  const [selectedFeedbackEmoji, setSelectedFeedbackEmoji] =
    useState<string>("");

  // Success dialog state
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successDialogConfig, setSuccessDialogConfig] = useState({
    title: "",
    message: "",
    type: "success" as "success" | "confirmation",
  });

  // Get active task details (non-completed)
  const getActiveTaskDetails = (details: TaskDetail[]) => {
    return details.filter((detail: TaskDetail) => !detail.isCompleted);
  };

  // Get completed task details
  const getCompletedTaskDetails = (details: TaskDetail[]) => {
    return details.filter((detail: TaskDetail) => detail.isCompleted);
  };

  // Helper function to get the correct menu name for API calls
  const getMenuNameForAPI = (
    stage: TaskStage,
    taskStatus: string,
    isCompleted: boolean
  ) => {
    console.log("getMenuNameForAPI called with:", {
      stage,
      taskStatus,
      isCompleted,
    });
    return taskService.getTaskMenuName(stage, taskStatus, isCompleted);
  };

  // API call functions
  const fetchStagesData = async () => {
    try {
      const response = await apiService.makeRequest("/api/Stages");
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
      const response = await taskService.getTaskStageDetails(
        taskData.id?.toString() || taskData.taskId.toString()
      );
      if (response.success && response.data) {
        setStageDetailsData(response.data);
        console.log("Task stage details data loaded:", response.data);
      }
    } catch (error) {
      console.error("Error fetching task stage details data:", error);
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

  const fetchAssignedTaskDetails = async () => {
    try {
      if (!selectedVehicle || !taskData.id) {
        console.log(
          "Missing vehicle or task ID for fetching assigned task details"
        );
        return;
      }

      const response = await apiService.getAssignedTaskDetails(
        selectedVehicle.id,
        taskData.id
      );

      if (response.success && response.data && response.data.length > 0) {
        setAssignedTaskDetails(response.data[0]);
        console.log("Assigned task details loaded:", response.data[0]);
      } else {
        console.log(
          "No assigned task details found or API error:",
          response.error
        );
      }
    } catch (error) {
      console.error("Error fetching assigned task details:", error);
    }
  };

  // Initialize task form data for in_progress stage
  const initializeTaskFormData = () => {
    console.log("Initializing task form data...");
    console.log("stageDetailsData:", stageDetailsData);
    console.log("reasonsData length:", reasonsData.length);

    if (stageDetailsData?.task_Head?.task_Detail && reasonsData.length > 0) {
      // Filter out completed details and only include active details
      const activeDetails = getActiveTaskDetails(
        stageDetailsData.task_Head.task_Detail
      );
      console.log("Active task details count:", activeDetails.length);

      const details = activeDetails.map((detail: TaskDetail) => ({
        ...detail,
        actualTime: detail.estimatedTime || "0", // Initialize with estimated time
        remarks: detail.remarks || "",
        priority: detail.priority || "Medium", // Default priority
      }));
      console.log("Setting task form data (active details only):", details);
      setTaskFormData(details);
    } else {
      console.log("Cannot initialize task form data - missing data");
    }
  };

  const loadAllAPIData = async () => {
    try {
      setLoading(true);
      // Only fetch assigned task details, no other APIs
      await fetchAssignedTaskDetails();
    } catch (error) {
      console.error("Error loading API data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadAllAPIData();
  }, []);

  // Initialize task form data when stage details are loaded
  useEffect(() => {
    if (stageDetailsData && reasonsData.length > 0) {
      initializeTaskFormData();
    }
  }, [stageDetailsData, reasonsData]);

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
    Alert.alert("Cancel Task", "Are you sure you want to cancel this task?", [
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
    ]);
  };

  const handleConfirm = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // For in_progress stage, handle API submission
    if (currentStage === "in_progress") {
      if (taskFormData.length === 0) {
        Alert.alert("No Tasks", "No task details available to process.");
        return;
      }

      try {
        setLoading(true);

        // Create task stage payload
        const payload = taskService.createTaskStagePayload(
          taskData,
          stageDetailsData!,
          "in_progress",
          taskFormData,
          remarks,
          selectedVehicle?.id?.toString() || "5"
        );

        console.log("Submitting task stage payload:", payload);

        // Submit to API
        const response = await taskService.submitTaskStage(payload);

        console.log("Task stage API response:", response);

        if (response.success && response.data) {
          showSuccessDialogWithConfig(
            "Task Started!",
            "The task has been successfully started. You can now proceed with the task details.",
            "success"
          );
        } else {
          throw new Error(response.error || "Failed to start task");
        }
      } catch (error) {
        console.error("Error starting task:", error);
        Alert.alert("Error", "Failed to start task. Please try again.", [
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

    // For completed stage (Confirmation), handle API submission
    if (currentStage === "completed") {
      if (taskFormData.length === 0) {
        Alert.alert("No Tasks", "No task details available to complete.");
        return;
      }

      try {
        setLoading(true);

        // Create task completion payload
        const payload = taskService.createTaskStagePayload(
          taskData,
          stageDetailsData!,
          "completed",
          taskFormData,
          remarks,
          selectedVehicle?.id?.toString() || "5"
        );

        console.log("Submitting task completion payload:", payload);

        // Submit to API
        const response = await taskService.submitTaskStage(payload);

        console.log("Task completion API response:", response);

        if (response.success && response.data) {
          showSuccessDialogWithConfig(
            "Task Completed!",
            "The task has been successfully completed. Thank you for your service!",
            "success"
          );
        } else {
          throw new Error(response.error || "Failed to complete task");
        }
      } catch (error) {
        console.error("Error completing task:", error);
        Alert.alert("Error", "Failed to complete task. Please try again.", [
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
    console.log("No specific handling for stage:", currentStage);
  };

  // Handle task form data updates
  const updateTaskFormData = (index: number, field: string, value: any) => {
    const updatedData = [...taskFormData];
    updatedData[index] = { ...updatedData[index], [field]: value };
    setTaskFormData(updatedData);
  };

  // Handle reason selection
  const handleReasonSelection = (itemIndex: number, reasonId: string) => {
    const selectedReason = reasonsData.find(
      (r) => r.id?.toString() === reasonId
    );
    updateTaskFormData(itemIndex, "reasonID", reasonId);
    updateTaskFormData(
      itemIndex,
      "reasonDescription",
      selectedReason?.reasonDescription || ""
    );
  };

  // Handle select all items
  const handleSelectAll = () => {
    setSelectAll(!selectAll);
    const updatedData = taskFormData.map((detail) => ({
      ...detail,
      isSelected: !selectAll,
    }));
    setTaskFormData(updatedData);
  };

  // Handle individual item selection
  const handleItemSelection = (index: number) => {
    const updatedData = [...taskFormData];
    updatedData[index] = {
      ...updatedData[index],
      isSelected: !updatedData[index].isSelected,
    };
    setTaskFormData(updatedData);

    // Update select all state
    const allSelected = updatedData.every((detail) => detail.isSelected);
    setSelectAll(allSelected);
  };

  // Handle expand/collapse
  const handleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Handle card selection
  const handleCardSelect = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsCardSelected(!isCardSelected);
  };

  // Handle card press (expand/collapse)
  const handleCardPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsExpanded(!isExpanded);
  };

  // File upload functions
  const openCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Camera permission is required to take photos."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadedFile(result.assets[0]);
        console.log("Camera image selected:", result.assets[0]);
      }
    } catch (error) {
      console.error("Error opening camera:", error);
      Alert.alert("Error", "Failed to open camera");
    }
  };

  const openImagePicker = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Photo library permission is required to select images."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadedFile(result.assets[0]);
        console.log("Image selected:", result.assets[0]);
      }
    } catch (error) {
      console.error("Error opening image picker:", error);
      Alert.alert("Error", "Failed to open image picker");
    }
  };

  const openFileManager = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadedFile(result.assets[0]);
        console.log("PDF selected:", result.assets[0]);
      }
    } catch (error) {
      console.error("Error opening file manager:", error);
      Alert.alert("Error", "Failed to open file manager");
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

      const response = await fetch(
        "http://194.195.87.226:8090/api/TaskDownload",
        {
          method: "POST",
          headers: {
            "Content-Type": "multipart/form-data",
          },
          body: formData,
        }
      );

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

  // Complete task function
  const completeTask = async () => {
    try {
      setLoading(true);
      console.log("Completing task...");

      // Prepare the completion data
      const completionData = {
        id: assignedTaskDetails?.id?.toString() || "",
        TaskId: assignedTaskDetails?.taskId?.toString() || "",
        Description: assignedTaskDetails?.description || "",
        PostingDate: new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD format
        DueDate: assignedTaskDetails?.dueDate || "",
        Remarks: assignedTaskDetails?.remarks || "",
        CreditMemoNum: assignedTaskDetails?.creditMemoNum || "",
        driverId: assignedTaskDetails?.driverId?.toString() || "",
        FilePath: uploadedFile?.name || uploadedFile?.fileName || "",
        docType: assignedTaskDetails?.docType || "",
        CustomerSign: customerSignature || "",
      };

      console.log("Completion data:", completionData);

      const response = await fetch(
        "http://194.195.87.226:8090/api/AssignedTask",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(completionData),
        }
      );

      console.log("Completion response status:", response.status);
      const responseData = await response.json();
      console.log("Completion response data:", responseData);

      if (response.ok) {
        // Show success dialog
        setSuccessDialogConfig({
          title: "Task Completed Successfully!",
          message: "Your task has been completed and submitted successfully.",
          type: "success",
        });
        setShowSuccessDialog(true);

        // Update the task status
        if (assignedTaskDetails) {
          setAssignedTaskDetails({
            ...assignedTaskDetails,
            iscompleted: true,
            filePath: responseData.filePath,
            customerSign: responseData.customerSign,
          });
        }
      } else {
        throw new Error(responseData.errorMsg || "Task completion failed");
      }
    } catch (error) {
      console.error("Error completing task:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      Alert.alert("Error", `Failed to complete task: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Validate completion requirements
  const validateCompletion = () => {
    if (!uploadedFile) {
      Alert.alert(
        "File Required",
        "Please upload a file before completing the task."
      );
      return false;
    }

    if (!customerSignature) {
      Alert.alert(
        "Signature Required",
        "Please capture customer signature before completing the task."
      );
      return false;
    }

    return true;
  };

  // Handle completion with confirmation
  const handleCompleteTask = () => {
    if (!validateCompletion()) {
      return;
    }

    Alert.alert(
      "Confirm Task Completion",
      "Are you sure you want to complete this task? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Complete Task",
          style: "default",
          onPress: completeTask,
        },
      ]
    );
  };

  // Signature functions
  const clearSignature = () => {
    setSignaturePaths([]);
    setCurrentPath("");
    setCustomerSignature(null);
    console.log("Signature cleared");
  };

  const captureSignature = () => {
    if (signaturePaths.length > 0 || currentPath) {
      // Convert signature paths to base64 or save as needed
      const signatureData = JSON.stringify({
        paths: [...signaturePaths, currentPath].filter(Boolean),
        timestamp: new Date().toISOString(),
      });
      setCustomerSignature(signatureData);
      console.log("Signature captured:", signatureData);
      Alert.alert("Success", "Signature captured successfully!");
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

  // Get filtered items based on search query
  const getFilteredItems = () => {
    if (!searchQuery.trim()) {
      return taskFormData;
    }
    return taskFormData.filter(
      (detail) =>
        detail.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        detail.taskId?.toString().includes(searchQuery.toLowerCase())
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

  // Get stage-specific UI elements
  const getStageInfo = () => {
    switch (currentStage) {
      case "open":
        return {
          title: "Task Details",
          subtitle: "Review task information",
          icon: FileText,
          color: "#3b82f6",
        };
      case "in_progress":
        return {
          title: "Work on Task",
          subtitle: "Complete task details",
          icon: ClipboardList,
          color: "#f59e0b",
        };
      case "completed":
        return {
          title: "Task Completed",
          subtitle: "Task has been completed",
          icon: CheckCircle2,
          color: "#10b981",
        };
      default:
        return {
          title: "Task",
          subtitle: "Task details",
          icon: FileText,
          color: "#6b7280",
        };
    }
  };

  const stageInfo = getStageInfo();
  const StageIcon = stageInfo.icon;
  const filteredItems = getFilteredItems();

  // Show search bar for in_progress and completed stages
  const showSearchBar =
    currentStage === "in_progress" || currentStage === "completed";

  // Show selection controls for in_progress and completed stages
  const showSelectionControls =
    currentStage === "in_progress" || currentStage === "completed";

  return (
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
            {stageInfo.title}
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
        <>
          {/* Complete Button - Top Right */}
          <Animated.View
            entering={FadeInUp.delay(400).duration(600)}
            className="bg-white px-4 py-3 border-b border-gray-100"
          >
            <View className="flex-row justify-end">
              <TouchableOpacity
                onPress={handleCompleteTask}
                disabled={loading}
                style={{
                  width: 50,
                  height: 50,
                  backgroundColor: loading ? "#9ca3af" : "#10b981",
                  borderRadius: 25,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                <Check size={20} color="white" />
              </TouchableOpacity>
            </View>
          </Animated.View>

          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* Task Details Card */}
            <Animated.View
              entering={FadeInUp.delay(600).duration(600)}
              className="flex-1 px-4 pt-4"
            >
              <View className="bg-white rounded-lg p-4 shadow-lg">
                {/* Top Row - Task Number and Action Buttons */}
                <View className="flex-row items-center justify-between mb-4">
                  {/* Task Number */}
                  <View className="flex-1">
                    <Text className="text-2xl font-bold text-gray-900">
                      {assignedTaskDetails?.taskId || "Loading..."}
                    </Text>
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row items-center space-x-2">
                    <Pressable
                      onPress={() => {}}
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

                {/* Task Info - Always visible */}
                <View className="mb-4">
                  <Text className="text-lg font-semibold text-gray-900">
                    {assignedTaskDetails?.taskName || "Loading..."}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <View className="w-4 h-4 border border-blue-500 rounded mr-2" />
                    <Text className="text-sm text-gray-600">
                      {assignedTaskDetails?.driverName || "Loading..."}
                    </Text>
                  </View>
                  <Text className="text-sm font-medium text-gray-600 mt-1">
                    Task ID: {assignedTaskDetails?.taskId || "Loading..."}
                  </Text>
                </View>

                {/* Task Details - Collapsible */}
                {isExpanded && assignedTaskDetails && (
                  <Animated.View
                    entering={FadeInUp.duration(300)}
                    exiting={FadeOutUp.duration(300)}
                    className="space-y-3 mt-4"
                  >
                    <View className="flex-row justify-between items-center">
                      <Text className="text-gray-600 font-medium">
                        Task Name
                      </Text>
                      <Text
                        style={{ color: "#3b82f6" }}
                        className="font-semibold"
                      >
                        {assignedTaskDetails.taskName}
                      </Text>
                    </View>

                    <View className="flex-row justify-between items-center">
                      <Text className="text-gray-600 font-medium">Driver</Text>
                      <Text
                        style={{ color: "#3b82f6" }}
                        className="font-semibold"
                      >
                        {assignedTaskDetails.driverName}
                      </Text>
                    </View>

                    <View className="flex-row justify-between items-center">
                      <Text className="text-gray-600 font-medium">
                        Due Date
                      </Text>
                      <Text
                        style={{ color: "#3b82f6" }}
                        className="font-semibold"
                      >
                        {formatDate(assignedTaskDetails.dueDate)}
                      </Text>
                    </View>

                    <View className="flex-row justify-between items-center">
                      <Text className="text-gray-600 font-medium">
                        Description
                      </Text>
                      <Text
                        style={{ color: "#3b82f6" }}
                        className="font-semibold flex-1 text-right"
                      >
                        {assignedTaskDetails.description}
                      </Text>
                    </View>

                    <View className="flex-row justify-between items-center">
                      <Text className="text-gray-600 font-medium">
                        Posted Date
                      </Text>
                      <Text
                        style={{ color: "#3b82f6" }}
                        className="font-semibold"
                      >
                        {formatDate(assignedTaskDetails.postingDate)}
                      </Text>
                    </View>

                    <View className="flex-row justify-between items-center">
                      <Text className="text-gray-600 font-medium">
                        Document Type
                      </Text>
                      <Text
                        style={{ color: "#3b82f6" }}
                        className="font-semibold"
                      >
                        {assignedTaskDetails.docType}
                      </Text>
                    </View>

                    <View className="flex-row justify-between items-center">
                      <Text className="text-gray-600 font-medium">
                        Credit Memo
                      </Text>
                      <Text
                        style={{ color: "#3b82f6" }}
                        className="font-semibold"
                      >
                        {assignedTaskDetails.creditMemoNum}
                      </Text>
                    </View>

                    <View className="flex-row justify-between items-center">
                      <Text className="text-gray-600 font-medium">
                        Driver ID
                      </Text>
                      <Text
                        style={{ color: "#3b82f6" }}
                        className="font-semibold"
                      >
                        {assignedTaskDetails.driverId}
                      </Text>
                    </View>

                    <View className="flex-row justify-between items-center">
                      <Text className="text-gray-600 font-medium">Status</Text>
                      <Text
                        style={{
                          color: assignedTaskDetails.iscompleted
                            ? "#10b981"
                            : "#f59e0b",
                        }}
                        className="font-semibold"
                      >
                        {assignedTaskDetails.iscompleted
                          ? "Completed"
                          : "Pending"}
                      </Text>
                    </View>

                    <View className="flex-row justify-between items-center">
                      <Text className="text-gray-600 font-medium">Active</Text>
                      <Text
                        style={{
                          color: assignedTaskDetails.isActive
                            ? "#10b981"
                            : "#ef4444",
                        }}
                        className="font-semibold"
                      >
                        {assignedTaskDetails.isActive ? "Yes" : "No"}
                      </Text>
                    </View>

                    <View className="flex-row justify-between items-center">
                      <Text className="text-gray-600 font-medium">
                        Attachment Required
                      </Text>
                      <Text
                        style={{
                          color: assignedTaskDetails.isAttachment
                            ? "#3b82f6"
                            : "#6b7280",
                        }}
                        className="font-semibold"
                      >
                        {assignedTaskDetails.isAttachment ? "Yes" : "No"}
                      </Text>
                    </View>

                    {assignedTaskDetails.remarks && (
                      <View className="flex-row justify-between items-center">
                        <Text className="text-gray-600 font-medium">
                          Remarks
                        </Text>
                        <Text
                          style={{ color: "#3b82f6" }}
                          className="font-semibold flex-1 text-right"
                        >
                          {assignedTaskDetails.remarks}
                        </Text>
                      </View>
                    )}

                    {/* Attachment Sent to SAP Checkbox */}
                    <View className="space-y-3 mt-4">
                      <Pressable
                        onPress={() =>
                          setAttachmentSentToSAP(!attachmentSentToSAP)
                        }
                        className="flex-row items-center space-x-3"
                      >
                        <View
                          className={`w-6 h-6 rounded border-2 items-center justify-center ${
                            attachmentSentToSAP
                              ? "bg-red-500 border-red-500"
                              : "border-gray-300"
                          }`}
                        >
                          {attachmentSentToSAP && (
                            <Check size={16} color="white" />
                          )}
                        </View>
                        <Text className="text-gray-900 font-medium">
                          Attachment sent To SAP
                        </Text>
                      </Pressable>
                    </View>

                    {/* File Upload Section */}
                    <View className="space-y-3 mt-4">
                      <Text className="text-gray-600 font-medium mb-2">
                        File Upload
                      </Text>

                      <View className="flex-row items-center space-x-3">
                        <Pressable
                          onPress={selectFile}
                          className="border border-gray-300 rounded-lg px-4 py-2 bg-white flex-1"
                        >
                          <Text className="text-gray-600 font-medium text-center">
                            {uploadedFile
                              ? uploadedFile.name ||
                                uploadedFile.fileName ||
                                "Selected file"
                              : "SELECT FILE"}
                          </Text>
                        </Pressable>

                        {!uploadedFile && (
                          <Pressable
                            onPress={selectFile}
                            className="w-8 h-8 items-center justify-center"
                          >
                            <View className="w-6 h-6">
                              <View className="w-4 h-4 border-2 border-black rounded-sm items-center justify-center">
                                <View className="w-2 h-1 bg-black" />
                              </View>
                              <View className="w-0 h-0 border-l-2 border-r-2 border-b-4 border-l-transparent border-r-transparent border-b-black absolute top-0 left-1" />
                            </View>
                          </Pressable>
                        )}
                      </View>

                      {uploadedFile && (
                        <View className="flex-row space-x-3 mt-2">
                          <Pressable
                            onPress={clearFile}
                            className="px-4 py-2 bg-red-500 rounded-lg flex-1"
                          >
                            <Text className="text-white font-medium text-center">
                              Clear
                            </Text>
                          </Pressable>
                          <Pressable
                            onPress={() => uploadFile(true)}
                            className="px-4 py-2 bg-green-500 rounded-lg flex-1"
                          >
                            <Text className="text-white font-medium text-center">
                              Upload
                            </Text>
                          </Pressable>
                        </View>
                      )}
                    </View>

                    {/* Customer Signature Section */}
                    <View className="space-y-3 mt-4">
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
                  </Animated.View>
                )}

                {/* Completed Status Message */}
                {assignedTaskDetails?.iscompleted && (
                  <View className="mt-4 py-3 rounded-lg items-center bg-green-50 border border-green-200">
                    <Text className="text-green-700 font-semibold text-base">
                      ✓ Task Completed Successfully
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

            {/* Debug Information */}
            {__DEV__ && (
              <Animated.View
                entering={FadeInUp.delay(1000).duration(600)}
                className="mx-4 mt-4"
              >
                <View className="bg-gray-100 rounded-lg p-4">
                  <Text className="text-xs font-medium text-gray-700 mb-2">
                    Debug Information - AssignedTask API
                  </Text>
                  <Text className="text-xs text-gray-500">
                    API Status: {assignedTaskDetails ? "Loaded" : "Not loaded"}
                  </Text>
                  {assignedTaskDetails && (
                    <>
                      <Text className="text-xs text-gray-500">
                        Task ID: {assignedTaskDetails.id}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        Task Name: {assignedTaskDetails.taskName}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        Description: {assignedTaskDetails.description}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        Driver: {assignedTaskDetails.driverName}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        Due Date: {assignedTaskDetails.dueDate}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        Posted Date: {assignedTaskDetails.postingDate}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        Document Type: {assignedTaskDetails.docType}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        Credit Memo: {assignedTaskDetails.creditMemoNum}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        Is Completed:{" "}
                        {assignedTaskDetails.iscompleted ? "Yes" : "No"}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        Is Active: {assignedTaskDetails.isActive ? "Yes" : "No"}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        Is Attachment:{" "}
                        {assignedTaskDetails.isAttachment ? "Yes" : "No"}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        Is Cancelled:{" "}
                        {assignedTaskDetails.isCancelled ? "Yes" : "No"}
                      </Text>
                    </>
                  )}
                  <Text className="text-xs text-gray-500">
                    File Upload: {uploadedFile ? "Selected" : "Not selected"}
                  </Text>
                  <Text className="text-xs text-gray-500">
                    Signature: {customerSignature ? "Captured" : "Not captured"}
                  </Text>
                  <Text className="text-xs text-gray-500">
                    Attachment to SAP: {attachmentSentToSAP ? "Yes" : "No"}
                  </Text>
                </View>
              </Animated.View>
            )}
          </ScrollView>
        </>
      )}

      {/* Success Dialog */}
      <SuccessDialog
        visible={showSuccessDialog}
        title={successDialogConfig.title}
        message={successDialogConfig.message}
        type={successDialogConfig.type}
        onConfirm={handleSuccessDialogClose}
      />
    </SafeAreaView>
  );
};

export default TaskStageDetailsScreen;
