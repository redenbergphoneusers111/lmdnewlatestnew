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

const STORAGE_KEYS = {
  SERVER_CONFIGS: "server_configs",
  USER_AUTH: "user_auth",
  FIRST_TIME_SETUP: "first_time_setup",
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
      ]);
    } catch (error) {
      console.error("Error clearing all data:", error);
      throw error;
    }
  }
}
