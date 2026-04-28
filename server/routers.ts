import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  listZonesByProduct,
  createZone,
  updateZone,
  deleteZone,
  bulkUpdateZones,
} from "./db";

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
    /** Alle Produkte auflisten (Admin: alle, Kunden: nur veröffentlichte) */
    list: publicProcedure.query(async ({ ctx }) => {
      const isAdmin = ctx.user?.role === "admin";
      return listProducts(!isAdmin);
    }),

    /** Einzelnes Produkt mit Zonen laden */
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const product = await getProductById(input.id);
        if (!product) return null;
        if (!product.published && ctx.user?.role !== "admin") return null;
        const zones = await listZonesByProduct(input.id);
        return { ...product, zones };
      }),

    /** Neues Produkt erstellen (Admin only) */
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

    /** Produkt aktualisieren (Admin only) */
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

    /** Produkt löschen (Admin only) */
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteProduct(input.id);
        return { success: true };
      }),
  }),

  // ─── Zones ──────────────────────────────────────────────────────────────
  zone: router({
    /** Zonen eines Produkts auflisten */
    listByProduct: publicProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ input }) => {
        return listZonesByProduct(input.productId);
      }),

    /** Neue Zone erstellen (Admin only) */
    create: adminProcedure
      .input(
        z.object({
          productId: z.number(),
          label: z.string().min(1),
          side: z.enum(["front", "back"]),
          type: z.enum(["image", "text", "both"]),
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

    /** Zone aktualisieren (Admin only) */
    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          label: z.string().min(1).optional(),
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

    /** Zone löschen (Admin only) */
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteZone(input.id);
        return { success: true };
      }),

    /** Mehrere Zonen-Positionen auf einmal aktualisieren (Drag & Drop) */
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
