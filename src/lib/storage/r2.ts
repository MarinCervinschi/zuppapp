import { AwsClient } from "aws4fetch";

// Cloudflare R2 through its S3 API. Server and scripts only: it needs the secret key.

function config() {
	const { R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } =
		process.env;
	if (!R2_ENDPOINT || !R2_BUCKET || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY)
		return null;
	return {
		bucketUrl: `${R2_ENDPOINT.replace(/\/$/, "")}/${R2_BUCKET}`,
		client: new AwsClient({
			accessKeyId: R2_ACCESS_KEY_ID,
			secretAccessKey: R2_SECRET_ACCESS_KEY,
			service: "s3",
			region: "auto",
		}),
	};
}

export function isR2Configured() {
	return config() !== null;
}

export async function putObject(key: string, body: ArrayBuffer, contentType: string) {
	const r2 = config();
	if (!r2) throw new Error("R2 is not configured");
	const response = await r2.client.fetch(`${r2.bucketUrl}/${key}`, {
		method: "PUT",
		body,
		headers: {
			"Content-Type": contentType,
			"Cache-Control": "public, max-age=31536000, immutable",
		},
	});
	if (!response.ok) throw new Error(`R2 PUT ${key}: ${response.status}`);
}
