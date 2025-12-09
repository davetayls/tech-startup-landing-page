# Uniform Integration Setup

This project has been successfully integrated with Uniform CMS using Next.js App Router.

## What was installed

- `@uniformdev/canvas-next-rsc` - Uniform SDK for Next.js App Router with React Server Components
- `@uniformdev/canvas` - Core Uniform Canvas SDK

## Files created/modified

### Created files:
- `uniform.server.config.js` - Uniform server configuration
- `uniform/resolve.ts` - Component resolver registry
- `app/[[...path]]/page.tsx` - Dynamic catch-all route for Uniform compositions
- `app/api/preview/route.ts` - Preview API endpoint for contextual editing
- `app/playground/page.tsx` - Playground page for previewing patterns

### Modified files:
- `next.config.mjs` - Added `withUniformConfig` wrapper
- `app/layout.tsx` - Wrapped children with `UniformContext`
- `app/page.tsx` → `app/page.tsx.off` - Renamed to avoid route conflicts

## Environment variables required

Create a `.env.local` file with the following variables:

```bash
# Uniform Configuration
# Get your API key from: https://uniform.app
# Required permissions: Read Published Compositions
UNIFORM_API_KEY=your_api_key_here
UNIFORM_PROJECT_ID=your_project_id_here

# Preview secret (can be any string for development)
UNIFORM_PREVIEW_SECRET=hello-world
```

## Next steps

1. **Set up your Uniform project**:
   - Visit https://uniform.app
   - Create or access your project
   - Get your API key and Project ID

2. **Add environment variables**:
   - Copy the values above to `.env.local`
   - Replace `your_api_key_here` and `your_project_id_here` with actual values

3. **Register your existing components with Uniform**:
   - Edit `uniform/resolve.ts` to map Uniform component types to your React components
   - Example:
     ```typescript
     import { HeroComponent } from "@/components/hero";
     
     if (component.type === "hero") {
       result = {
         component: HeroComponent,
       };
     }
     ```

4. **Create Uniform component definitions**:
   - Use the Uniform dashboard or MCP tools to create component definitions
   - Match the component types to what you register in `resolve.ts`

5. **Test the integration**:
   - Start your dev server: `pnpm dev`
   - Create a composition in Uniform
   - Preview it in the Uniform dashboard

## Resources

- [Uniform Documentation](https://docs.uniform.app)
- [Next.js App Router Integration Guide](https://docs.uniform.app/docs/integrations/nextjs-app-router)

