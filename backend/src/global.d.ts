declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV?: string;
    PORT?: string;
    DB_HOST?: string;
    DB_PORT?: string;
    DB_USER?: string;
    DB_PASSWORD?: string;
    DB_NAME?: string;
    JWT_SECRET?: string;
    ADMIN_PASSWORD?: string;
    CORS_ORIGINS?: string;
    STATIC_DIR?: string;
  }
}
