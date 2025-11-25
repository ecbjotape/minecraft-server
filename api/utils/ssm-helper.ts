import {
  GetCommandInvocationCommand,
  GetCommandInvocationCommandOutput,
  SSMClient,
} from "@aws-sdk/client-ssm";

export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  retryDelay: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 5,
  initialDelay: 5000,
  retryDelay: 2000,
};

/**
 * Wait for SSM command to complete with retry logic
 * Edge cases handled:
 * - Command never completes (timeout after max attempts)
 * - Command fails
 * - Network errors during polling
 * - Invalid command ID
 */
export async function waitForSSMCommand(
  ssmClient: SSMClient,
  commandId: string,
  instanceId: string,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<GetCommandInvocationCommandOutput | null> {
  // Initial delay to let command start
  await sleep(config.initialDelay);

  let attempts = 0;
  let result: GetCommandInvocationCommandOutput | null = null;

  while (attempts < config.maxAttempts) {
    try {
      const resultCommand = new GetCommandInvocationCommand({
        CommandId: commandId,
        InstanceId: instanceId,
      });

      result = await ssmClient.send(resultCommand);

      console.log(
        `Attempt ${attempts + 1}/${config.maxAttempts} - Status: ${
          result.Status
        }`
      );

      // Command completed (successfully or with failure)
      if (result.Status === "Success" || result.Status === "Failed") {
        break;
      }

      // Command still running, wait and retry
      if (result.Status === "InProgress" || result.Status === "Pending") {
        await sleep(config.retryDelay);
        attempts++;
      } else {
        // Unexpected status, break
        console.log(`Unexpected SSM status: ${result.Status}`);
        break;
      }
    } catch (err: any) {
      console.log(`Attempt ${attempts + 1} failed: ${err.message}`);
      attempts++;

      // Don't wait on last attempt
      if (attempts < config.maxAttempts) {
        await sleep(config.retryDelay);
      }
    }
  }

  if (!result || (result.Status !== "Success" && result.Status !== "Failed")) {
    console.log("SSM command did not complete in time");
    return null;
  }

  return result;
}

/**
 * Sleep utility with promise
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract command output safely - overloaded function
 */
export function extractCommandOutput(
  result: GetCommandInvocationCommandOutput
): { output: string; error: string };
export function extractCommandOutput(
  ssmClient: SSMClient,
  commandId: string,
  instanceId: string
): Promise<string>;
export function extractCommandOutput(
  resultOrClient: GetCommandInvocationCommandOutput | SSMClient,
  commandId?: string,
  instanceId?: string
): { output: string; error: string } | Promise<string> {
  // If called with GetCommandInvocationCommandOutput
  if ("StandardOutputContent" in resultOrClient) {
    const output = resultOrClient.StandardOutputContent || "";
    const error = resultOrClient.StandardErrorContent || "";

    if (output.trim().length === 0 && error.trim().length > 0) {
      console.log("SSM command produced only errors:", error);
    }

    return { output, error };
  }

  // If called with SSMClient, commandId, instanceId
  return extractCommandOutputAsync(
    resultOrClient as SSMClient,
    commandId!,
    instanceId!
  );
}

/**
 * Async version to extract command output
 */
async function extractCommandOutputAsync(
  ssmClient: SSMClient,
  commandId: string,
  instanceId: string
): Promise<string> {
  try {
    const command = new GetCommandInvocationCommand({
      CommandId: commandId,
      InstanceId: instanceId,
    });

    const result = await ssmClient.send(command);
    return result.StandardOutputContent || "";
  } catch (error) {
    console.error("Error extracting command output:", error);
    throw error;
  }
}
