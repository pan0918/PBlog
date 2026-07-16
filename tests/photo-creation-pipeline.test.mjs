import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createOptimizedPhoto } from "../lib/photos/create-optimized-photo.ts";

test("photo schemas and repository persist a preview URL", async () => {
  const [schema, initializer, repository, validators] = await Promise.all([
    readFile("lib/schema.sql", "utf8"),
    readFile("scripts/init-db.ts", "utf8"),
    readFile("lib/db/photos.ts", "utf8"),
    readFile("lib/admin/validators.ts", "utf8"),
  ]);

  assert.match(schema, /thumbnail_url TEXT,\s*preview_url TEXT,/s);
  assert.match(initializer, /thumbnail_url TEXT, preview_url TEXT/);
  assert.match(repository, /preview_url: string \| null/);
  assert.match(repository, /image_url, thumbnail_url, preview_url, width/);
  assert.match(repository, /input\.preview_url \|\| null/);
  assert.match(repository, /fields\.push\('preview_url = \?'\)/);
  assert.match(validators, /preview_url: z\.string\(\)\.url\(\)/);
});

test("new photo generation completes before the database insert", async () => {
  const events = [];
  const insertedRecord = { id: "created-photo" };
  const result = await createOptimizedPhoto(
    {
      album_id: "album-1",
      image_url: "https://images.example/original.jpg",
      title: "海边",
      sort_order: 3,
    },
    {
      generate: async (url) => {
        events.push(`generate:${url}`);
        return {
          thumbnailUrl: "https://images.example/thumb.webp",
          previewUrl: "https://images.example/preview.webp",
          width: 4000,
          height: 3000,
        };
      },
      insert: async (input) => {
        events.push("insert");
        assert.deepEqual(input, {
          album_id: "album-1",
          image_url: "https://images.example/original.jpg",
          title: "海边",
          sort_order: 3,
          thumbnail_url: "https://images.example/thumb.webp",
          preview_url: "https://images.example/preview.webp",
          width: 4000,
          height: 3000,
        });
        return insertedRecord;
      },
    },
  );

  assert.equal(result, insertedRecord);
  assert.deepEqual(events, [
    "generate:https://images.example/original.jpg",
    "insert",
  ]);
});

test("a derivative failure never inserts a partial photo", async () => {
  let insertCount = 0;
  await assert.rejects(
    createOptimizedPhoto(
      { album_id: "album-1", image_url: "https://images.example/original.jpg" },
      {
        generate: async () => { throw new Error("原图下载超时"); },
        insert: async () => {
          insertCount += 1;
          return {};
        },
      },
    ),
    /原图下载超时/,
  );
  assert.equal(insertCount, 0);
});

test("album photo POST route uses the optimized creation service", async () => {
  const route = await readFile("app/api/admin/albums/[id]/photos/route.ts", "utf8");
  assert.match(route, /createOptimizedPhoto/);
  assert.match(route, /export const runtime = ['"]nodejs['"]/);
  assert.match(route, /export const maxDuration = 60/);
  assert.doesNotMatch(route, /createPhoto\(/);
});
