import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  listPartsByProduct,
  createPart,
  updatePart,
  deletePart,
  createProductFromTemplate,
  listZonesByProduct,
  listZonesByPart,
  createZone,
  updateZone,
  deleteZone,
  bulkUpdateZones,
} from "./db";

// Admin-only procedure guard
const adminProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.user || ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Products ───────────────────────────────────────────────────────────
  product: router({
    list: publicProcedure.query(async ({ ctx }) => {
      const isAdmin = ctx.user?.role === "admin";
      return listProducts(!isAdmin);
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const product = await getProductById(input.id);
        if (!product) return null;
        if (!product.published && ctx.user?.role !== "admin") return null;
        const parts = await listPartsByProduct(input.id);
        const zones = await listZonesByProduct(input.id);
        return { ...product, parts, zones };
      }),

    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(1),
          description: z.string().optional(),
          category: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const id = await createProduct({
          name: input.name,
          description: input.description || null,
          category: input.category || null,
          createdBy: ctx.user.id,
        });
        return { id };
      }),

    /** Produkt aus Template erstellen – legt automatisch Teile und Zonen an */
    createFromTemplate: adminProcedure
      .input(
        z.object({
          name: z.string().min(1),
          description: z.string().optional(),
          category: z.string().optional(),
          templateId: z.string(),
          parts: z.array(
            z.object({
              key: z.string(),
              label: z.string(),
              imageUrl: z.string(),
              sortOrder: z.number(),
              zones: z.array(
                z.object({
                  label: z.string(),
                  type: z.enum(["image", "text", "both"]),
                  purpose: z.enum(["logo", "playerName", "playerNumber", "custom"]),
                  posX: z.number(),
                  posY: z.number(),
                  width: z.number(),
                  height: z.number(),
                  sortOrder: z.number(),
                })
              ),
            })
          ),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const id = await createProductFromTemplate(
          {
            name: input.name,
            description: input.description || null,
            category: input.category || null,
            templateId: input.templateId,
            createdBy: ctx.user.id,
          },
          input.parts
        );
        return { id };
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).optional(),
          description: z.string().optional(),
          category: z.string().optional(),
          frontImageUrl: z.string().optional(),
          backImageUrl: z.string().optional(),
          published: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateProduct(id, data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteProduct(input.id);
        return { success: true };
      }),
  }),

  // ─── Product Parts ──────────────────────────────────────────────────────
  part: router({
    listByProduct: publicProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ input }) => {
        return listPartsByProduct(input.productId);
      }),

    create: adminProcedure
      .input(
        z.object({
          productId: z.number(),
          key: z.string().min(1),
          label: z.string().min(1),
          imageUrl: z.string().optional(),
          sortOrder: z.number().default(0),
        })
      )
      .mutation(async ({ input }) => {
        const id = await createPart(input);
        return { id };
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          key: z.string().min(1).optional(),
          label: z.string().min(1).optional(),
          imageUrl: z.string().optional(),
          sortOrder: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updatePart(id, data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deletePart(input.id);
        return { success: true };
      }),
  }),

  // ─── Zones ──────────────────────────────────────────────────────────────
  zone: router({
    listByProduct: publicProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ input }) => {
        return listZonesByProduct(input.productId);
      }),

    listByPart: publicProcedure
      .input(z.object({ partId: z.number() }))
      .query(async ({ input }) => {
        return listZonesByPart(input.partId);
      }),

    create: adminProcedure
      .input(
        z.object({
          productId: z.number(),
          partId: z.number().optional(),
          label: z.string().min(1),
          side: z.enum(["front", "back"]).default("front"),
          type: z.enum(["image", "text", "both"]).default("image"),
          purpose: z.enum(["logo", "playerName", "playerNumber", "custom"]).default("logo"),
          posX: z.number().min(0).max(100).default(10),
          posY: z.number().min(0).max(100).default(10),
          width: z.number().min(1).max(100).default(20),
          height: z.number().min(1).max(100).default(15),
          sortOrder: z.number().default(0),
        })
      )
      .mutation(async ({ input }) => {
        const id = await createZone(input);
        return { id };
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          label: z.string().min(1).optional(),
          partId: z.number().optional(),
          side: z.enum(["front", "back"]).optional(),
          type: z.enum(["image", "text", "both"]).optional(),
          purpose: z.enum(["logo", "playerName", "playerNumber", "custom"]).optional(),
          posX: z.number().min(0).max(100).optional(),
          posY: z.number().min(0).max(100).optional(),
          width: z.number().min(1).max(100).optional(),
          height: z.number().min(1).max(100).optional(),
          sortOrder: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateZone(id, data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteZone(input.id);
        return { success: true };
      }),

    bulkUpdatePositions: adminProcedure
      .input(
        z.object({
          zones: z.array(
            z.object({
              id: z.number(),
              posX: z.number(),
              posY: z.number(),
              width: z.number(),
              height: z.number(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        await bulkUpdateZones(input.zones);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
