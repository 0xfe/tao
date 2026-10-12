import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, readFile, mkdir, cp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
const root = process.cwd();
async function deployment(args = [], options = {}) {
  const dir = await mkdtemp(path.join(tmpdir(), "tao-deploy-test-"));
  try {
    await mkdir(path.join(dir, "bin"));
    await mkdir(path.join(dir, "scripts"));
    await cp(path.join(root, "upload.sh"), path.join(dir, "upload.sh"));
    await cp(
      path.join(root, "scripts/verify-build.mjs"),
      path.join(dir, "scripts/verify-build.mjs"),
    );
    await cp(path.join(root, "dist"), path.join(dir, "dist"), {
      recursive: true,
    });
    const log = path.join(dir, "calls.jsonl");
    const mock = `#!/usr/bin/env node\nconst fs=require('node:fs');const path=require('node:path');const command=path.basename(process.argv[1]);const args=process.argv.slice(2);fs.appendFileSync(process.env.TEST_LOG,JSON.stringify({command,args})+'\\n');if(command==='gcloud'&&args[1]==='cat'){process.stdout.write(process.env.TEST_CHANGED==='1'?'different release':fs.readFileSync('dist/index.html'));}if(process.env.TEST_FAIL===command+':'+(args[1]||''))process.exit(1);\n`;
    for (const name of ["gcloud", "npm", "sleep"])
      await writeFile(path.join(dir, "bin", name), mock, { mode: 0o755 });
    const result = spawnSync("bash", ["upload.sh", ...args], {
      cwd: dir,
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: path.join(dir, "bin") + path.delimiter + process.env.PATH,
        TEST_LOG: log,
        TEST_FAIL: options.fail || "",
        TEST_CHANGED: options.changed ? "1" : "0",
      },
    });
    let calls = [];
    try {
      calls = (await readFile(log, "utf8"))
        .trim()
        .split("\n")
        .filter(Boolean)
        .map(JSON.parse);
    } catch {}
    return { ...result, calls };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
test("production uploads assets before index with scoped destinations and distinct cache policies", async () => {
  const result = await deployment();
  assert.equal(result.status, 0, result.stderr);
  const cloud = result.calls.filter((x) => x.command === "gcloud");
  assert.equal(cloud.length, 2);
  assert.equal(cloud[0].args[1], "rsync");
  assert.ok(cloud[0].args.includes("gs://muthanna.com/tao/"));
  assert.ok(
    cloud[0].args.includes("--cache-control=public,max-age=86400,immutable"),
  );
  assert.ok(
    cloud[0].args.includes(
      "--exclude=^(index\\.html|\\.build-manifest\\.json)$",
    ),
  );
  assert.equal(cloud[1].args[1], "cp");
  assert.ok(cloud[1].args.includes("gs://muthanna.com/tao/index.html"));
  assert.ok(
    cloud[1].args.includes(
      "--cache-control=public,max-age=300,must-revalidate",
    ),
  );
  assert.ok(
    !cloud.some((c) =>
      c.args.includes("--delete-unmatched-destination-objects"),
    ),
  );
});
test("development cleanup waits, checks the remote release, and stays within tao-dev", async () => {
  const result = await deployment(["dev", "--clean"]);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(
    result.calls.some((x) => x.command === "sleep" && x.args[0] === "360"),
  );
  const cloud = result.calls.filter((x) => x.command === "gcloud");
  assert.deepEqual(
    cloud.map((x) => x.args[1]),
    ["rsync", "cp", "cat", "rsync"],
  );
  assert.ok(
    cloud.at(-1).args.includes("--delete-unmatched-destination-objects"),
  );
  assert.ok(
    cloud.every((c) =>
      c.args
        .filter((a) => a.startsWith("gs://"))
        .every((a) => a.startsWith("gs://muthanna.com/tao-dev/")),
    ),
  );
});
test("dry run never invokes gcloud", async () => {
  const result = await deployment(["--dry-run"]);
  assert.equal(result.status, 0);
  assert.ok(!result.calls.some((x) => x.command === "gcloud"));
});
test("failed build stops before any upload", async () => {
  const result = await deployment([], { fail: "npm:build" });
  assert.notEqual(result.status, 0);
  assert.ok(!result.calls.some((x) => x.command === "gcloud"));
});
test("failed asset upload leaves the published index alone", async () => {
  const result = await deployment([], { fail: "gcloud:rsync" });
  assert.notEqual(result.status, 0);
  assert.ok(
    !result.calls.some((x) => x.command === "gcloud" && x.args[1] === "cp"),
  );
});
test("cleanup refuses to prune if the remote release changed", async () => {
  const result = await deployment(["--clean"], { changed: true });
  assert.notEqual(result.status, 0);
  assert.ok(
    !result.calls.some((x) =>
      x.args.includes("--delete-unmatched-destination-objects"),
    ),
  );
});
test("unknown arguments stop before building or uploading", async () => {
  const result = await deployment(["staging"]);
  assert.equal(result.status, 2);
  assert.equal(result.calls.length, 0);
});
