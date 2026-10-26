import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

// F5: route handler UploadThing (POST /api/uploadthing)
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
