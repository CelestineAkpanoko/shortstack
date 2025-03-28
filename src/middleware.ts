// import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
// import { checkUser } from '@/src/lib/checkUser';


// const isPublicRoute = createRouteMatcher([
//   '/teacher(.*)', // Exclude the /teacher catch-all route from protection
//   // Add other public routes here
//   '/',
//   '/student',
//   '/login',
// ]);

// // const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);

// export default clerkMiddleware(async (auth, request) => {
//   if (!isPublicRoute(request)) {
//     await auth.protect();
//     if (auth.userId) {
//       await checkUser();
//     }
//   }

// });
// export const config = {
//   matcher: [
//     // Skip Next.js internals and all static files, unless found in search params
//     '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
//     // Always run for API routes
//     '/(api|trpc)(.*)',
//   ],
// };

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
// import { checkUser } from '@/src/lib/checkUser';

const isPublicRoute = createRouteMatcher([
  '/teacher(.*)',
  '/',
  '/student',
  '/login',
]);

export default clerkMiddleware(async (auth, request) => {
  const { userId, redirectToSignIn } = await auth();

  if (!userId && !isPublicRoute(request)) {
      return redirectToSignIn();
    // await checkUser();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
