import { NextRequest, NextResponse } from "next/server";

/**
 * API Route: /api/upload-file
 *
 * Bu route dosya yüklemesi için kullanılır ve aşağıdaki işlemleri yapar:
 * 1. Multipart form data ile gelen dosyayı işler
 * 2. Dosya validasyonu yapar (format, boyut)
 * 3. N8N webhook'una veri gönderir
 * 4. Response formatını standardize eder
 */

// Allowed file types
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Environment validation
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

if (!N8N_WEBHOOK_URL) {
  console.error("❌ N8N_WEBHOOK_URL environment variable is not set!");
}

interface UploadResponse {
  success: boolean;
  message: string;
  data?: {
    fileName: string;
    fileSize: number;
    fileType: string;
    uploadId: string;
    timestamp: string;
  };
  error?: {
    code: string;
    details: string;
  };
}

// Helper function to add CORS headers
function addCorsHeaders<T>(response: NextResponse<T>): NextResponse<T> {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  response.headers.set("Access-Control-Max-Age", "3600");
  return response;
}

// Helper function to validate N8N webhook response
function validateWebhookResponse(response: unknown): boolean {
  try {
    if (!response || typeof response !== "object" || response === null) {
      return false;
    }

    const responseObj = response as Record<string, unknown>;
    return (
      responseObj.upload === "success" ||
      responseObj.status === "success" ||
      responseObj.success === true
    );
  } catch {
    return false;
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<UploadResponse>> {
  try {
    // Environment validation
    if (!N8N_WEBHOOK_URL) {
      const errorResponse = NextResponse.json(
        {
          success: false,
          message: "Server configuration error: N8N webhook URL not configured",
          error: {
            code: "CONFIGURATION_ERROR",
            details: "N8N_WEBHOOK_URL environment variable is missing",
          },
        },
        { status: 500 }
      );
      return addCorsHeaders(errorResponse);
    }

    // Get content type for validation
    const contentType = request.headers.get("content-type") || "";

    if (!contentType.includes("multipart/form-data")) {
      const errorResponse = NextResponse.json(
        {
          success: false,
          message: "Invalid content type. Expected multipart/form-data",
          error: {
            code: "INVALID_CONTENT_TYPE",
            details: `Received: ${contentType}`,
          },
        },
        { status: 400 }
      );
      return addCorsHeaders(errorResponse);
    }

    // Parse form data
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error) {
      const errorResponse = NextResponse.json(
        {
          success: false,
          message: "Failed to parse form data",
          error: {
            code: "FORM_PARSE_ERROR",
            details:
              error instanceof Error ? error.message : "Unknown parsing error",
          },
        },
        { status: 400 }
      );
      return addCorsHeaders(errorResponse);
    }

    // Get file from form data
    const file = formData.get("file") as File;

    if (!file) {
      const errorResponse = NextResponse.json(
        {
          success: false,
          message: "No file provided in form data",
          error: {
            code: "NO_FILE_PROVIDED",
            details: "File field is missing or empty",
          },
        },
        { status: 400 }
      );
      return addCorsHeaders(errorResponse);
    }

    // File validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      const errorResponse = NextResponse.json(
        {
          success: false,
          message:
            "Invalid file type. Only JPG, JPEG, and PNG files are allowed",
          error: {
            code: "INVALID_FILE_TYPE",
            details: `Received: ${file.type}, Allowed: ${ALLOWED_TYPES.join(
              ", "
            )}`,
          },
        },
        { status: 400 }
      );
      return addCorsHeaders(errorResponse);
    }

    if (file.size > MAX_FILE_SIZE) {
      const errorResponse = NextResponse.json(
        {
          success: false,
          message: "File size exceeds limit. Maximum size is 10MB",
          error: {
            code: "FILE_TOO_LARGE",
            details: `File size: ${(file.size / 1024 / 1024).toFixed(
              2
            )}MB, Limit: 10MB`,
          },
        },
        { status: 400 }
      );
      return addCorsHeaders(errorResponse);
    }

    // Generate upload metadata
    const uploadId = `upload_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    // Prepare data for N8N webhook
    const webhookFormData = new FormData();
    webhookFormData.append("file", file);
    webhookFormData.append("uploadId", uploadId);
    webhookFormData.append("timestamp", timestamp);
    webhookFormData.append("originalFileName", file.name);
    webhookFormData.append("fileSize", file.size.toString());
    webhookFormData.append("fileType", file.type);

    // Send to N8N webhook with timeout and enhanced error handling
    try {
      console.log("📡 Sending file to N8N webhook...");

      // Create AbortController for 5 minute timeout
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => {
        abortController.abort();
      }, 300000); // 5 minutes (300 seconds)

      const webhookResponse = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        body: webhookFormData,
        signal: abortController.signal,
        // Don't set Content-Type header manually - let fetch handle it for FormData
      });

      // Clear timeout if request completes
      clearTimeout(timeoutId);

      if (!webhookResponse.ok) {
        const errorBody = await webhookResponse
          .text()
          .catch(() => "Unknown error");
        console.error("❌ N8N webhook failed:", {
          status: webhookResponse.status,
          statusText: webhookResponse.statusText,
          url: N8N_WEBHOOK_URL,
          errorBody: errorBody.substring(0, 500), // Limit error body size
        });

        const errorResponse = NextResponse.json(
          {
            success: false,
            message: "Failed to process file with N8N webhook",
            error: {
              code: "WEBHOOK_ERROR",
              details: `N8N webhook returned ${webhookResponse.status}: ${webhookResponse.statusText}`,
            },
          },
          { status: 502 }
        );
        return addCorsHeaders(errorResponse);
      }

      let webhookResult;
      try {
        webhookResult = await webhookResponse.json();
        console.log("✅ N8N webhook response:", webhookResult);

        // Validate N8N response format
        if (!validateWebhookResponse(webhookResult)) {
          console.warn(
            "⚠️ N8N webhook response format is unexpected:",
            webhookResult
          );
          const errorResponse = NextResponse.json(
            {
              success: false,
              message: "N8N webhook returned invalid response format",
              error: {
                code: "WEBHOOK_INVALID_RESPONSE",
                details:
                  "Expected success status but received: " +
                  JSON.stringify(webhookResult).substring(0, 200),
              },
            },
            { status: 502 }
          );
          return addCorsHeaders(errorResponse);
        }
      } catch {
        console.warn(
          "⚠️ N8N webhook returned non-JSON response, treating as success"
        );
        webhookResult = {
          upload: "success",
          message: "File processed successfully",
        };
      }
    } catch (webhookError) {
      console.error("❌ N8N webhook request failed:", {
        error: webhookError,
        url: N8N_WEBHOOK_URL,
        timestamp: new Date().toISOString(),
      });

      // Check if it's a timeout error
      if (webhookError instanceof Error && webhookError.name === "AbortError") {
        const errorResponse = NextResponse.json(
          {
            success: false,
            message: "Request timeout: N8N webhook took too long to respond",
            error: {
              code: "WEBHOOK_TIMEOUT",
              details:
                "The webhook request exceeded the 5-minute timeout limit",
            },
          },
          { status: 408 }
        );
        return addCorsHeaders(errorResponse);
      }

      // Check if it's a network error
      if (
        webhookError instanceof Error &&
        (webhookError.message.includes("fetch") ||
          webhookError.message.includes("network") ||
          webhookError.message.includes("ECONNREFUSED") ||
          webhookError.message.includes("ENOTFOUND"))
      ) {
        const errorResponse = NextResponse.json(
          {
            success: false,
            message: "Network error: Unable to connect to N8N webhook",
            error: {
              code: "WEBHOOK_NETWORK_ERROR",
              details: webhookError.message,
            },
          },
          { status: 503 }
        );
        return addCorsHeaders(errorResponse);
      }

      // Generic webhook error
      const errorResponse = NextResponse.json(
        {
          success: false,
          message: "Failed to connect to N8N webhook",
          error: {
            code: "WEBHOOK_CONNECTION_ERROR",
            details:
              webhookError instanceof Error
                ? webhookError.message
                : "Unknown webhook error",
          },
        },
        { status: 502 }
      );
      return addCorsHeaders(errorResponse);
    }

    // Success response
    const responseData = {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadId,
      timestamp,
    };

    console.log("✅ File upload processed successfully:", {
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      fileType: file.type,
      uploadId,
    });

    const successResponse = NextResponse.json(
      {
        success: true,
        message: "File uploaded and processed successfully via N8N webhook",
        data: responseData,
      },
      { status: 200 }
    );
    return addCorsHeaders(successResponse);
  } catch (error) {
    console.error("❌ Upload API Error:", error);

    const errorResponse = NextResponse.json(
      {
        success: false,
        message: "Internal server error during file upload",
        error: {
          code: "INTERNAL_SERVER_ERROR",
          details:
            error instanceof Error ? error.message : "Unknown error occurred",
        },
      },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse);
  }
}

// Handle preflight CORS requests
export async function OPTIONS(): Promise<NextResponse> {
  const response = NextResponse.json({}, { status: 200 });
  return addCorsHeaders(response);
}

// Handle other HTTP methods
export async function GET(): Promise<NextResponse> {
  const errorResponse = NextResponse.json(
    {
      success: false,
      message: "Method not allowed. Use POST to upload files",
      error: {
        code: "METHOD_NOT_ALLOWED",
        details: "This endpoint only accepts POST requests",
      },
    },
    { status: 405 }
  );
  return addCorsHeaders(errorResponse);
}
