# 🌩️ **Cloudflare Worker — Firebase Firestore + Redis Edge Cache**

A high-performance Cloudflare Worker that fetches Firestore data, transforms Firestore’s nested document structure into clean JSON, caches results at the edge using Upstash Redis, and serves ultra-low latency API responses globally.

---

## 🚀 Features

* ⚡ **Ultra-fast edge API** using Cloudflare Workers
* 🔥 Fetches data from **Firestore REST API**
* 🧹 Automatically normalizes Firestore’s `mapValue`, `stringValue`, etc. into clean JSON
* 🗄 **Upstash Redis caching** (global & serverless)
* 🌍 **CORS enabled** for frontend use
* 🧩 Supports multiple Firestore collections
* 🔁 Cache refreshes every 10 minutes
* 🤖 Automated deployment via GitHub Actions

---

## 📡 API Endpoints

| Endpoint       | Description          |
| -------------- | -------------------- |
| `/about`       | About document(s)    |
| `/experiences` | Work experience data |
| `/projects`    | Projects list        |
| `/skills`      | Skills list          |

### Example Clean Response

```json
{
  "from": "redis-cache",
  "collection": "about",
  "data": [
    {
      "id": "xyz123",
      "profile": {
        "url": "https://..."
      },
      "description": "..."
    }
  ]
}
```

---

## 🧩 Architecture Overview

```
Frontend → Cloudflare Worker → Redis Cache → Firestore (only on cache miss)
                                     ↓
                               Fast edge response
```

### Flow:

1. Request hits Cloudflare Worker
2. Worker checks Redis cache
3. If not cached → fetch Firestore REST → normalize → store → respond
4. If cached → returns instantly (1–5 ms)

---

## 🧱 Tech Stack

* **Cloudflare Workers** (Edge compute)
* **Upstash Redis** (Global serverless cache)
* **Firestore REST API**
* **JavaScript (ES Modules)**
* **GitHub Actions** (CI/CD)

---

## 📁 Project Structure

```
firebase-redis-worker/
│── src/
│   └── index.js              # Worker logic
│── wrangler.jsonc            # Worker config
│── package.json
│── .github/
│   └── workflows/
│       └── deploy.yml        # Auto-deploy pipeline
```

---

## ⚙️ Development

### Run locally

```
npx wrangler dev
```

### Deploy manually

```
npx wrangler deploy
```

---

## 🤖 GitHub Actions Deployment

Automatic deployment is handled by a workflow that:

* Installs dependencies
* Builds the Worker
* Publishes it to Cloudflare Workers

---

## 🧪 Testing

After deployment, your Worker will be available at:

```
https://<worker-name>.<subdomain>.workers.dev
```

Test endpoints like:

```
/about
/projects
/skills
/experiences
```

---

## 📈 Performance

* Cache hits: **1–5 ms**
* Cache misses: **20–50 ms** (Firestore fetch + normalization)
* Responses fully normalized (no `stringValue`, `mapValue`, etc.)

