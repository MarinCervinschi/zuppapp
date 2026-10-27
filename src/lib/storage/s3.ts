import { AwsClient } from "aws4fetch";

// Any S3 API with path-style addresses: Garage on savvy today. Server and scripts only: it
// needs the secret key.

function config() {
	const { S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } =
		process.env;
	if (!S3_ENDPOINT || !S3_BUCKET || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY)
		return null;
	return {
		bucketUrl: `${S3_ENDPOINT.replace(/\/$/, "")}/${S3_BUCKET}`,
		client: new AwsClient({
			accessKeyId: S3_ACCESS_KEY_ID,
			secretAccessKey: S3_SECRET_ACCESS_KEY,
			service: "s3",
			region: S3_REGION ?? "auto",
		}),
	};
}

export function isStorageConfigured() {
	return config() !== null;
}

export async function putObject(key: string, body: ArrayBuffer, contentType: string) {
	const s3 = config();
	if (!s3) throw new Error("S3 storage is not configured");
	const response = await s3.client.fetch(`${s3.bucketUrl}/${key}`, {
		method: "PUT",
		body,
		headers: {
			"Content-Type": contentType,
			"Cache-Control": "public, max-age=31536000, immutable",
		},
	});
	if (!response.ok) throw new Error(`S3 PUT ${key}: ${response.status}`);
}
