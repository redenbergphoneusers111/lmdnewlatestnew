import apiService, { ApiResponse } from "./apiService";

export type TaskStage = "open" | "in_progress" | "completed";

export interface Task {
  id: number;
  isAttachment: boolean;
  taskName: string;
  taskId: number;
  description: string;
  postingDate: string;
  dueDate: string;
  remarks: string;
  cardCode: string;
  docType: string;
  creditMemoNum: string;
  driverId: number;
  isCancelled: boolean;
  isActive: boolean;
  iscompleted: boolean;
  driverName: string;
  // Add task-specific fields
  priority?: string;
  category?: string;
  assignedTo?: string;
  estimatedDuration?: string;
  actualDuration?: string;
  attachments?: TaskAttachment[];
}

export interface TaskAttachment {
  id: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  uploadedDate: string;
}

export interface TaskStageDetails {
  task_Head: {
    task_Detail: TaskDetail[];
  };
  stage_Def_Detail: {
    stageDefinitionID: number;
    details_ID: number;
  };
}

export interface TaskDetail {
  taskDetailsID: number;
  taskId: number;
  description: string;
  status: string;
  completionDate?: string;
  remarks?: string;
  isCompleted: boolean;
  isSelected?: boolean;
  // Task-specific fields
  priority?: string;
  estimatedTime?: string;
  actualTime?: string;
  attachments?: TaskAttachment[];
}

export interface TaskStagePayload {
  stageDate: string;
  taskID: string;
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
  task_Details: TaskStageDetail[];
}

export interface TaskStageDetail {
  taskDetailsID: number;
  taskId: number;
  description: string;
  status: string;
  completionDate: string;
  remarks: string;
  isCompleted: boolean;
  priority: string;
  estimatedTime: string;
  actualTime: string;
}

class TaskService {
  /**
   * Fetch tasks for a specific vehicle
   */
  async getTasks(
    vehicleId: number,
    status: string = "ALL"
  ): Promise<ApiResponse<Task[]>> {
    let endpoint = `/api/AssignedTask?vehicleId=${vehicleId}&taskId=&status=`;

    // Add status filter if not ALL
    if (status !== "ALL") {
      endpoint += status;
    }

    console.log("📋 ===== TASKS API REQUEST =====");
    console.log("📍 Full URL:", `${apiService["baseUrl"]}${endpoint}`);
    console.log("📋 Request Parameters:", {
      vehicleId: vehicleId,
      status: status,
    });

    const result = await apiService.makeRequest<Task[]>(endpoint);

    console.log("📋 ===== TASKS API RESPONSE =====");
    console.log("✅ Request Success:", result.success);
    console.log("📊 HTTP Status Code:", result.statusCode);
    console.log("📈 Total Tasks:", result.data?.length || 0);

    return result;
  }

  /**
   * Fetch task filter statuses
   */
  async getTaskFilterStatuses(): Promise<ApiResponse<any[]>> {
    // Tasks have predefined statuses
    const statuses = [
      {
        status: "ALL",
        ar_Status: "الجميع",
        definisionType: "Tasks",
        ar_DefinisionType: "مهام",
      },
      {
        status: "PENDING",
        ar_Status: "ريثما",
        definisionType: "Tasks",
        ar_DefinisionType: "مهام",
      },
      {
        status: "Completed",
        ar_Status: "منجز",
        definisionType: "Tasks",
        ar_DefinisionType: "مهام",
      },
    ];

    console.log("📋 ===== TASK FILTER STATUSES =====");
    console.log("📊 Total Status Options:", statuses.length);

    return {
      success: true,
      data: statuses,
    };
  }

  /**
   * Fetch task stage details
   */
  async getTaskStageDetails(
    taskId: string
  ): Promise<ApiResponse<TaskStageDetails>> {
    const params = new URLSearchParams({
      taskID: taskId,
      menuType: "Tasks",
    });

    const endpoint = `/api/StageDetails?${params.toString()}`;

    console.log("📋 ===== TASK STAGE DETAILS API REQUEST =====");
    console.log("📍 Full URL:", `${apiService["baseUrl"]}${endpoint}`);
    console.log("📋 Task ID:", taskId);

    const result = await apiService.makeRequest<TaskStageDetails>(endpoint);

    console.log("📋 ===== TASK STAGE DETAILS API RESPONSE =====");
    console.log("✅ Request Success:", result.success);
    console.log(
      "📊 Task Details Count:",
      result.data?.task_Head?.task_Detail?.length || 0
    );

    return result;
  }

  /**
   * Submit task stage update
   */
  async submitTaskStage(
    payload: TaskStagePayload[]
  ): Promise<ApiResponse<any>> {
    console.log("📋 ===== TASK STAGE SUBMISSION =====");
    console.log("📋 Payload:", JSON.stringify(payload, null, 2));

    const result = await apiService.makeRequest("/api/Stages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log("📋 ===== TASK STAGE SUBMISSION RESPONSE =====");
    console.log("✅ Request Success:", result.success);
    console.log("📊 HTTP Status Code:", result.statusCode);

    return result;
  }

  /**
   * Get task statistics
   */
  async getTaskStatistics(
    vehicleId: number,
    userRole: string,
    fromDate?: string
  ): Promise<ApiResponse<any>> {
    const today = fromDate || new Date().toISOString().split("T")[0];
    const params = new URLSearchParams({
      fdate: today,
      vehicleId: vehicleId.toString(),
      userRole: userRole,
      menuType: "Tasks",
    });

    const endpoint = `/api/Statistics?${params.toString()}`;

    console.log("📋 ===== TASK STATISTICS API REQUEST =====");
    console.log("📍 Full URL:", `${apiService["baseUrl"]}${endpoint}`);

    const result = await apiService.makeRequest(endpoint);

    console.log("📋 ===== TASK STATISTICS API RESPONSE =====");
    console.log("✅ Request Success:", result.success);
    console.log("📊 Statistics Data:", result.data);

    return result;
  }

  /**
   * Map task status to stage
   */
  getTaskStage(status: string, isCompleted: boolean): TaskStage {
    if (isCompleted) {
      return "completed";
    }

    switch (status) {
      case "PENDING":
        return "open";
      case "IN_PROGRESS":
        return "in_progress";
      case "Completed":
        return "completed";
      default:
        return "open";
    }
  }

  /**
   * Get menu name for task API calls
   */
  getTaskMenuName(
    stage: string,
    taskStatus: string,
    isCompleted: boolean
  ): string {
    if (isCompleted) {
      return "Completed";
    }

    switch (stage) {
      case "open":
        return "Open";
      case "in_progress":
        return "In Progress";
      case "completed":
        return "Completed";
      default:
        return "Open";
    }
  }

  /**
   * Create task stage payload
   */
  createTaskStagePayload(
    taskData: Task,
    stageDetails: TaskStageDetails,
    stage: string,
    taskDetails: TaskDetail[],
    remarks: string = "",
    vehicleId: string
  ): TaskStagePayload[] {
    const stageDefinitionID =
      stageDetails?.stage_Def_Detail?.stageDefinitionID?.toString() || "4";
    const stageDefinitionDetailsID =
      stageDetails?.stage_Def_Detail?.details_ID?.toString() || "11";

    return [
      {
        stageDate: new Date().toISOString(),
        taskID: taskData.id?.toString() || taskData.taskId.toString(),
        stageDefinitionID,
        stageDefinitionDetailsID,
        menuName: this.getTaskMenuName(
          stage,
          taskData.status,
          taskData.iscompleted
        ),
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
        expectedAmount: "0",
        signatures: "",
        fileUploadUrl: "",
        physicalSigned: false,
        fileUploadValidation: false,
        isHappy: false,
        isSad: false,
        FeedbackStage_Details: [],
        task_Details: taskDetails
          .filter((detail) => !detail.isCompleted)
          .map((detail) => ({
            taskDetailsID: detail.taskDetailsID,
            taskId: detail.taskId,
            description: detail.description,
            status: "COMPLETED",
            completionDate: new Date().toISOString(),
            remarks: detail.remarks || "",
            isCompleted: true,
            priority: detail.priority || "Medium",
            estimatedTime: detail.estimatedTime || "0",
            actualTime: detail.actualTime || "0",
          })),
      },
    ];
  }
}

// Export singleton instance
export const taskService = new TaskService();
export default taskService;
