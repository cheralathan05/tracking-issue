import type { AuthJwtPayload, PublicCitizen } from "./auth.js";

declare global {
  namespace Express {
    interface Request {
      user?: PublicCitizen;
      tokenPayload?: AuthJwtPayload;
    }
  }
}

export {};
