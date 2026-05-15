const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(baseUrl) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${baseUrl}/api/skills/publicskills`);
      if (res.ok) return;
    } catch {
      // Server is still starting.
    }
    await delay(150);
  }
  throw new Error("Timed out waiting for backend server");
}

async function request(baseUrl, pathname, options = {}) {
  const headers = { ...(options.headers || {}) };
  let body = options.body;

  if (options.json) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.json);
  }

  if (options.cookie) {
    headers.Cookie = options.cookie;
  }

  const res = await fetch(`${baseUrl}${pathname}`, {
    method: options.method || "GET",
    headers,
    body,
  });

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : await res.text();
  const setCookie = res.headers.get("set-cookie");

  return {
    res,
    data,
    cookie: setCookie ? setCookie.split(";")[0] : undefined,
  };
}

test("core auth, publishing, versioning, and cloning flows", async (t) => {
  const tempRoot = path.join(root, ".tmp-test");
  fs.mkdirSync(tempRoot, { recursive: true });
  const tempDir = fs.mkdtempSync(path.join(tempRoot, "run-"));
  const port = 31_000 + Math.floor(Math.random() * 1_000);
  const baseUrl = `http://localhost:${port}`;

  const server = spawn(process.execPath, ["dist/server.js"], {
    cwd: root,
    env: {
      ...process.env,
      PORT: String(port),
      JWT_SECRET: "test-secret",
      DATABASE_PATH: path.join(tempDir, "database.sqlite"),
    },
    stdio: "pipe",
  });

  t.after(async () => {
    if (!server.killed) {
      server.kill();
      await Promise.race([
        new Promise((resolve) => server.once("exit", resolve)),
        delay(1_000),
      ]);
    }
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  await waitForServer(baseUrl);

  const unauthenticated = await request(baseUrl, "/api/skills/loadskills");
  assert.equal(unauthenticated.res.status, 401);

  const aliceSignup = await request(baseUrl, "/api/auth/signup", {
    method: "POST",
    json: { username: "alice", password: "correct-horse-battery-staple" },
  });
  assert.equal(aliceSignup.res.status, 201);
  assert.ok(aliceSignup.cookie);

  const markdown = `---
name: Review Assistant
description: Reviews code changes.
allowed_tools:
  - github
  - shell
---

Review correctness, maintainability, security, and test coverage.`;

  const upload = await request(baseUrl, "/api/skills/uploadskill", {
    method: "POST",
    cookie: aliceSignup.cookie,
    json: { markdown },
  });
  assert.equal(upload.res.status, 201);
  assert.equal(upload.data.version, 1);
  assert.equal(typeof upload.data.skillId, "number");

  const skillId = upload.data.skillId;

  const privateDirectory = await request(baseUrl, "/api/skills/publicskills");
  assert.equal(privateDirectory.res.status, 200);
  assert.equal(privateDirectory.data.skills.length, 0);

  const publish = await request(baseUrl, "/api/skills/changeprivacy", {
    method: "POST",
    cookie: aliceSignup.cookie,
    json: { skillId, is_public: true },
  });
  assert.equal(publish.res.status, 200);

  const addTag = await request(baseUrl, "/api/skills/addtag", {
    method: "POST",
    cookie: aliceSignup.cookie,
    json: { skillId, tagName: "review" },
  });
  assert.equal(addTag.res.status, 200);

  const publicDirectory = await request(baseUrl, "/api/skills/publicskills");
  assert.equal(publicDirectory.res.status, 200);
  assert.equal(publicDirectory.data.skills.length, 1);
  assert.equal(publicDirectory.data.skills[0].name, "Review Assistant");
  assert.deepEqual(publicDirectory.data.skills[0].tag_list, ["review"]);

  const download = await request(baseUrl, `/api/skills/downloadskill?skillId=${skillId}`);
  assert.equal(download.res.status, 200);
  assert.match(download.data, /Review Assistant/);
  assert.match(download.data, /Review correctness/);

  const updatedMarkdown = markdown.replace("test coverage", "test coverage, and regression risk");
  const pushVersion = await request(baseUrl, "/api/skills/pushversion", {
    method: "POST",
    cookie: aliceSignup.cookie,
    json: { skillId, markdown: updatedMarkdown, message: "Add regression-risk review guidance" },
  });
  assert.equal(pushVersion.res.status, 200);
  assert.equal(pushVersion.data.version, 2);

  const versions = await request(baseUrl, `/api/skills/loadversions?skillId=${skillId}`, {
    cookie: aliceSignup.cookie,
  });
  assert.equal(versions.res.status, 200);
  assert.deepEqual(
    versions.data.versions.map((version) => version.version),
    [2, 1]
  );

  const firstVersion = await request(baseUrl, `/api/skills/showversion?skillId=${skillId}&version=1`, {
    cookie: aliceSignup.cookie,
  });
  assert.equal(firstVersion.res.status, 200);
  assert.match(firstVersion.data.content, /test coverage\./);

  const bobSignup = await request(baseUrl, "/api/auth/signup", {
    method: "POST",
    json: { username: "bob", password: "another-good-password" },
  });
  assert.equal(bobSignup.res.status, 201);
  assert.ok(bobSignup.cookie);

  const clone = await request(baseUrl, "/api/skills/clonepublicskill", {
    method: "POST",
    cookie: bobSignup.cookie,
    json: { skillId },
  });
  assert.equal(clone.res.status, 201);

  const bobSkills = await request(baseUrl, "/api/skills/loadskills", {
    cookie: bobSignup.cookie,
  });
  assert.equal(bobSkills.res.status, 200);
  assert.equal(bobSkills.data.skills.length, 1);
  assert.equal(bobSkills.data.skills[0].cloned_from_username, "alice");
  assert.deepEqual(bobSkills.data.skills[0].tag_list, ["review"]);
});
