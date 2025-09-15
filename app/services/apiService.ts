import AsyncStorage from "@react-native-async-storage/async-storage";
import { ServerConfig } from "../utils/storage";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
  retryCount?: number;
}

export interface ApiConfig {
  maxRetries: number;
  retryDelay: number;
  timeout: number;
}

export interface DBConfig {
  id: number;
  dataBaseType: string;
  settingName: string;
  serverIP_ServerNode: string;
  driverName: string;
  dataBaseName: string;
  userName: string;
  password: string;
  isActive: boolean;
  cby: string;
  cdt: string | null;
  mby: string | null;
  mdt: string | null;
  sapUserName: string;
  sapPassword: string;
  licenseServer: string;
  sldServer: string;
  dbServerType: string;
  serverPORT: string;
  parmType: string;
  dbType: string;
  sapHanaServerIP: string;
}

export interface UserDetails {
  userID: number;
  name: string;
  emailID: string;
  mobileNo: string;
  userName: string;
  password: string;
  userRoleID: number;
  roleName: string;
  menuID: number;
  menuName: string;
  menuHeaderName: string;
  path: string;
  canView: boolean;
  canInsert: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  isvehicleNoMandatory: boolean;
  stagesDescription: string | null;
  stagesImages: string | null;
}

export interface Vehicle {
  id: number;
  vehicleNo: string;
  vehicleModel: string;
  driverName: string;
  isActive: boolean;
  whsCode: string;
}

export interface LocationData {
  lat: string;
  lng: string;
}

class ApiService {
  private baseUrl: string = "";
  private accessToken: string = "";
  private tokenType: string = "";
  private isRefreshingToken: boolean = false;
  private refreshPromise: Promise<boolean> | null = null;
  private config: ApiConfig = {
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    timeout: 30000, // 30 seconds
  };

  constructor() {
    this.initializeFromStorage();
  }

  private async initializeFromStorage() {
    try {
      const [token, tokenType, baseUrl] = await AsyncStorage.multiGet([
        "access_token",
        "token_type",
        "base_url",
      ]);

      this.accessToken = token[1] || "";
      this.tokenType = tokenType[1] || "";
      this.baseUrl = baseUrl[1] || "";

      // Log token initialization for debugging
      if (this.accessToken && this.tokenType) {
        console.log("🔑 Token loaded from storage:", {
          tokenType: this.tokenType,
          tokenLength: this.accessToken.length,
          baseUrl: this.baseUrl,
          authHeaderPreview: `Bearer ${this.accessToken.substring(0, 20)}...`,
        });
        // Log full token for debugging
        console.log(`🔑 FULL TOKEN FROM STORAGE: "Bearer ${this.accessToken}"`);
      } else {
        console.log("🔑 No token found in storage:", {
          hasToken: !!this.accessToken,
          hasTokenType: !!this.tokenType,
          hasBaseUrl: !!this.baseUrl,
        });
      }
    } catch (error) {
      console.error("Error initializing API service from storage:", error);
    }
  }

  private async updateTokens() {
    await this.initializeFromStorage();
  }

  private getAuthHeader(): string {
    if (this.accessToken) {
      // Always use "Bearer" (capitalized) regardless of what the server returns
      return `Bearer ${this.accessToken}`;
    }
    return "";
  }

  /**
   * Attempts to refresh the access token using stored credentials
   * @returns Promise<boolean> - true if token refresh was successful
   */
  private async refreshAccessToken(): Promise<boolean> {
    // Prevent multiple simultaneous refresh attempts
    if (this.isRefreshingToken && this.refreshPromise) {
      console.log("🔄 Token refresh already in progress, waiting...");
      return await this.refreshPromise;
    }

    this.isRefreshingToken = true;
    this.refreshPromise = this.performTokenRefresh();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshingToken = false;
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<boolean> {
    try {
      console.log("🔄 Attempting to refresh access token...");

      // Get stored credentials
      const [username, password, serverConfig] = await AsyncStorage.multiGet([
        "u_name",
        "u_pass",
        "active_server_config",
      ]);

      console.log("🔍 DEBUG: Retrieved credentials from storage:");
      console.log("  - Username:", username[1] ? `"${username[1]}"` : "NULL");
      console.log("  - Password:", password[1] ? `"${password[1]}"` : "NULL");
      console.log("  - Server Config:", serverConfig[1] ? "EXISTS" : "NULL");

      if (!username[1] || !password[1] || !serverConfig[1]) {
        console.error(
          "❌ Cannot refresh token: missing credentials or server config"
        );
        console.error("❌ Missing items:", {
          username: !username[1],
          password: !password[1],
          serverConfig: !serverConfig[1],
        });
        return false;
      }

      const server: ServerConfig = JSON.parse(serverConfig[1]);
      console.log("🔍 DEBUG: Parsed server config:", {
        id: server.id,
        baseUrl: server.baseUrl,
        port: server.port,
        protocol: server.protocol,
      });

      const loginResponse = await this.login(server, username[1], password[1]);

      if (loginResponse.success) {
        console.log("✅ Token refresh successful");
        return true;
      } else {
        console.error("❌ Token refresh failed:", loginResponse.error);
        return false;
      }
    } catch (error) {
      console.error("❌ Error during token refresh:", error);
      return false;
    }
  }

  public async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0,
    isTokenRefresh = false
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      // Ensure we have the latest tokens
      await this.updateTokens();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
      };

      // Add authorization header if we have tokens
      const authHeader = this.getAuthHeader();
      if (authHeader) {
        headers["Authorization"] = authHeader;
      }

      // Log request
      console.log(
        `🚀 API Request [${retryCount > 0 ? `Retry ${retryCount}` : "Initial"}${
          isTokenRefresh ? " (Token Refresh)" : ""
        }]:`,
        {
          method: options.method || "GET",
          url,
          headers: {
            ...headers,
            Authorization: headers.Authorization
              ? `Bearer [TOKEN_HIDDEN]`
              : undefined,
          },
          body: options.body ? JSON.parse(options.body as string) : undefined,
        }
      );

      // Log actual Authorization header format for verification
      if (headers.Authorization) {
        console.log(
          `🔐 Authorization Header: "${headers.Authorization.substring(
            0,
            20
          )}..."`
        );
        // Log full token for debugging
        console.log(`🔐 FULL AUTHORIZATION TOKEN: "${headers.Authorization}"`);
      }

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.timeout
      );

      // Log the exact headers being sent to the server
      console.log(`📤 Sending request with headers:`, {
        "Content-Type": headers["Content-Type"],
        Authorization: headers["Authorization"]
          ? `${headers["Authorization"].substring(0, 20)}...`
          : "None",
      });

      const startTime = Date.now();
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });
      const endTime = Date.now();

      clearTimeout(timeoutId);
      const responseData = await response.json().catch(() => null);

      // Log response
      console.log(
        `📥 API Response [${response.status}] (${endTime - startTime}ms):`,
        {
          url,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          data: responseData,
        }
      );

      if (!response.ok) {
        // Handle 401 Unauthorized - Token expired
        if (response.status === 401 && !isTokenRefresh && retryCount === 0) {
          console.log("🔑 Token expired (401), attempting to refresh...");

          const tokenRefreshed = await this.refreshAccessToken();

          if (tokenRefreshed) {
            console.log(
              "🔄 Token refreshed successfully, retrying original request..."
            );
            // Retry the original request with new token
            return this.makeRequest<T>(
              endpoint,
              options,
              retryCount + 1,
              false
            );
          } else {
            console.error("❌ Token refresh failed, user needs to login again");
            return {
              success: false,
              error: "Session expired. Please login again.",
              statusCode: 401,
              retryCount,
            };
          }
        }

        // Check if we should retry
        const shouldRetry = this.shouldRetry(response.status, retryCount);

        if (shouldRetry) {
          console.log(
            `🔄 Retrying request (${retryCount + 1}/${
              this.config.maxRetries
            }): ${endpoint}`
          );
          await this.delay(this.config.retryDelay * (retryCount + 1)); // Exponential backoff
          return this.makeRequest<T>(
            endpoint,
            options,
            retryCount + 1,
            isTokenRefresh
          );
        }

        console.error(`❌ API Error [${response.status}]:`, {
          url,
          error: this.getErrorMessage(response.status, responseData),
          responseData,
        });

        return {
          success: false,
          error: this.getErrorMessage(response.status, responseData),
          statusCode: response.status,
          retryCount,
        };
      }

      return {
        success: true,
        data: responseData,
        statusCode: response.status,
        retryCount,
      };
    } catch (error) {
      // Handle network errors and timeouts
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          // Timeout occurred
          console.error(`⏰ Request timeout: ${url}`);
          if (retryCount < this.config.maxRetries) {
            console.log(
              `🔄 Timeout retry (${retryCount + 1}/${
                this.config.maxRetries
              }): ${endpoint}`
            );
            await this.delay(this.config.retryDelay * (retryCount + 1));
            return this.makeRequest<T>(
              endpoint,
              options,
              retryCount + 1,
              isTokenRefresh
            );
          }
          return {
            success: false,
            error: "Request timeout - please check your connection",
            retryCount,
          };
        }

        // Network error
        console.error(`🌐 Network error: ${url}`, error);
        if (retryCount < this.config.maxRetries) {
          console.log(
            `🔄 Network retry (${retryCount + 1}/${
              this.config.maxRetries
            }): ${endpoint}`
          );
          await this.delay(this.config.retryDelay * (retryCount + 1));
          return this.makeRequest<T>(
            endpoint,
            options,
            retryCount + 1,
            isTokenRefresh
          );
        }
      }

      console.error("API request error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        retryCount,
      };
    }
  }

  private shouldRetry(statusCode: number, retryCount: number): boolean {
    // Don't retry if we've exceeded max retries
    if (retryCount >= this.config.maxRetries) {
      return false;
    }

    // Retry on these status codes (but not 401 - handled separately)
    const retryableStatusCodes = [408, 429, 500, 502, 503, 504]; // Timeout, rate limit, server errors
    return retryableStatusCodes.includes(statusCode);
  }

  private getErrorMessage(statusCode: number, responseData: any): string {
    switch (statusCode) {
      case 400:
        return responseData?.message || "Bad request - please check your input";
      case 401:
        return "Authentication failed - please log in again";
      case 403:
        return "Access denied - insufficient permissions";
      case 404:
        return "Resource not found";
      case 408:
        return "Request timeout - please try again";
      case 429:
        return "Too many requests - please wait and try again";
      case 500:
        return "Server error - please try again later";
      case 502:
      case 503:
      case 504:
        return "Service temporarily unavailable - please try again later";
      default:
        return (
          responseData?.message || `Request failed with status ${statusCode}`
        );
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Login method (already implemented in LoginScreen, but keeping here for completeness)
  async login(
    serverConfig: ServerConfig,
    username: string,
    password: string
  ): Promise<
    ApiResponse<{
      access_token: string;
      token_type: string;
      expires_in: number;
    }>
  > {
    const loginUrl = `${serverConfig.protocol}://${serverConfig.baseUrl}:${serverConfig.port}/Auth`;

    const formData = new URLSearchParams();
    formData.append("grant_type", "password");
    formData.append("username", username);
    formData.append("password", password);

    try {
      const response = await fetch(loginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const responseData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error:
            responseData?.error_description ||
            `HTTP error! status: ${response.status}`,
          statusCode: response.status,
        };
      }

      // Update service with new tokens
      this.accessToken = responseData.access_token;
      this.tokenType = responseData.token_type;
      this.baseUrl = `${serverConfig.protocol}://${serverConfig.baseUrl}:${serverConfig.port}`;

      // Store tokens and base URL in AsyncStorage
      await AsyncStorage.multiSet([
        ["access_token", responseData.access_token],
        ["token_type", responseData.token_type],
        ["expires_in", responseData.expires_in?.toString() || ""],
        ["base_url", this.baseUrl],
        ["logged_time", new Date().toISOString()],
        ["is_logged", "yes"],
        // Store credentials for token refresh
        ["u_name", username],
        ["u_pass", password],
        ["active_server_config", JSON.stringify(serverConfig)],
      ]);

      console.log("💾 DEBUG: Stored credentials for token refresh:");
      console.log("  - Username:", username);
      console.log("  - Password:", password ? "[HIDDEN]" : "NULL");
      console.log("  - Server Config:", JSON.stringify(serverConfig));

      return {
        success: true,
        data: responseData,
        statusCode: response.status,
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Login failed",
      };
    }
  }

  // Fetch DB Configuration Settings
  async getDBConfigurationSettings(): Promise<ApiResponse<DBConfig[]>> {
    return this.makeRequest<DBConfig[]>("/api/DBConfigurationSettings");
  }

  // Fetch User Details
  async getUserDetails(
    username: string,
    password: string
  ): Promise<ApiResponse<UserDetails[]>> {
    const params = new URLSearchParams({
      userName: username,
      password: password,
    });

    const endpoint = `/api/Me?${params.toString()}`;

    console.log("👤 ===== USER DETAILS API REQUEST =====");
    console.log("📍 Full URL:", `${this.baseUrl}${endpoint}`);
    console.log("📋 Request Parameters:", {
      userName: username,
      password: "[HIDDEN FOR SECURITY]",
    });
    console.log(
      "🔐 Authorization Header:",
      this.getAuthHeader().substring(0, 25) + "..."
    );
    console.log("📤 HTTP Method: GET");

    const result = await this.makeRequest<UserDetails[]>(endpoint);

    console.log("👤 ===== USER DETAILS API RESPONSE =====");
    console.log("✅ Request Success:", result.success);
    console.log("📊 HTTP Status Code:", result.statusCode);
    console.log("🔄 Retry Count:", result.retryCount || 0);

    if (result.success && result.data) {
      console.log("📄 COMPLETE JSON RESPONSE:");
      console.log(JSON.stringify(result.data, null, 2));
      console.log("📈 Total User Detail Records:", result.data.length);

      if (result.data.length > 0) {
        const firstRecord = result.data[0];
        console.log("👤 First User Record Summary:");
        console.log("  - User ID:", firstRecord.userID);
        console.log("  - Name:", firstRecord.name);
        console.log("  - Username:", firstRecord.userName);
        console.log("  - Role:", firstRecord.roleName);
        console.log("  - Menu Items Count:", result.data.length);
      }
    } else if (!result.success) {
      console.log("❌ API ERROR DETAILS:");
      console.log("  - Error Message:", result.error);
      console.log("  - Status Code:", result.statusCode);
    }

    console.log("👤 ===== END USER DETAILS API =====");

    return result;
  }

  // Fetch Filter Vehicle List (NEW API)
  async getFilterVehicle(): Promise<ApiResponse<Vehicle[]>> {
    const endpoint = "/api/FilterVehicle";

    console.log("🚗 ===== FILTER VEHICLE API REQUEST =====");
    console.log("📍 Full URL:", `${this.baseUrl}${endpoint}`);
    console.log("📋 Request Method: GET");
    console.log(
      "🔐 Authorization Header:",
      this.getAuthHeader().substring(0, 25) + "..."
    );
    console.log("📤 Content-Type: application/json");

    const result = await this.makeRequest<Vehicle[]>(endpoint);

    console.log("🚗 ===== FILTER VEHICLE API RESPONSE =====");
    console.log("✅ Request Success:", result.success);
    console.log("📊 HTTP Status Code:", result.statusCode);
    console.log("🔄 Retry Count:", result.retryCount || 0);

    if (result.success && result.data) {
      console.log("📄 COMPLETE FILTER VEHICLE JSON RESPONSE:");
      console.log(JSON.stringify(result.data, null, 2));
      console.log("📈 Total Vehicle Records:", result.data.length);

      if (result.data.length > 0) {
        console.log("🚛 Filter Vehicle List Summary:");
        result.data.forEach((vehicle, index) => {
          console.log(
            `  ${index + 1}. ID: ${vehicle.id} | Vehicle: ${
              vehicle.vehicleNo
            } | Driver: ${vehicle.driverName} | Active: ${
              vehicle.isActive
            } | WhsCode: ${vehicle.whsCode}`
          );
        });
      }
    } else if (!result.success) {
      console.log("❌ FILTER VEHICLE API ERROR DETAILS:");
      console.log("  - Error Message:", result.error);
      console.log("  - Status Code:", result.statusCode);
    }

    console.log("🚗 ===== END FILTER VEHICLE API =====");

    return result;
  }

  // Update User Location
  async updateUserLocation(
    locationData: LocationData
  ): Promise<ApiResponse<any>> {
    return this.makeRequest("/api/userlocationMaster", {
      method: "POST",
      body: JSON.stringify(locationData),
    });
  }

  // Get Statistics (called after vehicle selection)
  async getStatistics(
    vehicleId: number,
    userRole: string,
    fromDate?: string
  ): Promise<ApiResponse<any>> {
    const today = fromDate || new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
    const params = new URLSearchParams({
      fdate: today,
      vehicleId: vehicleId.toString(),
      userRole: userRole,
    });

    const endpoint = `/api/Statistics?${params.toString()}`;

    console.log("📊 ===== STATISTICS API REQUEST =====");
    console.log("📍 Full URL:", `${this.baseUrl}${endpoint}`);
    console.log("📋 Request Parameters:", {
      fdate: today,
      vehicleId: vehicleId,
      userRole: userRole,
    });
    console.log(
      "🔐 Authorization Header:",
      this.getAuthHeader().substring(0, 25) + "..."
    );
    console.log("📤 Request Method: GET");

    const result = await this.makeRequest(endpoint);

    console.log("📊 ===== STATISTICS API RESPONSE =====");
    console.log("✅ Request Success:", result.success);
    console.log("📊 HTTP Status Code:", result.statusCode);

    if (result.success && result.data) {
      console.log("📄 COMPLETE STATISTICS JSON RESPONSE:");
      console.log(JSON.stringify(result.data, null, 2));
    } else if (!result.success) {
      console.log("❌ STATISTICS API ERROR DETAILS:");
      console.log("  - Error Message:", result.error);
      console.log("  - Status Code:", result.statusCode);
    }

    console.log("📊 ===== END STATISTICS API =====");

    return result;
  }

  // Set base URL (useful when switching servers)
  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  // Clear tokens (useful for logout)
  clearTokens() {
    this.accessToken = "";
    this.tokenType = "";
  }

  // Get current authorization header for debugging
  getCurrentAuthHeader(): string {
    return this.getAuthHeader();
  }

  // Check if we have valid tokens
  hasValidTokens(): boolean {
    return !!(this.accessToken && this.tokenType);
  }

  // Fetch Assigned Task Details
  async getAssignedTaskDetails(
    vehicleId: number,
    id: number
  ): Promise<ApiResponse<any[]>> {
    const endpoint = `/api/AssignedTask?vehicleId=${vehicleId}&id=${id}`;

    console.log("📋 ===== ASSIGNED TASK DETAILS API REQUEST =====");
    console.log("📍 Full URL:", `${this.baseUrl}${endpoint}`);
    console.log("📋 Request Parameters:", {
      vehicleId: vehicleId,
      id: id,
    });
    console.log(
      "🔐 Authorization Header:",
      this.getAuthHeader().substring(0, 25) + "..."
    );
    console.log("📤 Request Method: GET");

    const result = await this.makeRequest<any[]>(endpoint);

    console.log("📋 ===== ASSIGNED TASK DETAILS API RESPONSE =====");
    console.log("✅ Request Success:", result.success);
    console.log("📊 HTTP Status Code:", result.statusCode);

    if (result.success && result.data) {
      console.log("📄 COMPLETE ASSIGNED TASK DETAILS JSON RESPONSE:");
      console.log(JSON.stringify(result.data, null, 2));
      console.log("📈 Total Task Detail Records:", result.data.length);

      if (result.data.length > 0) {
        const taskDetail = result.data[0];
        console.log("📋 Task Detail Summary:");
        console.log("  - ID:", taskDetail.id);
        console.log("  - Task Name:", taskDetail.taskName);
        console.log("  - Description:", taskDetail.description);
        console.log("  - Due Date:", taskDetail.dueDate);
        console.log("  - Driver Name:", taskDetail.driverName);
        console.log("  - Is Completed:", taskDetail.iscompleted);
      }
    } else if (!result.success) {
      console.log("❌ ASSIGNED TASK DETAILS API ERROR DETAILS:");
      console.log("  - Error Message:", result.error);
      console.log("  - Status Code:", result.statusCode);
    }

    console.log("📋 ===== END ASSIGNED TASK DETAILS API =====");

    return result;
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
