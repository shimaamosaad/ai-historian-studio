import {
  Environment,
  LogLevel,
  Paddle,
} from "@paddle/paddle-node-sdk";

const apiKey = process.env.PADDLE_API_KEY;

if (!apiKey) {
  throw new Error(
    "PADDLE_API_KEY غير موجود داخل ملف .env"
  );
}

const isSandbox =
  process.env.PADDLE_ENV !== "production";

export const paddle = new Paddle(apiKey, {
  environment: isSandbox
    ? Environment.sandbox
    : Environment.production,

  logLevel:
    process.env.NODE_ENV === "development"
      ? LogLevel.verbose
      : LogLevel.error,
});