import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Only /admin and the admin-only APIs require login. The shop stays public.
const isProtected = createRouteMatcher(["/admin(.*)"]);

const isDummy = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes("xxxx") || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default isDummy
  ? function dummyMiddleware() { /* no-op in dev bypass mode */ }
  : clerkMiddleware(async (auth, req) => {
      if (isProtected(req)) await auth.protect();
    });

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api)(.*)"],
};
