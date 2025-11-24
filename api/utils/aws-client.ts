import { EC2Client } from "@aws-sdk/client-ec2";
import { SSMClient } from "@aws-sdk/client-ssm";

export interface AWSConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export function validateAWSConfig(): AWSConfig {
  const {
    AWS_REGION,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
  } = process.env;

  const missing: string[] = [];
  if (!AWS_REGION) missing.push("AWS_REGION");
  if (!AWS_ACCESS_KEY_ID) missing.push("AWS_ACCESS_KEY_ID");
  if (!AWS_SECRET_ACCESS_KEY) missing.push("AWS_SECRET_ACCESS_KEY");

  if (missing.length > 0) {
    throw new Error(`Missing AWS credentials: ${missing.join(", ")}`);
  }

  return {
    region: AWS_REGION!,
    accessKeyId: AWS_ACCESS_KEY_ID!,
    secretAccessKey: AWS_SECRET_ACCESS_KEY!,
  };
}

export function createEC2Client(config: AWSConfig): EC2Client {
  return new EC2Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

export function createSSMClient(config: AWSConfig): SSMClient {
  return new SSMClient({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}
