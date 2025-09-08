import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  StorageManager,
  UserAuth,
  ServerConfig,
  DBConfig,
  UserDetails,
  Vehicle,
  STORAGE_KEYS,
} from "../utils/storage";
import apiService from "../services/apiService";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserAuth | null;
  activeServer: ServerConfig | null;
  dbConfig: DBConfig | null;
  userDetails: UserDetails[];
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshAuthState: () => Promise<void>;
  selectVehicle: (vehicle: Vehicle) => Promise<void>;
  completeAuthentication: () => void;
  refreshData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<UserAuth | null>(null);
  const [activeServer, setActiveServer] = useState<ServerConfig | null>(null);
  const [dbConfig, setDbConfig] = useState<DBConfig | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    refreshAuthState();
  }, []);

  const refreshAuthState = async () => {
    try {
      const userAuth = await StorageManager.getUserAuth();
      const servers = await StorageManager.getServerConfigs();
      const active = servers.find((s) => s.isActive);

      let selectedVehicleData: Vehicle | null = null;

      // Load additional data if user is authenticated
      if (userAuth.isLoggedIn && servers.length > 0) {
        const [dbConf, userDets, vehs, selectedVeh] = await Promise.all([
          StorageManager.getDBConfig(),
          StorageManager.getUserDetails(),
          StorageManager.getVehicles(),
          StorageManager.getSelectedVehicle(),
        ]);

        setDbConfig(dbConf);
        setUserDetails(userDets);
        setVehicles(vehs);
        setSelectedVehicle(selectedVeh);
        selectedVehicleData = selectedVeh;
      }

      setUser(userAuth);
      setActiveServer(active || null);
      // Only set authenticated if user is logged in, has servers, AND has selected a vehicle
      setIsAuthenticated(
        userAuth.isLoggedIn && servers.length > 0 && !!selectedVehicleData
      );
    } catch (error) {
      console.error("Error refreshing auth state:", error);
      setIsAuthenticated(false);
      setUser(null);
      setActiveServer(null);
      setDbConfig(null);
      setUserDetails([]);
      setVehicles([]);
      setSelectedVehicle(null);
    }
  };

  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    try {
      console.log("🔐 Starting login process for user:", username);
      if (!activeServer) {
        throw new Error("No active server configured");
      }

      setIsLoading(true);

      // Perform real login API call
      console.log("📡 Making login API call...");
      const loginResponse = await apiService.login(
        activeServer,
        username,
        password
      );

      if (!loginResponse.success) {
        console.error("❌ Login API failed:", loginResponse.error);
        throw new Error(loginResponse.error || "Login failed");
      }

      console.log("✅ Login API successful, tokens received");

      // Extract user info from login response (assuming it's included)
      const userAuth: UserAuth = {
        isLoggedIn: true,
        userId: Date.now().toString(),
        username: username.trim(),
        currentServerId: activeServer.id,
      };

      await StorageManager.saveUserAuth(userAuth);
      await StorageManager.setFirstTimeSetup(false);

      // Store server config for token refresh
      await AsyncStorage.setItem(
        "active_server_config",
        JSON.stringify(activeServer)
      );

      setUser(userAuth);
      // Don't set isAuthenticated=true here - wait for vehicle selection

      // Fetch post-login data
      console.log("📊 Fetching post-login data...");
      await fetchPostLoginData(username, password);

      console.log("🎉 Login process completed successfully");
      return true;
    } catch (error) {
      console.error("❌ Login error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const processUserDetailsResponse = async (
    userDetailsData: UserDetails[],
    username: string,
    password: string
  ) => {
    try {
      console.log("🔄 Processing User Details Response (like Java code)...");

      // Equivalent to: pref.setUserDefinition(response);
      const responseJson = JSON.stringify(userDetailsData);
      await StorageManager.setUserDefinition(responseJson);

      // Log equivalent to: Log.e("VEH_DET", pref.getUserDefinition());
      const savedUserDefinition = await StorageManager.getUserDefinition();
      console.log("📄 VEH_DET:", savedUserDefinition);

      if (userDetailsData.length > 0) {
        // Equivalent to: JSONObject obj = jsonArray.getJSONObject(0);
        const firstUserObject = userDetailsData[0];

        // Equivalent to: pref.setId(obj.getString("userID"));
        await StorageManager.setId(firstUserObject.userID.toString());

        // Equivalent to: pref.setUser_name(obj.getString("name"));
        await StorageManager.setUser_name(firstUserObject.name);

        // Equivalent to: pref.setWith_space(true);
        await StorageManager.setWith_space(true);

        // Equivalent to: pref.setU_name(username.getEditText().getText().toString().trim());
        await StorageManager.setU_name(username.trim());

        // Equivalent to: pref.setU_pass(password.getEditText().getText().toString().trim());
        await StorageManager.setU_pass(password.trim());

        console.log("✅ User details processed and saved (Java style):", {
          userID: firstUserObject.userID,
          name: firstUserObject.name,
          with_space: true,
          u_name: username.trim(),
          u_pass: "[HIDDEN]",
        });
      }
    } catch (error) {
      console.error("❌ Error processing user details response:", error);
    }
  };

  const fetchPostLoginData = async (username: string, password: string) => {
    try {
      console.log("🔧 Fetching DB Configuration...");
      // Fetch DB Configuration
      const dbConfigResponse = await apiService.getDBConfigurationSettings();
      if (dbConfigResponse.success && dbConfigResponse.data) {
        // Find Service Layer configuration
        const serviceLayerConfig = dbConfigResponse.data.find(
          (config) => config.dataBaseType === "Service Layer"
        );

        if (serviceLayerConfig) {
          console.log("✅ DB Config found:", serviceLayerConfig.settingName);
          setDbConfig(serviceLayerConfig);
          await StorageManager.saveDBConfig(serviceLayerConfig);
        } else {
          console.warn("⚠️ No Service Layer configuration found");
        }
      } else {
        console.error("❌ Failed to fetch DB config:", dbConfigResponse.error);
      }

      console.log("👤 Fetching User Details...");
      // Fetch User Details
      const userDetailsResponse = await apiService.getUserDetails(
        username,
        password
      );
      if (userDetailsResponse.success && userDetailsResponse.data) {
        console.log(
          "✅ User details fetched:",
          userDetailsResponse.data.length,
          "items"
        );
        setUserDetails(userDetailsResponse.data);
        await StorageManager.saveUserDetails(userDetailsResponse.data);

        // Process response like Java code
        await processUserDetailsResponse(
          userDetailsResponse.data,
          username,
          password
        );
      } else {
        console.error(
          "❌ Failed to fetch user details:",
          userDetailsResponse.error
        );
      }

      console.log("🚗 Fetching Filter Vehicles...");
      // Fetch Filter Vehicles (NEW API)
      const vehiclesResponse = await apiService.getFilterVehicle();
      if (vehiclesResponse.success && vehiclesResponse.data) {
        console.log(
          "✅ Filter Vehicles fetched:",
          vehiclesResponse.data.length,
          "vehicles"
        );
        setVehicles(vehiclesResponse.data);
        await StorageManager.saveVehicles(vehiclesResponse.data);
      } else {
        console.error(
          "❌ Failed to fetch filter vehicles:",
          vehiclesResponse.error
        );
      }

      console.log("📊 Post-login data fetch completed");
    } catch (error) {
      console.error("❌ Error fetching post-login data:", error);
      // Don't fail login if post-login data fetch fails
    }
  };

  const selectVehicle = async (vehicle: Vehicle) => {
    console.log("🚗 Vehicle selected:", vehicle.vehicleNo);
    setSelectedVehicle(vehicle);
    await StorageManager.saveSelectedVehicle(vehicle);
  };

  const completeAuthentication = () => {
    console.log("🔓 Completing authentication...");
    if (user && activeServer && selectedVehicle) {
      console.log("✅ Authentication completed, showing main app");
      setIsAuthenticated(true);
    } else {
      console.warn(
        "⚠️ Cannot complete authentication: missing user, server, or vehicle"
      );
    }
  };

  const refreshData = async () => {
    if (user && activeServer) {
      await fetchPostLoginData(user.username || "", ""); // Password not needed for refresh
    }
  };

  const logout = async () => {
    try {
      await StorageManager.logout();
      await AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_VEHICLE);
      setUser(null);
      setIsAuthenticated(false);
      setSelectedVehicle(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    activeServer,
    dbConfig,
    userDetails,
    vehicles,
    selectedVehicle,
    login,
    logout,
    refreshAuthState,
    selectVehicle,
    completeAuthentication,
    refreshData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
