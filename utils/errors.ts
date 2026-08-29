import mongoose from "mongoose";

export const isDatabaseError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const err = error as { name?: string; message?: string };

  return (
    err.name === "MongooseError" ||
    err.name === "MongoServerError" ||
    err.name === "MongoNetworkError" ||
    err.name === "MongoTimeoutError" ||
    Boolean(err.message?.includes("buffering timed out")) ||
    Boolean(err.message?.includes("Server selection timed out"))
  );
};

export const getDatabaseErrorMessage = (): string =>
  "Database is temporarily unavailable. Please try again in a moment.";

export const handleControllerError = (
  error: unknown,
  res: { status: (code: number) => { json: (body: { message: string }) => void } },
  fallbackMessage = "Something went wrong. Please try again."
): void => {
  if (isDatabaseError(error)) {
    res.status(503).json({ message: getDatabaseErrorMessage() });
    return;
  }

  console.error(error);
  res.status(500).json({ message: fallbackMessage });
};
