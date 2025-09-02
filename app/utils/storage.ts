import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ServerConfig {
  id: string;
  name: string;
  baseUrl: string;
  port: string;
  protocol: "http" | "https";
  isActive: boolean;
  createdAt: string;
}

export interface UserAuth {
  isLoggedIn: boolean;
  userId?: string;
  username?: string;
  currentServerId?: string;
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

export interface UserSession {
  dbConfig?: DBConfig;
  userDetails?: UserDetails[];
  selectedVehicle?: Vehicle;
  lastLocationUpdate?: string;
}

export const STORAGE_KEYS = {
  SERVER_CONFIGS: "server_configs",
  USER_AUTH: "user_auth",
  FIRST_TIME_SETUP: "first_time_setup",
  DB_CONFIG: "db_config",
  USER_DETAILS: "user_details",
  VEHICLES: "vehicles",
  USER_SESSION: "user_session",
  SELECTED_VEHICLE: "selected_vehicle",
  // Java equivalent storage keys
  USER_DEFINITION: "user_definition",
  USER_ID: "user_id",
  USER_NAME: "user_name",
  WITH_SPACE: "with_space",
  U_NAME: "u_name",
  U_PASS: "u_pass",
};

export class StorageManager {
  // Server Configuration Methods
  static async saveServerConfig(
    config: Omit<ServerConfig, "id" | "createdAt">
  ): Promise<ServerConfig> {
    try {
      const existingConfigs = await this.getServerConfigs();
      const newConfig: ServerConfig = {
        ...config,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };

      const updatedConfigs = [...existingConfigs, newConfig];
      await AsyncStorage.setItem(
        STORAGE_KEYS.SERVER_CONFIGS,
        JSON.stringify(updatedConfigs)
      );

      return newConfig;
    } catch (error) {
      console.error("Error saving server config:", error);
      throw error;
    }
  }

  static async getServerConfigs(): Promise<ServerConfig[]> {
    try {
      const configs = await AsyncStorage.getItem(STORAGE_KEYS.SERVER_CONFIGS);
      return configs ? JSON.parse(configs) : [];
    } catch (error) {
      console.error("Error getting server configs:", error);
      return [];
    }
  }

  static async updateServerConfig(updatedConfig: ServerConfig): Promise<void> {
    try {
      const configs = await this.getServerConfigs();
      const updatedConfigs = configs.map((config) =>
        config.id === updatedConfig.id ? updatedConfig : config
      );
      await AsyncStorage.setItem(
        STORAGE_KEYS.SERVER_CONFIGS,
        JSON.stringify(updatedConfigs)
      );
    } catch (error) {
      console.error("Error updating server config:", error);
      throw error;
    }
  }

  static async deleteServerConfig(configId: string): Promise<void> {
    try {
      const configs = await this.getServerConfigs();
      const updatedConfigs = configs.filter((config) => config.id !== configId);
      await AsyncStorage.setItem(
        STORAGE_KEYS.SERVER_CONFIGS,
        JSON.stringify(updatedConfigs)
      );
    } catch (error) {
      console.error("Error deleting server config:", error);
      throw error;
    }
  }

  static async setActiveServer(serverId: string): Promise<void> {
    try {
      const configs = await this.getServerConfigs();
      // Set all servers as inactive first
      const updatedConfigs = configs.map((config) => ({
        ...config,
        isActive: false,
      }));

      // Then set the specified server as active
      const finalConfigs = updatedConfigs.map((config) => ({
        ...config,
        isActive: config.id === serverId,
      }));

      await AsyncStorage.setItem(
        STORAGE_KEYS.SERVER_CONFIGS,
        JSON.stringify(finalConfigs)
      );
    } catch (error) {
      console.error("Error setting active server:", error);
      throw error;
    }
  }

  static async getActiveServer(): Promise<ServerConfig | null> {
    try {
      const configs = await this.getServerConfigs();
      return configs.find((config) => config.isActive) || null;
    } catch (error) {
      console.error("Error getting active server:", error);
      return null;
    }
  }

  // User Authentication Methods
  static async saveUserAuth(auth: UserAuth): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_AUTH, JSON.stringify(auth));
    } catch (error) {
      console.error("Error saving user auth:", error);
      throw error;
    }
  }

  static async getUserAuth(): Promise<UserAuth> {
    try {
      const auth = await AsyncStorage.getItem(STORAGE_KEYS.USER_AUTH);
      return auth ? JSON.parse(auth) : { isLoggedIn: false };
    } catch (error) {
      console.error("Error getting user auth:", error);
      return { isLoggedIn: false };
    }
  }

  static async logout(): Promise<void> {
    try {
      const auth = await this.getUserAuth();
      await this.saveUserAuth({ ...auth, isLoggedIn: false });
      await AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_VEHICLE);
    } catch (error) {
      console.error("Error during logout:", error);
      throw error;
    }
  }

  // First Time Setup
  static async setFirstTimeSetup(completed: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.FIRST_TIME_SETUP,
        JSON.stringify(completed)
      );
    } catch (error) {
      console.error("Error setting first time setup:", error);
      throw error;
    }
  }

  static async isFirstTimeSetup(): Promise<boolean> {
    try {
      const setup = await AsyncStorage.getItem(STORAGE_KEYS.FIRST_TIME_SETUP);
      return setup ? JSON.parse(setup) : true;
    } catch (error) {
      console.error("Error checking first time setup:", error);
      return true;
    }
  }

  // Clear all data (for testing/reset)
  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.SERVER_CONFIGS,
        STORAGE_KEYS.USER_AUTH,
        STORAGE_KEYS.FIRST_TIME_SETUP,
        STORAGE_KEYS.DB_CONFIG,
        STORAGE_KEYS.USER_DETAILS,
        STORAGE_KEYS.VEHICLES,
        STORAGE_KEYS.USER_SESSION,
        STORAGE_KEYS.SELECTED_VEHICLE,
        STORAGE_KEYS.USER_DEFINITION,
        STORAGE_KEYS.USER_ID,
        STORAGE_KEYS.USER_NAME,
        STORAGE_KEYS.WITH_SPACE,
        STORAGE_KEYS.U_NAME,
        STORAGE_KEYS.U_PASS,
      ]);
    } catch (error) {
      console.error("Error clearing all data:", error);
      throw error;
    }
  }

  // DB Configuration Methods
  static async saveDBConfig(dbConfig: DBConfig): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DB_CONFIG, JSON.stringify(dbConfig));
    } catch (error) {
      console.error("Error saving DB config:", error);
      throw error;
    }
  }

  static async getDBConfig(): Promise<DBConfig | null> {
    try {
      const config = await AsyncStorage.getItem(STORAGE_KEYS.DB_CONFIG);
      return config ? JSON.parse(config) : null;
    } catch (error) {
      console.error("Error getting DB config:", error);
      return null;
    }
  }

  // User Details Methods
  static async saveUserDetails(userDetails: UserDetails[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DETAILS, JSON.stringify(userDetails));
    } catch (error) {
      console.error("Error saving user details:", error);
      throw error;
    }
  }

  static async getUserDetails(): Promise<UserDetails[]> {
    try {
      const details = await AsyncStorage.getItem(STORAGE_KEYS.USER_DETAILS);
      return details ? JSON.parse(details) : [];
    } catch (error) {
      console.error("Error getting user details:", error);
      return [];
    }
  }

  // Vehicles Methods
  static async saveVehicles(vehicles: Vehicle[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));
    } catch (error) {
      console.error("Error saving vehicles:", error);
      throw error;
    }
  }

  static async getVehicles(): Promise<Vehicle[]> {
    try {
      const vehicles = await AsyncStorage.getItem(STORAGE_KEYS.VEHICLES);
      return vehicles ? JSON.parse(vehicles) : [];
    } catch (error) {
      console.error("Error getting vehicles:", error);
      return [];
    }
  }

  // Selected Vehicle Methods
  static async saveSelectedVehicle(vehicle: Vehicle): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_VEHICLE, JSON.stringify(vehicle));
    } catch (error) {
      console.error("Error saving selected vehicle:", error);
      throw error;
    }
  }

  static async getSelectedVehicle(): Promise<Vehicle | null> {
    try {
      const vehicle = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_VEHICLE);
      return vehicle ? JSON.parse(vehicle) : null;
    } catch (error) {
      console.error("Error getting selected vehicle:", error);
      return null;
    }
  }

  // User Session Methods
  static async saveUserSession(session: UserSession): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(session));
    } catch (error) {
      console.error("Error saving user session:", error);
      throw error;
    }
  }

  static async getUserSession(): Promise<UserSession | null> {
    try {
      const session = await AsyncStorage.getItem(STORAGE_KEYS.USER_SESSION);
      return session ? JSON.parse(session) : null;
    } catch (error) {
      console.error("Error getting user session:", error);
      return null;
    }
  }

  static async updateLastLocationUpdate(timestamp: string): Promise<void> {
    try {
      const session = await this.getUserSession() || {};
      session.lastLocationUpdate = timestamp;
      await this.saveUserSession(session);
    } catch (error) {
      console.error("Error updating last location update:", error);
      throw error;
    }
  }

  // Java equivalent storage methods
  static async setUserDefinition(userDefinitionJson: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DEFINITION, userDefinitionJson);
      console.log('📄 User definition saved to storage');
    } catch (error) {
      console.error("Error saving user definition:", error);
      throw error;
    }
  }

  static async getUserDefinition(): Promise<string> {
    try {
      const userDefinition = await AsyncStorage.getItem(STORAGE_KEYS.USER_DEFINITION);
      console.log('📄 VEH_DET:', userDefinition);
      return userDefinition || '';
    } catch (error) {
      console.error("Error getting user definition:", error);
      return '';
    }
  }

  static async setId(userId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, userId);
      console.log('🆔 User ID saved:', userId);
    } catch (error) {
      console.error("Error saving user ID:", error);
      throw error;
    }
  }

  static async getId(): Promise<string> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.USER_ID) || '';
    } catch (error) {
      console.error("Error getting user ID:", error);
      return '';
    }
  }

  static async setUser_name(userName: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_NAME, userName);
      console.log('👤 User name saved:', userName);
    } catch (error) {
      console.error("Error saving user name:", error);
      throw error;
    }
  }

  static async getUser_name(): Promise<string> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.USER_NAME) || '';
    } catch (error) {
      console.error("Error getting user name:", error);
      return '';
    }
  }

  static async setWith_space(withSpace: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.WITH_SPACE, withSpace.toString());
      console.log('🔲 With space saved:', withSpace);
    } catch (error) {
      console.error("Error saving with space:", error);
      throw error;
    }
  }

  static async getWith_space(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.WITH_SPACE);
      return value === 'true';
    } catch (error) {
      console.error("Error getting with space:", error);
      return false;
    }
  }

  static async setU_name(uName: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.U_NAME, uName);
      console.log('📝 U_name saved:', uName);
    } catch (error) {
      console.error("Error saving u_name:", error);
      throw error;
    }
  }

  static async getU_name(): Promise<string> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.U_NAME) || '';
    } catch (error) {
      console.error("Error getting u_name:", error);
      return '';
    }
  }

  static async setU_pass(uPass: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.U_PASS, uPass);
      console.log('🔒 U_pass saved');
    } catch (error) {
      console.error("Error saving u_pass:", error);
      throw error;
    }
  }

  static async getU_pass(): Promise<string> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.U_PASS) || '';
    } catch (error) {
      console.error("Error getting u_pass:", error);
      return '';
    }
  }
}
