# Entry Publishing Revalidation Guide for Next.js

This guide explains how to implement automatic page revalidation in Next.js when Uniform entries are published.

## Table of Contents

- [The Problem](#the-problem)
- [Why a Custom Solution is Needed](#why-a-custom-solution-is-needed)
- [Dependencies](#dependencies)
- [Environment Variables](#environment-variables)
- [Configuration](#configuration)
  - [MAX_RECURSION_DEPTH](#max_recursion_depth)
  - [MAX_TOTAL_API_CALLS](#max_total_api_calls)
- [Code Walkthrough](#code-walkthrough)
- [Customisation Guide](#customisation-guide)
- [Webhook Setup in Uniform](#webhook-setup-in-uniform)

---

## The Problem

When using Next.js with Incremental Static Regeneration (ISR) or static site generation, pages are cached for performance. When content is updated in Uniform CMS, these cached pages need to be invalidated so visitors see the latest content.

The challenge is that **entries (content items) are not directly tied to pages**. An entry might be:

- Used directly in a composition (page)
- Referenced by another entry, which is then used in a composition
- Part of a component pattern that's used across multiple compositions
- Nested several levels deep in your content structure

When you publish an entry, you need to find and revalidate **all pages** that display that entry's content, regardless of how deeply nested the reference is.

## Why a Custom Solution is Needed

Uniform's built-in page revalidation does not include handling of entry published events and the pages potentially referenced by that entry. This is because there are many ways in which entry content might be represented in a page making it impossible to implement an exhaustive solution without knowledge of the underlying business logic.

This solution provides a starting-point for the application to implement an entry revalidation strategy. It includes a recursive traversal algorithm to find all affected pages, handling circular references, component patterns, entry patterns, and API rate limits.

Consider the following entry relationship:

```
Author Entry
    ↓ (API call 1: find what uses Author)
Blog Post Entry
    ↓ (API call 2: find what uses Blog Post)
Blog Page Composition → /blog/my-post (revalidate this path)
```

This recursive traversal must also handle:

- **Circular references**: Entry A references Entry B, which references Entry A
- **Component patterns**: Reusable components that appear on multiple pages
- **Entry patterns**: Reusable entry structures
- **API rate limits**: Avoiding excessive API calls

## Dependencies

Add the following packages to your project:

```bash
npm install svix @uniformdev/canvas @uniformdev/project-map
# or
pnpm add svix @uniformdev/canvas @uniformdev/project-map
```

| Package                   | Purpose                                                             |
|---------------------------|---------------------------------------------------------------------|
| `svix`                    | Webhook signature verification (Uniform uses Svix for webhooks)     |
| `@uniformdev/canvas`      | Provides `RelationshipClient` to query entity relationships         |
| `@uniformdev/project-map` | Provides `ProjectMapClient` to resolve composition IDs to URL paths |

## Environment Variables

Configure the following environment variables:

```env
# Required: Your Uniform API key
UNIFORM_API_KEY=your-api-key

# Required: Uniform API host
# Use "https://uniform.app" for US region
# Use "https://eu.uniform.app" for EU region
UNIFORM_API_HOST=https://uniform.app

# Recommended: Webhook secret for signature verification
# Get this from your Uniform webhook configuration
UNIFORM_WEBHOOK_SECRET=your-webhook-secret
```

> **Security Note**: If `UNIFORM_WEBHOOK_SECRET` is not set, the webhook will skip signature verification. This is acceptable for local development but **not recommended for production**.

## Step by Step Implementation

1. Install the required dependencies
2. Save the code to `app/api/revalidate-entry/route.ts` in your Next.js project.
4. Add the webhook to your Uniform project
3. Set up your environment variables in a `.env` file or using your preferred method.
5. Test the webhook locally and verify that it correctly identifies affected pages.
6. Deploy your application to a production environment and ensure that the webhook is properly configured in Uniform CMS.

## Configuration

### MAX_RECURSION_DEPTH

The `MAX_RECURSION_DEPTH` configuration controls how many levels deep the relationship traversal goes for each entity type:

```typescript
const MAX_RECURSION_DEPTH: Record<EntityType, number> = {
  entry: 1,
  entryPattern: 0,
  componentPattern: 1,
  compositionPattern: 1,
};
```

#### Understanding Depth Values

A depth of `0` means: don't follow any relationships for this type.
A depth of `1` means: fetch direct relationships only.
A depth of `2` means: fetch relationships, then fetch relationships of those results, etc.

#### Visual Example

With `entry: 1`:
```
✔ entry → relationships (depth 0 → 1)
✖ entry → entry → relationships (depth 1 → 2, exceeds limit)
```

With `componentPattern: 1`:
```
✔ entry → component pattern → relationships
✖ entry → component pattern → component pattern → relationships
```

#### Choosing Values

| Entity Type          | Recommended | When to Increase                                               |
|----------------------|-------------|----------------------------------------------------------------|
| `entry`              | 1-2         | If entries reference other entries that reference compositions |
| `entryPattern`       | 0-1         | If entry patterns are used in deeply nested structures         |
| `componentPattern`   | 1           | If component patterns contain other component patterns         |
| `compositionPattern` | 1           | If composition patterns are nested                             |

**Guidelines:**

1. **Start conservative**: Begin with low values (0-1) and increase if pages aren't being revalidated
2. **Monitor API usage**: Higher depths mean more API calls per webhook
3. **Consider your content model**: Flat structures need lower depths; deeply nested structures need higher
4. **Check logs**: The webhook logs the `maxDepthReached` stat to help you tune these values

### MAX_TOTAL_API_CALLS

```typescript
const MAX_TOTAL_API_CALLS = 10;
```

This is a safety limit to prevent runaway API usage. If your content model requires more traversal, increase this value. The webhook will warn in logs when this limit is reached.

## Code Walkthrough

The implementation is in `app/api/revalidate-entry/route.ts`. Here's a section-by-section explanation:

### 1. Webhook Payload Handling

```typescript
export async function POST(request: NextRequest) {
  // Parse and verify webhook payload
  let payload: WebhookPayload;

  if (process.env.UNIFORM_WEBHOOK_SECRET) {
    // Verify signature using Svix
    const svix = new Webhook(process.env.UNIFORM_WEBHOOK_SECRET);
    payload = svix.verify(rawBody, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookPayload;
  } else {
    // Development mode: skip verification
    payload = await request.json();
  }
```

**What it does**: Receives the webhook from Uniform and verifies its authenticity using Svix signature verification.

**When to customise**: Modify the `WebhookPayload` interface if Uniform's webhook payload structure changes.

### 2. Event Type Filtering

```typescript
const HANDLED_EVENT_TYPES = ['entry.published'];

if (!HANDLED_EVENT_TYPES.includes(payload.eventType)) {
  return NextResponse.json({
    message: 'Ignored event type',
    eventType: payload.eventType,
  }, { status: 200 });
}
```

**What it does**: Only processes `entry.published` events; ignores others.

**When to customise**: Add other event types like `entry.unpublished` if you need to handle them differently.

### 3. API Client Initialisation

```typescript
const relationshipClient = new RelationshipClient({
  apiHost: process.env.UNIFORM_API_HOST!,
  apiKey: process.env.UNIFORM_API_KEY!,
  projectId,
});

const projectMapClient = new ProjectMapClient({
  apiHost: process.env.UNIFORM_API_HOST!,
  apiKey: process.env.UNIFORM_API_KEY!,
  projectId,
});
```

**What it does**: Creates Uniform SDK clients for querying relationships and resolving paths.

**When to customise**: If you have multiple Uniform projects, you might need to handle different API keys.

### 4. BFS (Breadth-First Search) Traversal

```typescript
async function findAllAffectedPathsBFS(
  startEntityId: string,
  startEntityType: EntityType,
  relationshipClient: RelationshipClient,
  projectMapClient: ProjectMapClient
)
```

**What it does**: Traverses the relationship graph level-by-level to find all compositions that use the published entry.

**Key features**:

- **Visited Set**: Prevents infinite loops from circular references
- **Queue-based BFS**: Processes entities level-by-level for efficient batching
- **Type-based grouping**: Batches API calls by entity type
- **Depth tracking**: Respects `MAX_RECURSION_DEPTH` per entity type

**When to customise**: Modify if you need different traversal logic or want to handle additional entity types.

### 5. Relationship Processing

```typescript
if (instanceType === 'composition') {
  // Found a composition - collect for path resolution
  compositionIds.add(instanceId);
  visited.add(nextKey);
} else if (instanceType === 'entry') {
  // Found an entry - add to queue for further exploration
  const nextType: EntityType = instance.pattern ? 'entryPattern' : 'entry';
  queue.push([instanceId, nextType, currentDepth + 1]);
} else if (instanceType === 'component' && instance.pattern) {
  // Found a component pattern - need to find compositions using this pattern
  queue.push([instanceId, 'componentPattern', currentDepth + 1]);
}
```

**What it does**: Determines what to do with each discovered relationship:

- **Compositions**: Collect their IDs for path resolution
- **Entries**: Add to queue for further traversal (distinguishing patterns from regular entries)
- **Component patterns**: Add to queue since they may be used in multiple compositions
- **Non-pattern components**: Skip (they're part of the composition already found)

**When to customise**: If your content model uses relationships differently.

### 6. Path Resolution

```typescript
async function resolveCompositionPaths(
  projectMapClient: ProjectMapClient,
  compositionIds: string[],
  incrementApiCall: () => void
): Promise<string[]>
```

**What it does**: Converts composition UUIDs to URL paths using the Project Map API.

**When to customise**: If you have custom routing logic or need to transform paths.

### 7. Revalidation

```typescript
for (const path of paths) {
  try {
    revalidatePath(path);
    revalidatedPaths.push(path);
  } catch (err) {
    console.error(`Failed to revalidate path: ${path}`, err);
    failedPaths.push(path);
  }
}
```

**What it does**: Calls Next.js `revalidatePath()` for each discovered path.

**When to customise**:
- Use `revalidateTag()` instead if you're using tag-based revalidation
- Add additional logic like cache purging for CDNs

## Customisation Guide

### Adding Support for Other Event Types

To handle `entry.unpublished` or composition events:

```typescript
const HANDLED_EVENT_TYPES = ['entry.published', 'entry.unpublished'];

// Then in the handler:
if (payload.eventType === 'entry.unpublished') {
  // Custom logic for unpublished entries
}
```

### Using Tag-Based Revalidation

If you prefer Next.js tag-based revalidation:

```typescript
import { revalidateTag } from 'next/cache';

// Instead of path revalidation:
revalidateTag(`entry-${entityId}`);
```

This requires tagging your data fetches:

```typescript
fetch(url, {
  next: { tags: [`entry-${entryId}`] }
});
```

### Handling Multiple Locales

If your site has localised paths:

```typescript
const locales = ['en', 'fr', 'de'];
for (const path of paths) {
  for (const locale of locales) {
    revalidatePath(`/${locale}${path}`);
  }
}
```

## Webhook Setup in Uniform

1. Go to your Uniform project settings
2. Navigate to **Webhooks**
3. Create a new webhook with:
   - **URL**: `https://your-domain.com/api/revalidate-entry`
   - **Events**: Select `entry.published` (and any other events you want to handle)
   - **Secret**: Copy the signing secret to your `UNIFORM_WEBHOOK_SECRET` environment variable

## Troubleshooting

### Pages Not Revalidating

1. Check logs for the webhook response—it shows which paths were revalidated
2. Verify the `maxDepthReached` stat isn't hitting your `MAX_RECURSION_DEPTH` limits
3. Ensure the composition is in the Project Map (orphaned compositions won't have paths)

### Too Many API Calls

1. Lower `MAX_RECURSION_DEPTH` values
2. Check if your content model has circular references creating loops
3. Review the `apiCalls` stat in webhook responses

### Signature Verification Failing

1. Ensure `UNIFORM_WEBHOOK_SECRET` matches the secret in Uniform's webhook configuration
2. Check that the webhook headers (`svix-id`, `svix-timestamp`, `svix-signature`) are being forwarded correctly

---

## Response Format

The webhook returns a JSON response with revalidation details:

```json
{
  "success": true,
  "entityId": "abc-123",
  "entityName": "My Entry",
  "revalidatedPaths": ["/blog/my-post", "/about"],
  "stats": {
    "apiCalls": 3,
    "entitiesChecked": 5,
    "compositionsFound": 2,
    "maxDepthReached": 1,
    "pathsRevalidated": 2,
    "durationMs": 245
  }
}
```

Use these stats to monitor and tune your configuration.
