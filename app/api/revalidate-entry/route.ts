import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { RelationshipClient } from '@uniformdev/canvas';
import { ProjectMapClient } from '@uniformdev/project-map'

// =============================================================================
// Types
// =============================================================================

interface WebhookPayload {
  eventType: 'entry.published' | 'entry.unpublished' | 'composition.published' | 'composition.unpublished';
  id: string;
  name: string;
  project: {
    id: string;
  }
}

const HANDLED_EVENT_TYPES = ['entry.published'];

type EntityType = 'entry' | 'entryPattern' | 'componentPattern' | 'compositionPattern';

// =============================================================================
// Configuration
// =============================================================================

const MAX_RECURSION_DEPTH: Record<EntityType, number> = {
  // Only fetch relationships for the entry in the webhook
  // ✔ entry -> relationships
  // ✖︎ entry -> entry -> relationships
  entry: 1,
  // Do not follow any entry pattern relationships
  entryPattern: 0,
  // Follow component patterns 1 level deep
  // ✔ entry -> component pattern -> relationships
  // ✖︎ entry -> component pattern -> component pattern -> relationships
  componentPattern: 1,
  // Follow composition patterns 1 level deep
  // ✔ entry -> composition pattern -> relationships
  // ✖︎ entry -> composition pattern -> composition pattern -> relationships
  compositionPattern: 1,
};

const MAX_TOTAL_API_CALLS = 10;

// =============================================================================
// Webhook Handler
// =============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse and verify webhook payload
    let payload: WebhookPayload;

    if (process.env.UNIFORM_WEBHOOK_SECRET) {
      const svixId = request.headers.get('svix-id') ?? '';
      const svixTimestamp = request.headers.get('svix-timestamp') ?? '';
      const svixSignature = request.headers.get('svix-signature') ?? '';
      const rawBody = await request.text();

      const svix = new Webhook(process.env.UNIFORM_WEBHOOK_SECRET);

      try {
        payload = svix.verify(rawBody, {
          'svix-id': svixId,
          'svix-timestamp': svixTimestamp,
          'svix-signature': svixSignature,
        }) as WebhookPayload;
      } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    } else {
      console.warn('UNIFORM_WEBHOOK_SECRET not configured - skipping signature verification (not recommended for production)');
      payload = await request.json();
    }

    // Only process handled event types
    if (!HANDLED_EVENT_TYPES.includes(payload.eventType)) {
      return NextResponse.json({
        message: 'Ignored event type',
        eventType: payload.eventType,
      }, { status: 200 });
    }

    const entityId = payload.id;
    const projectId = payload.project.id;

    if (!entityId || !projectId) {
      return NextResponse.json({
        error: 'Missing entityId or projectId',
      }, { status: 400 });
    }

    console.log(`Revalidating ${payload.eventType} (${payload.id}) for ${payload.name}`);

    // Create API clients
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

    // Find all affected paths using BFS
    const { paths, stats } = await findAllAffectedPathsBFS(
      entityId,
      'entry',
      relationshipClient,
      projectMapClient
    );

    // Revalidate all discovered paths
    const revalidatedPaths: string[] = [];
    const failedPaths: string[] = [];

    for (const path of paths) {
      try {
        revalidatePath(path);
        revalidatedPaths.push(path);
      } catch (err) {
        console.error(`Failed to revalidate path: ${path}`, err);
        failedPaths.push(path);
      }
    }

    const response = {
      success: true,
      entityId,
      entityName: payload.name,
      revalidatedPaths,
      failedPaths: failedPaths.length > 0 ? failedPaths : undefined,
      stats: {
        ...stats,
        pathsRevalidated: revalidatedPaths.length,
        durationMs: Date.now() - startTime,
      },
    };

    console.log(
      `Revalidating complete ${payload.eventType} (${payload.id}) for ${payload.name}`,
      response.revalidatedPaths,
      JSON.stringify(response.stats)
    );

    return NextResponse.json(response);

  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// =============================================================================
// BFS Implementation
// =============================================================================

interface BFSStats {
  apiCalls: number;
  entitiesChecked: number;
  compositionsFound: number;
  maxDepthReached: number;
}

async function findAllAffectedPathsBFS(
  startEntityId: string,
  startEntityType: EntityType,
  relationshipClient: RelationshipClient,
  projectMapClient: ProjectMapClient
): Promise<{ paths: Set<string>; stats: BFSStats }> {
  const visited = new Set<string>();
  const pathsToRevalidate = new Set<string>();
  const compositionIds = new Set<string>();

  // Queue items: [entityId, entityType, depth]
  type QueueItem = [string, EntityType, number];
  const queue: QueueItem[] = [[startEntityId, startEntityType, 0]];

  let apiCallCount = 0;
  let maxDepthReached = 0;

  while (queue.length > 0 && apiCallCount < MAX_TOTAL_API_CALLS) {
    // Get current level size to process level by level
    const currentLevelSize = queue.length;
    const currentLevel = queue.splice(0, currentLevelSize);

    // Group entities by type for batched API calls
    const byType = new Map<EntityType, string[]>();

    for (const [id, type, depth] of currentLevel) {
      const key = `${type}:${id}`;

      // Skip already visited entities
      if (visited.has(key)) {
        continue;
      }
      visited.add(key);

      // Track max depth
      if (depth > maxDepthReached) {
        maxDepthReached = depth;
      }

      // Skip if we've hit max depth for this entity type
      const maxDepthForType = MAX_RECURSION_DEPTH[type];
      if (depth > maxDepthForType) {
        console.warn(`Max recursion depth (${maxDepthForType}) reached for ${key}`);
        continue;
      }

      // Group by type for batching
      if (!byType.has(type)) {
        byType.set(type, []);
      }
      byType.get(type)!.push(id);
    }

    // Fetch relationships for each type batch
    for (const [type, ids] of byType) {
      if (ids.length === 0) continue;

      // Check API call limit
      if (apiCallCount >= MAX_TOTAL_API_CALLS) {
        console.warn(`Max API calls (${MAX_TOTAL_API_CALLS}) reached, stopping BFS`);
        break;
      }

      apiCallCount++;

      try {
        const relationships = await relationshipClient.get({
          type,
          ids,
          withInstances: true,
          limit: 100,
        });

        // Process each relationship response
        for (const rel of relationships) {
          if (!rel.instances) continue;

          for (const instance of rel.instances) {
            const instanceId = instance.instance._id;
            const instanceType = instance.type;

            // Create unique key for this instance
            const nextKey = `${instanceType}:${instanceId}`;

            // Skip if already visited
            if (visited.has(nextKey)) {
              continue;
            }

            const currentDepth = currentLevel.find(([id]) =>
              ids.includes(id)
            )?.[2] ?? 0;

            if (instanceType === 'composition') {
              console.log('=> relationship: composition', instance.instance._name, instance.definition)
              // Found a composition - collect for path resolution
              compositionIds.add(instanceId);
              visited.add(nextKey);
            } else if (instanceType === 'entry') {
              console.log('=> relationship: entry', instance.instance._name, instance.definition)
              // Found an entry - add to queue for further exploration
              const nextType: EntityType = instance.pattern ? 'entryPattern' : 'entry';
              queue.push([instanceId, nextType, currentDepth + 1]);
            } else if (instanceType === 'component' && instance.pattern) {
              console.log('=> relationship: component pattern', instance.instance._name, instance.definition)
              // Found a component pattern - need to find compositions using this pattern
              queue.push([instanceId, 'componentPattern', currentDepth + 1]);
            }
            // Note: Non-pattern component instances are part of compositions
            // and don't need separate handling for revalidation
          }
        }
      } catch (error) {
        console.error(`Failed to fetch relationships for type ${type}:`, error);
        // Continue processing other types
      }
    }
  }

  // Resolve all composition IDs to paths
  if (compositionIds.size > 0) {
    const resolvedPaths = await resolveCompositionPaths(
      projectMapClient,
      Array.from(compositionIds),
      () => apiCallCount++
    );
    resolvedPaths.forEach(path => pathsToRevalidate.add(path));
  }

  return {
    paths: pathsToRevalidate,
    stats: {
      apiCalls: apiCallCount,
      entitiesChecked: visited.size,
      compositionsFound: compositionIds.size,
      maxDepthReached,
    },
  };
}

// =============================================================================
// Path Resolution
// =============================================================================

async function resolveCompositionPaths(
  projectMapClient: ProjectMapClient,
  compositionIds: string[],
  incrementApiCall: () => void
): Promise<string[]> {
  const paths: string[] = [];

  for (const compositionId of compositionIds) {
    try {
      incrementApiCall();
      const response = await projectMapClient.getNodes({
        compositionId,
      });

      const node = response.nodes?.[0];
      if (node?.path) {
        // Ensure path starts with /
        const path = node.path.startsWith('/') ? node.path : `/${node.path}`;
        paths.push(path);
      }
    } catch (error) {
      // Not all compositions are in the project map (e.g., patterns, orphaned compositions)
      console.error(`Failed to resolve path for composition ${compositionId}:`, error);
    }
  }

  return paths;
}
