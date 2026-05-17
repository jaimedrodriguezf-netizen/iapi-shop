# IAPI Shop - Engineering Standards

## Mandatory Verification Protocol

To ensure the highest technical integrity, the following step is **MANDATORY** after every code modification:

1.  **Proactive MCP Check**: ALWAYS call `mcp_next-devtools_nextjs_call(toolName="get_errors")` before informing the user that a task is complete.
2.  **TypeScript Verification**: ALWAYS run `npx tsc --noEmit` to ensure type safety and catch potential build-breaking errors.
3.  **Fix Regressions**: If the MCP or TypeScript check reports errors, they must be fixed immediately before handing the task back to the user.
4.  **Clean Console Mandate**: Warnings (like `asChild` mismatch or `controlled/uncontrolled` inputs) should be treated as high-priority fixes to maintain a professional development environment.

## Design Patterns

- **Multi-tenancy**: Always use `tenant_id` for RLS-protected tables (`products`, `categories`, `tags`).
- **Composition**: Prefer the `render` prop over `asChild` for components based on `Base UI`.
- **Server Actions**: Large database mutations must live in `src/lib/*/actions.ts` marked with `"use server"`.
