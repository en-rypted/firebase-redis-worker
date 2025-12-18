import { Redis } from "@upstash/redis";

function normalizeFirestoreValue(value) {
	if (value == null) return null;

	if ("stringValue" in value) return value.stringValue;
	if ("integerValue" in value) return Number(value.integerValue);
	if ("doubleValue" in value) return Number(value.doubleValue);
	if ("booleanValue" in value) return value.booleanValue;

	if ("mapValue" in value) {
		const result = {};
		const fields = value.mapValue.fields || {};
		for (const key in fields) {
			result[key] = normalizeFirestoreValue(fields[key]);
		}
		return result;
	}

	if ("arrayValue" in value) {
		const arr = value.arrayValue.values || [];
		return arr.map(normalizeFirestoreValue);
	}

	return null;
}

function convertFirestoreDocument(doc) {
	const fields = doc.fields || {};
	const out = { id: doc.name.split("/").pop() };

	for (const key in fields) {
		out[key] = normalizeFirestoreValue(fields[key]);
	}
	return out;
}


export default {
	async fetch(request, env) {
		const redis = new Redis({
			url: env.UPSTASH_REDIS_REST_URL,
			token: env.UPSTASH_REDIS_REST_TOKEN,
		});

		// ---- Get URL path (/about, /projects, etc.) ----
		const url = new URL(request.url);
		const path = url.pathname.replace("/", ""); // remove "/"

		// Allowed collections
		const collections = ["about", "experiences", "projects", "skills"];

		// CORS headers
		const corsHeaders = {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
		};

		// Handle OPTIONS preflight
		if (request.method === "OPTIONS") {
			return new Response(null, { status: 204, headers: corsHeaders });
		}

		if (!collections.includes(path)) {
			return new Response(
				JSON.stringify({ error: "Invalid collection" }),
				{ status: 404 }
			);
		}

		const cacheKey = `firebase-cache-${path}`;

		// ---- 1. Check Redis Cache ----
		const cached = await redis.get(cacheKey);
		if (cached) {
			return new Response(
				JSON.stringify({
					from: "redis-cache",
					collection: path,
					data: cached
				}),
				{ headers: { "Content-Type": "application/json", ...corsHeaders } }
			);
		}

		// ---- 2. Fetch from Firebase ----
		const firebaseURL = `https://firestore.googleapis.com/v1/projects/shiv-portfolio-47ce9/databases/(default)/documents/${path}`;

		const firebaseRes = await fetch(firebaseURL);

		const firebaseRaw = await firebaseRes.json();

		// Convert raw Firestore docs → clean JSON
		const firebaseData = (firebaseRaw.documents || []).map((doc) =>
			convertFirestoreDocument(doc)
		);

		// ---- 3. Cache in Redis for 10 minutes ----
		await redis.set(cacheKey, firebaseData, { ex: 600 });

		return new Response(
			JSON.stringify({
				from: "firebase",
				collection: path,
				data: firebaseData
			}),
			{
				headers: {
					"Content-Type": "application/json",
					...corsHeaders
				}
			}
		);
	},
};
