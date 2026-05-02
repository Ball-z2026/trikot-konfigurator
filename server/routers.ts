import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { generateImage } from "./_core/imageGeneration";
import { generatePhotoroomMockup, isPhotoroomConfigured } from "./photoroom";
import { z } from "zod";
import { TEXTIL_TEMPLATES } from "../shared/templates";
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
  createOrganization,
  getOrganizationById,
  updateOrganization,
  listOrganizationsByUser,
  createDepartment,
  getDepartmentById,
  listDepartmentsByOrg,
  updateDepartment,
  deleteDepartment,
  createMembership,
  getMembershipByUserAndOrg,
  getAllMembershipsByUserAndOrg,
  listMembershipsByOrg,
  listMembershipsByDepartment,
  updateMembership,
  deleteMembership,
  createOrgLogo,
  listOrgLogos,
  getDefaultOrgLogo,
  updateOrgLogo,
  deleteOrgLogo,
  setDefaultOrgLogo,
  createDepartmentFont,
  listDepartmentFonts,
  getDefaultDepartmentFont,
  updateDepartmentFont,
  deleteDepartmentFont,
  setDefaultDepartmentFont,
  getUserByEmail,
  listAllUsers,
  listMembershipsByUser,
  createTeam,
  getTeamById,
  listTeamsByDepartment,
  listTeamsByTrainer,
  listTeamsByTrainerAndOrg,
  updateTeam,
  deleteTeam,
  createPlayer,
  getPlayerById,
  listPlayersByTeam,
  updatePlayer,
  deletePlayer,
  bulkCreatePlayers,
  deleteAllPlayersByTeam,
  listAllUsersWithMemberships,
  deleteUser,
  adminResetUserPassword,
  setUserPassword,
  updateUserInfo,
  getTeamPayment,
  upsertTeamPayment,
  confirmTeamPayment,
  getSponsorByTeam,
  upsertSponsor,
  deleteSponsor,
  listPlayerPayments,
  setPlayerPaid,
  deletePlayerPayments,
  getOrderOverviewByDepartment,
  updateOrderStatus,
  createOrderComment,
  createSavedDesign,
  listSavedDesigns,
  listSavedDesignsByTeam,
  getSavedDesign,
  updateSavedDesign,
  deleteSavedDesign,
  listOrderCommentsByTeam,
  countOrderCommentsByTeams,
  markCommentsAsRead,
  getUnreadCommentCounts,
  getOtherUserReadReceipt,
  createSponsorTemplate,
  listSponsorTemplates,
  getSponsorTemplate,
  updateSponsorTemplate,
  deleteSponsorTemplate,
  listOrgTemplates,
  duplicateSavedDesign,
  createMockupGalleryItem,
  listMockupsByTeam,
  getMockupByShareToken,
  deleteMockupGalleryItem,
} from "./db";
import { storagePut } from "./storage";
import { createLocalUser, generatePassword } from "./localUserHelpers";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { notifyOwner } from "./_core/notification";

// Shared zone schema for reuse
const zonePurpose = z.enum(["logo", "clubLogo", "playerName", "playerNumber", "playerInitials", "clubName", "custom"]);
const zoneType = z.enum(["image", "text", "both"]);

// Admin-only procedure guard
const adminProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.user || ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

// Protected procedure (requires login)
const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Login required" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

// Org-owner guard: checks that user is owner of the given org
async function requireOrgOwner(userId: number, orgId: number) {
  const membership = await getMembershipByUserAndOrg(userId, orgId);
  if (!membership || membership.role !== "owner") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Nur der Hauptverantwortliche darf diese Aktion ausf\u00fchren" });
  }
  return membership;
}

// Owner or Department Lead guard: checks that user is owner or department_lead
async function requireOrgOwnerOrDeptLead(userId: number, orgId: number) {
  const allMemberships = await getAllMembershipsByUserAndOrg(userId, orgId);
  const hasAccess = allMemberships.some(m => m.role === "owner" || m.role === "department_lead");
  if (!hasAccess) {
    // Selbstregistrierte Trainer sind Owner ihrer eigenen Org
    const org = await getOrganizationById(orgId);
    if (org && org.ownerId === userId) {
      return allMemberships[0];
    }
    throw new TRPCError({ code: "FORBIDDEN", message: "Nur Vereinsverantwortliche und Spartenleiter dürfen diese Aktion ausführen" });
  }
  return allMemberships[0];
}

// Org-member guard: checks that user is a member of the given org
// Returns the membership with the highest role (owner > department_lead > trainer)
async function requireOrgMember(userId: number, orgId: number) {
  const allMemberships = await getAllMembershipsByUserAndOrg(userId, orgId);
  if (allMemberships.length === 0) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Sie sind kein Mitglied dieser Organisation" });
  }
  const roleOrder = ["owner", "department_lead", "trainer"];
  const sorted = [...allMemberships].sort((a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role));
  return sorted[0];
}

// Department-lead guard: checks that user is lead of the given department
async function requireDepartmentLead(userId: number, orgId: number, departmentId: number) {
  const allMemberships = await getAllMembershipsByUserAndOrg(userId, orgId);
  if (allMemberships.length === 0) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Sie sind kein Mitglied dieser Organisation" });
  }
  // Owner can do everything
  const ownerMembership = allMemberships.find(m => m.role === "owner");
  if (ownerMembership) return ownerMembership;
  // Department lead for this specific department
  const deptLeadMembership = allMemberships.find(m => m.role === "department_lead" && m.departmentId === departmentId);
  if (deptLeadMembership) return deptLeadMembership;
  throw new TRPCError({ code: "FORBIDDEN", message: "Nur der Spartenleiter darf diese Aktion ausf\u00fchren" });
}

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
        // Wenn Produkt ein Template hat, imageUrls der Parts aus dem aktuellen Template nehmen
        // (damit Template-Updates sofort wirken ohne DB-Migration)
        if (product.templateId) {
          const tmpl = TEXTIL_TEMPLATES.find((t) => t.id === product.templateId);
          if (tmpl) {
            for (const part of parts) {
              const tmplPart = tmpl.parts.find((tp) => tp.key === part.key);
              if (tmplPart) {
                part.imageUrl = tmplPart.imageUrl;
              }
            }
          }
        }
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
          freeZoneMode: z.boolean().optional(),
          parts: z.array(
            z.object({
              key: z.string(),
              label: z.string(),
              imageUrl: z.string(),
              sortOrder: z.number(),
              zones: z.array(
                z.object({
                  label: z.string(),
                  type: zoneType,
                  purpose: zonePurpose,
                  posX: z.number(),
                  posY: z.number(),
                  width: z.number(),
                  height: z.number(),
                  widthCm: z.number().optional(),
                  heightCm: z.number().optional(),
                  rotation: z.number().optional(),
                  fontFamily: z.string().optional(),
                  fontSize: z.number().optional(),
                  fontColor: z.string().optional(),
                  fontWeight: z.string().optional(),
                  textAlign: z.string().optional(),
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
            freeZoneMode: input.freeZoneMode ?? false,
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
          colorPalette: z.array(z.string()).nullable().optional(),
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
          defaultColor: z.string().nullable().optional(),
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
          type: zoneType.default("image"),
          purpose: zonePurpose.default("logo"),
          posX: z.number().min(0).max(100).default(10),
          posY: z.number().min(0).max(100).default(10),
          width: z.number().min(1).max(100).default(20),
          height: z.number().min(1).max(100).default(15),
          widthCm: z.number().optional(),
          heightCm: z.number().optional(),
          rotation: z.number().min(0).max(360).default(0),
          fontFamily: z.string().optional(),
          fontSize: z.number().optional(),
          fontColor: z.string().optional(),
          fontWeight: z.string().optional(),
          textAlign: z.string().optional(),
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
          type: zoneType.optional(),
          purpose: zonePurpose.optional(),
          posX: z.number().min(0).max(100).optional(),
          posY: z.number().min(0).max(100).optional(),
          width: z.number().min(1).max(100).optional(),
          height: z.number().min(1).max(100).optional(),
          widthCm: z.number().nullable().optional(),
          heightCm: z.number().nullable().optional(),
          rotation: z.number().min(0).max(360).optional(),
          fontFamily: z.string().nullable().optional(),
          fontSize: z.number().nullable().optional(),
          fontColor: z.string().nullable().optional(),
          fontWeight: z.string().nullable().optional(),
          textAlign: z.string().nullable().optional(),
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
              rotation: z.number().optional(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        await bulkUpdateZones(input.zones);
        return { success: true };
      }),

    // ─── Trainer-Prozeduren für freeZoneMode (nicht-Admin) ───
    /** Zone erstellen (nur bei freeZoneMode-Produkten) */
    freeCreate: protectedProcedure
      .input(
        z.object({
          productId: z.number(),
          partId: z.number().optional(),
          label: z.string().min(1),
          side: z.enum(["front", "back"]).default("front"),
          type: zoneType.default("text"),
          purpose: zonePurpose.default("custom"),
          posX: z.number().min(0).max(100).default(10),
          posY: z.number().min(0).max(100).default(10),
          width: z.number().min(1).max(100).default(20),
          height: z.number().min(1).max(100).default(15),
          widthCm: z.number().optional(),
          heightCm: z.number().optional(),
          sortOrder: z.number().default(0),
        })
      )
      .mutation(async ({ input }) => {
        // Prüfe ob Produkt freeZoneMode hat
        const product = await getProductById(input.productId);
        if (!product || !product.freeZoneMode) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Freie Zonen-Bearbeitung ist für dieses Produkt nicht aktiviert." });
        }
        const id = await createZone(input);
        return { id };
      }),

    /** Zone löschen (nur bei freeZoneMode-Produkten, nicht clubLogo) */
    freeDelete: protectedProcedure
      .input(z.object({ id: z.number(), productId: z.number() }))
      .mutation(async ({ input }) => {
        const product = await getProductById(input.productId);
        if (!product || !product.freeZoneMode) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Freie Zonen-Bearbeitung ist für dieses Produkt nicht aktiviert." });
        }
        // Prüfe ob Zone clubLogo ist (darf nicht gelöscht werden)
        const zones = await listZonesByProduct(input.productId);
        const zone = zones.find(z => z.id === input.id);
        if (zone?.purpose === "clubLogo") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Das Vereinswappen kann nicht entfernt werden." });
        }
        await deleteZone(input.id);
        return { success: true };
      }),

    /** Einzelne Zone aktualisieren (nur bei freeZoneMode-Produkten, z.B. widthCm/heightCm) */
    freeUpdate: protectedProcedure
      .input(z.object({
        id: z.number(),
        productId: z.number(),
        widthCm: z.number().nullable().optional(),
        heightCm: z.number().nullable().optional(),
        label: z.string().min(1).optional(),
      }))
      .mutation(async ({ input }) => {
        const product = await getProductById(input.productId);
        if (!product || !product.freeZoneMode) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Freie Zonen-Bearbeitung ist für dieses Produkt nicht aktiviert." });
        }
        const { id, productId: _pid, ...data } = input;
        await updateZone(id, data);
        return { success: true };
      }),

    /** Positionen aktualisieren (nur bei freeZoneMode-Produkten) */
    freeBulkUpdatePositions: protectedProcedure
      .input(
        z.object({
          productId: z.number(),
          zones: z.array(
            z.object({
              id: z.number(),
              posX: z.number(),
              posY: z.number(),
              width: z.number(),
              height: z.number(),
              rotation: z.number().optional(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        const product = await getProductById(input.productId);
        if (!product || !product.freeZoneMode) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Freie Zonen-Bearbeitung ist für dieses Produkt nicht aktiviert." });
        }
        await bulkUpdateZones(input.zones);
        return { success: true };
      }),
  }),

  // ─── Organizations ───────────────────────────────────────────────────────────
  org: router({
    /** Alle Organisationen des angemeldeten Benutzers */
    list: protectedProcedure.query(async ({ ctx }) => {
      return listOrganizationsByUser(ctx.user.id);
    }),

    /** Organisation erstellen (Ersteller wird automatisch Hauptverantwortlicher) */
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        type: z.enum(["verein", "firma"]).default("verein"),
        state: z.string().max(5).optional(),
        sport: z.string().max(50).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const orgId = await createOrganization({
          name: input.name,
          type: input.type,
          state: input.state || null,
          sport: input.sport || null,
          ownerId: ctx.user.id,
        });
        // Ersteller als Owner-Mitglied hinzuf\u00fcgen
        await createMembership({
          userId: ctx.user.id,
          orgId,
          role: "owner",
        });
        return { id: orgId };
      }),

    /** Organisation aktualisieren (nur Owner) */
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        type: z.enum(["verein", "firma"]).optional(),
        state: z.string().max(5).optional(),
        sport: z.string().max(50).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await requireOrgOwner(ctx.user.id, input.id);
        const { id, ...data } = input;
        await updateOrganization(id, data);
        return { success: true };
      }),

    /** Organisation-Details abrufen */
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        await requireOrgMember(ctx.user.id, input.id);
        const org = await getOrganizationById(input.id);
        if (!org) throw new TRPCError({ code: "NOT_FOUND" });
        const allMemberships = await getAllMembershipsByUserAndOrg(ctx.user.id, input.id);
        // Return highest role: owner > department_lead > trainer
        const roleOrder = ["owner", "department_lead", "trainer"];
        const highestRole = roleOrder.find(r => allMemberships.some(m => m.role === r));
        return { ...org, userRole: highestRole || allMemberships[0]?.role };
      }),
  }),

  // ─── Departments (Sparten / Abteilungen) ───────────────────────────────────
  department: router({
    /** Einzelne Abteilung abrufen */
    getById: protectedProcedure
      .input(z.object({ id: z.number(), orgId: z.number() }))
      .query(async ({ input, ctx }) => {
        await requireOrgMember(ctx.user.id, input.orgId);
        const dept = await getDepartmentById(input.id);
        if (!dept || dept.orgId !== input.orgId) throw new TRPCError({ code: "NOT_FOUND" });
        return dept;
      }),

    /** Alle Abteilungen einer Organisation */
    listByOrg: protectedProcedure
      .input(z.object({ orgId: z.number() }))
      .query(async ({ input, ctx }) => {
        const membership = await requireOrgMember(ctx.user.id, input.orgId);
        const depts = await listDepartmentsByOrg(input.orgId);
        // Spartenleiter sehen nur ihre eigene Abteilung
        if (membership.role === "department_lead" && membership.departmentId) {
          return depts.filter(d => d.id === membership.departmentId);
        }
        // Trainer sehen nur ihre Abteilung
        if (membership.role === "trainer" && membership.departmentId) {
          return depts.filter(d => d.id === membership.departmentId);
        }
        return depts;
      }),

    /** Abteilung erstellen (nur Owner) */
    create: protectedProcedure
      .input(z.object({
        orgId: z.number(),
        name: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        await requireOrgOwner(ctx.user.id, input.orgId);
        const id = await createDepartment(input);
        return { id };
      }),

    /** Abteilung aktualisieren (Owner oder Spartenleiter) */
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        orgId: z.number(),
        name: z.string().min(1).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await requireDepartmentLead(ctx.user.id, input.orgId, input.id);
        const { id, orgId, ...data } = input;
        await updateDepartment(id, data);
        return { success: true };
      }),

    /** Abteilung l\u00f6schen (nur Owner) */
    delete: protectedProcedure
      .input(z.object({ id: z.number(), orgId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await requireOrgOwner(ctx.user.id, input.orgId);
        await deleteDepartment(input.id);
        return { success: true };
      }),
  }),

  // ─── Memberships (Mitgliedschaften) ───────────────────────────────────────
  membership: router({
    /** Alle Mitgliedschaften des aktuellen Benutzers (für Auto-Zuweisung im Konfigurator) */
    mine: protectedProcedure.query(async ({ ctx }) => {
      return listMembershipsByUser(ctx.user.id);
    }),

    /** Alle Mitglieder einer Organisation */
    listByOrg: protectedProcedure
      .input(z.object({ orgId: z.number() }))
      .query(async ({ input, ctx }) => {
        await requireOrgMember(ctx.user.id, input.orgId);
        return listMembershipsByOrg(input.orgId);
      }),

    /** Mitglieder einer Abteilung */
    listByDepartment: protectedProcedure
      .input(z.object({ departmentId: z.number(), orgId: z.number() }))
      .query(async ({ input, ctx }) => {
        await requireOrgMember(ctx.user.id, input.orgId);
        return listMembershipsByDepartment(input.departmentId);
      }),

       /**
     * Spartenleiter einladen (nur Owner/Hauptverantwortlicher)
     * Der Owner legt Spartenleiter an und weist sie einer Abteilung zu.
     */
    addDepartmentLead: protectedProcedure
      .input(z.object({
        orgId: z.number(),
        userName: z.string().min(1),
        userEmail: z.string().email(),
        departmentId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        await requireOrgOwner(ctx.user.id, input.orgId);

        // Prüfe ob E-Mail bereits existiert
        let user = await getUserByEmail(input.userEmail);
        let generatedPassword: string | null = null;

         if (user) {
          // Prüfe ob bereits als department_lead in DIESER Abteilung
          const allExisting = await getAllMembershipsByUserAndOrg(user.id, input.orgId);
          const alreadyLeadInDept = allExisting.some(m => m.role === "department_lead" && m.departmentId === input.departmentId);
          if (alreadyLeadInDept) {
            throw new TRPCError({ code: "CONFLICT", message: "Benutzer ist bereits Spartenleiter in dieser Abteilung" });
          }
        } else {
          // Neuen lokalen Benutzer erstellen
          const localUser = await createLocalUser({
            name: input.userName,
            email: input.userEmail,
          });
          generatedPassword = localUser.password;
          user = await getUserByEmail(input.userEmail);
          if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Benutzer konnte nicht erstellt werden" });
        }
        const id = await createMembership({
          userId: user.id,
          orgId: input.orgId,
          role: "department_lead",
          departmentId: input.departmentId,
        });

        // Benachrichtigung mit Login-Daten
        try {
          const { notifyOwner } = await import("./_core/notification");
          const org = await getOrganizationById(input.orgId);
          const dept = await getDepartmentById(input.departmentId);
          const pwInfo = generatedPassword ? `\nLogin-Daten: E-Mail: ${input.userEmail}, Passwort: ${generatedPassword}` : "";
          await notifyOwner({
            title: `Neuer Spartenleiter eingeladen`,
            content: `${input.userName} wurde als Spartenleiter für die Abteilung "${dept?.name}" in "${org?.name}" eingeladen.${pwInfo}`,
          });
        } catch (e) { /* Notification ist optional */ }
        return { id, userName: user.name, userEmail: user.email, generatedPassword };
      }),

    /**
     * Trainer einladen (Spartenleiter oder Owner)
     * Der Spartenleiter legt Trainer an und weist sie seiner Abteilung zu.
     */
    addTrainer: protectedProcedure
      .input(z.object({
        orgId: z.number(),
        departmentId: z.number(),
        userName: z.string().min(1),
        userEmail: z.string().email(),
      }))
       .mutation(async ({ input, ctx }) => {
        // Spartenleiter oder Owner dürfen Trainer anlegen
        await requireDepartmentLead(ctx.user.id, input.orgId, input.departmentId);
        // Prüfe ob E-Mail bereits existiert
        let user = await getUserByEmail(input.userEmail);
        let generatedPassword: string | null = null;
        if (user) {
          // Prüfe ob bereits als Trainer in DIESER Abteilung
          const allExisting = await getAllMembershipsByUserAndOrg(user.id, input.orgId);
          const alreadyTrainerInDept = allExisting.some(m => m.role === "trainer" && m.departmentId === input.departmentId);
          if (alreadyTrainerInDept) {
            throw new TRPCError({ code: "CONFLICT", message: "Benutzer ist bereits Trainer in dieser Abteilung" });
          }
        } else {
          // Neuen lokalen Benutzer erstellen
          const localUser = await createLocalUser({
            name: input.userName,
            email: input.userEmail,
          });
          generatedPassword = localUser.password;
          user = await getUserByEmail(input.userEmail);
          if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Benutzer konnte nicht erstellt werden" });
        }

        const id = await createMembership({
          userId: user.id,
          orgId: input.orgId,
          role: "trainer",
          departmentId: input.departmentId,
        });

        // Benachrichtigung mit Login-Daten
        try {
          const { notifyOwner } = await import("./_core/notification");
          const org = await getOrganizationById(input.orgId);
          const dept = await getDepartmentById(input.departmentId);
          const pwInfo = generatedPassword ? `\nLogin-Daten: E-Mail: ${input.userEmail}, Passwort: ${generatedPassword}` : "";
          await notifyOwner({
            title: `Neuer Trainer eingeladen`,
            content: `${input.userName} wurde als Trainer für die Abteilung "${dept?.name}" in "${org?.name}" eingeladen.${pwInfo}`,
          });
        } catch (e) { /* Notification ist optional */ }
        return { id, userName: user.name, userEmail: user.email, generatedPassword };
      }),

    /**
     * Allgemeine Mitglied-hinzufügen-Route (nur Owner) – für Rückwärtskompatibilität
     * Erzwingt die Einladungskette:
     * - Owner darf owner + department_lead anlegen
     * - department_lead darf nur trainer anlegen (nutzt addTrainer)
     * - trainer darf niemanden anlegen
     */
    add: protectedProcedure
      .input(z.object({
        orgId: z.number(),
        userName: z.string().min(1).optional(),
        userEmail: z.string().email(),
        role: z.enum(["owner", "department_lead", "trainer"]),
        departmentId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const callerMembership = await requireOrgMember(ctx.user.id, input.orgId);
        
        // Einladungskette prüfen
        if (callerMembership.role === "trainer") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Trainer dürfen keine Mitglieder einladen" });
        }
        if (callerMembership.role === "department_lead") {
          if (input.role !== "trainer") {
            throw new TRPCError({ code: "FORBIDDEN", message: "Spartenleiter dürfen nur Trainer einladen" });
          }
          if (!input.departmentId || callerMembership.departmentId !== input.departmentId) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Spartenleiter dürfen nur Trainer in ihrer eigenen Abteilung einladen" });
          }
        }

        // Prüfe ob E-Mail bereits existiert
        let user = await getUserByEmail(input.userEmail);
        let generatedPassword: string | null = null;

        if (user) {
          const existing = await getMembershipByUserAndOrg(user.id, input.orgId);
          if (existing) {
            throw new TRPCError({ code: "CONFLICT", message: "Benutzer ist bereits Mitglied dieser Organisation" });
          }
        } else {
          // Neuen lokalen Benutzer erstellen
          const localUser = await createLocalUser({
            name: input.userName || input.userEmail,
            email: input.userEmail,
          });
          generatedPassword = localUser.password;
          user = await getUserByEmail(input.userEmail);
          if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Benutzer konnte nicht erstellt werden" });
        }

        const id = await createMembership({
          userId: user.id,
          orgId: input.orgId,
          role: input.role,
          departmentId: input.departmentId || null,
        });
        // Benachrichtigung
        try {
          const { notifyOwner } = await import("./_core/notification");
          const org = await getOrganizationById(input.orgId);
          const roleLabel = input.role === "owner" ? "Hauptverantwortlicher" : input.role === "department_lead" ? "Spartenleiter" : "Trainer";
          const pwInfo = generatedPassword ? `\nLogin-Daten: E-Mail: ${input.userEmail}, Passwort: ${generatedPassword}` : "";
          await notifyOwner({
            title: `Neues Mitglied eingeladen`,
            content: `${user.name || user.email} wurde als ${roleLabel} in "${org?.name}" eingeladen.${pwInfo}`,
          });
        } catch (e) { /* Notification ist optional */ }
        return { id, userName: user.name, userEmail: user.email, generatedPassword };
      }),

    /** Mitgliedschaft aktualisieren (nur Owner) */
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        orgId: z.number(),
        role: z.enum(["owner", "department_lead", "trainer"]).optional(),
        departmentId: z.number().nullable().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await requireOrgOwner(ctx.user.id, input.orgId);
        const { id, orgId, ...data } = input;
        await updateMembership(id, data);
        return { success: true };
      }),

    /** Mitglied entfernen (Owner oder Spartenleiter für eigene Trainer) */
    remove: protectedProcedure
      .input(z.object({ id: z.number(), orgId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const callerMembership = await requireOrgMember(ctx.user.id, input.orgId);
        if (callerMembership.role === "trainer") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Trainer dürfen keine Mitglieder entfernen" });
        }
        // Spartenleiter dürfen nur Trainer in ihrer Abteilung entfernen
        if (callerMembership.role === "department_lead") {
          const allMembers = await listMembershipsByOrg(input.orgId);
          const target = allMembers.find(m => m.id === input.id);
          if (!target || target.role !== "trainer" || target.departmentId !== callerMembership.departmentId) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Spartenleiter dürfen nur Trainer in ihrer eigenen Abteilung entfernen" });
          }
        }
        await deleteMembership(input.id);
        return { success: true };
      }),
  }),

  // ─── Organization Logos ─────────────────────────────────────────────────────
  orgLogo: router({
    /** Alle Logo-Varianten einer Organisation */
    list: protectedProcedure
      .input(z.object({ orgId: z.number() }))
      .query(async ({ input, ctx }) => {
        await requireOrgMember(ctx.user.id, input.orgId);
        return listOrgLogos(input.orgId);
      }),

    /** Standard-Logo einer Organisation (f\u00fcr Konfigurator) */
    getDefault: publicProcedure
      .input(z.object({ orgId: z.number() }))
      .query(async ({ input }) => {
        return getDefaultOrgLogo(input.orgId);
      }),

    /** Logo hochladen (Owner oder Spartenleiter) */
    upload: protectedProcedure
      .input(z.object({
        orgId: z.number(),
        name: z.string().min(1),
        imageBase64: z.string(),
        mimeType: z.string().default("image/png"),
        isDefault: z.boolean().default(false),
      }))
      .mutation(async ({ input, ctx }) => {
        await requireOrgOwnerOrDeptLead(ctx.user.id, input.orgId);
        // Decode base64 and upload to S3
        const buffer = Buffer.from(input.imageBase64, "base64");
        const key = `org-logos/${input.orgId}/${input.name.replace(/\s+/g, "-").toLowerCase()}`;
        const ext = input.mimeType === "image/png" ? ".png" : input.mimeType === "image/svg+xml" ? ".svg" : ".jpg";
        const { key: storageKey, url } = await storagePut(key + ext, buffer, input.mimeType);
        
        const logoId = await createOrgLogo({
          orgId: input.orgId,
          name: input.name,
          imageUrl: url,
          storageKey,
          isDefault: input.isDefault,
          sortOrder: 0,
        });

        if (input.isDefault) {
          await setDefaultOrgLogo(input.orgId, logoId);
        }

        return { id: logoId, imageUrl: url };
      }),

    /** Logo aktualisieren (Owner oder Spartenleiter) */
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        orgId: z.number(),
        name: z.string().min(1).optional(),
        isDefault: z.boolean().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await requireOrgOwnerOrDeptLead(ctx.user.id, input.orgId);
        const { id, orgId, ...data } = input;
        if (data.isDefault) {
          await setDefaultOrgLogo(orgId, id);
        } else {
          await updateOrgLogo(id, data);
        }
        return { success: true };
      }),

      /** Logo löschen (Owner oder Spartenleiter) */
    delete: protectedProcedure
      .input(z.object({ id: z.number(), orgId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await requireOrgOwnerOrDeptLead(ctx.user.id, input.orgId);
        await deleteOrgLogo(input.id);
        return { success: true };
      }),
  }),

  // ─── Department Fonts (Schriftarten-Freigabe) ─────────────────────────────
  deptFont: router({
    /** Alle freigegebenen Schriften einer Abteilung */
    list: protectedProcedure
      .input(z.object({ departmentId: z.number(), orgId: z.number() }))
      .query(async ({ input, ctx }) => {
        await requireOrgMember(ctx.user.id, input.orgId);
        return listDepartmentFonts(input.departmentId);
      }),

    /** Standard-Schrift einer Abteilung (f\u00fcr Konfigurator) */
    getDefault: publicProcedure
      .input(z.object({ departmentId: z.number() }))
      .query(async ({ input }) => {
        return getDefaultDepartmentFont(input.departmentId);
      }),

    /** Schrift freigeben (Spartenleiter oder Owner) */
    approve: protectedProcedure
      .input(z.object({
        departmentId: z.number(),
        orgId: z.number(),
        fontFamily: z.string().min(1),
        fontUrl: z.string().optional(),
        isDefault: z.boolean().default(false),
      }))
      .mutation(async ({ input, ctx }) => {
        await requireDepartmentLead(ctx.user.id, input.orgId, input.departmentId);
        const id = await createDepartmentFont({
          departmentId: input.departmentId,
          fontFamily: input.fontFamily,
          fontUrl: input.fontUrl || null,
          isDefault: input.isDefault,
          approvedBy: ctx.user.id,
        });
        if (input.isDefault) {
          await setDefaultDepartmentFont(input.departmentId, id);
        }
        return { id };
      }),

    /** Schrift aktualisieren (Spartenleiter oder Owner) */
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        departmentId: z.number(),
        orgId: z.number(),
        fontFamily: z.string().min(1).optional(),
        fontUrl: z.string().nullable().optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await requireDepartmentLead(ctx.user.id, input.orgId, input.departmentId);
        const { id, departmentId, orgId, ...data } = input;
        if (data.isDefault) {
          await setDefaultDepartmentFont(departmentId, id);
        } else {
          await updateDepartmentFont(id, data);
        }
        return { success: true };
      }),

    /** Schrift entfernen (Spartenleiter oder Owner) */
    delete: protectedProcedure
      .input(z.object({ id: z.number(), departmentId: z.number(), orgId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await requireDepartmentLead(ctx.user.id, input.orgId, input.departmentId);
        await deleteDepartmentFont(input.id);
        return { success: true };
      }),
  }),

  // ─── Teams (Mannschaften) ──────────────────────────────────────────────────
  team: router({
    /** Mannschaft erstellen (Trainer, Spartenleiter, Owner) */
    create: protectedProcedure
      .input(z.object({
        orgId: z.number(),
        departmentId: z.number(),
        name: z.string().min(1),
        league: z.string().max(100).optional(),
        category: z.string().max(50).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Trainer dürfen in ihrer eigenen Abteilung Mannschaften erstellen
        const membership = await requireOrgMember(ctx.user.id, input.orgId);
        if (membership.role === "trainer" && membership.departmentId !== input.departmentId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Trainer dürfen nur in ihrer eigenen Abteilung Mannschaften anlegen" });
        }
        const id = await createTeam({
          orgId: input.orgId,
          departmentId: input.departmentId,
          name: input.name,
          league: input.league || null,
          category: input.category || null,
          trainerId: ctx.user.id,
        });
        return { id };
      }),

    /** Mannschaft nach ID */
    getById: protectedProcedure
      .input(z.object({ id: z.number(), orgId: z.number() }))
      .query(async ({ input, ctx }) => {
        const membership = await requireOrgMember(ctx.user.id, input.orgId);
        const team = await getTeamById(input.id);
        if (!team || team.orgId !== input.orgId) return null;
        // Trainer sehen nur ihre eigenen Mannschaften
        if (membership.role === "trainer" && team.trainerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sie dürfen nur Ihre eigenen Mannschaften einsehen" });
        }
        const playersList = await listPlayersByTeam(team.id);
        return { ...team, players: playersList };
      }),

    /** Mannschaften einer Abteilung (Owner/Spartenleiter sehen alle, Trainer nur eigene) */
    listByDepartment: protectedProcedure
      .input(z.object({ departmentId: z.number(), orgId: z.number() }))
      .query(async ({ input, ctx }) => {
        const membership = await requireOrgMember(ctx.user.id, input.orgId);
        if (membership.role === "trainer") {
          // Trainer sehen nur ihre eigenen Mannschaften in der Abteilung
          const allTeams = await listTeamsByDepartment(input.departmentId);
          return allTeams.filter(t => t.trainerId === ctx.user.id);
        }
        return listTeamsByDepartment(input.departmentId);
      }),

    /** Alle Mannschaften des aktuellen Trainers */
    mine: protectedProcedure.query(async ({ ctx }) => {
      return listTeamsByTrainer(ctx.user.id);
    }),

    /** Mannschaft aktualisieren (nur eigener Trainer, Spartenleiter, Owner) */
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        orgId: z.number(),
        name: z.string().min(1).optional(),
        league: z.string().max(100).optional(),
        category: z.string().max(50).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const team = await getTeamById(input.id);
        if (!team || team.orgId !== input.orgId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Mannschaft nicht gefunden" });
        }
        const membership = await requireOrgMember(ctx.user.id, input.orgId);
        if (membership.role === "trainer" && team.trainerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sie dürfen nur Ihre eigenen Mannschaften bearbeiten" });
        }
        const { id, orgId, ...data } = input;
        await updateTeam(id, data);
        return { success: true };
      }),

    /** Mannschaft löschen (nur eigener Trainer, Spartenleiter, Owner) */
    delete: protectedProcedure
      .input(z.object({ id: z.number(), orgId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const team = await getTeamById(input.id);
        if (!team || team.orgId !== input.orgId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Mannschaft nicht gefunden" });
        }
        const membership = await requireOrgMember(ctx.user.id, input.orgId);
        if (membership.role === "trainer" && team.trainerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sie dürfen nur Ihre eigenen Mannschaften löschen" });
        }
        await deleteTeam(input.id);
        return { success: true };
      }),
  }),

  // ─── Players (Spieler) ───────────────────────────────────────────────────
  player: router({
    /** Spieler einer Mannschaft */
    listByTeam: protectedProcedure
      .input(z.object({ teamId: z.number(), orgId: z.number() }))
      .query(async ({ input, ctx }) => {
        const team = await getTeamById(input.teamId);
        if (!team || team.orgId !== input.orgId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Mannschaft nicht gefunden" });
        }
        const membership = await requireOrgMember(ctx.user.id, input.orgId);
        if (membership.role === "trainer" && team.trainerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sie dürfen nur Spieler Ihrer eigenen Mannschaft einsehen" });
        }
        return listPlayersByTeam(input.teamId);
      }),

    /** Spieler hinzufügen */
    create: protectedProcedure
      .input(z.object({
        teamId: z.number(),
        orgId: z.number(),
        name: z.string().min(1),
        number: z.string().optional(),
        position: z.string().optional(),
        size: z.string().nullable().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const team = await getTeamById(input.teamId);
        if (!team || team.orgId !== input.orgId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Mannschaft nicht gefunden" });
        }
        const membership = await requireOrgMember(ctx.user.id, input.orgId);
        if (membership.role === "trainer" && team.trainerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sie dürfen nur Spieler zu Ihrer eigenen Mannschaft hinzufügen" });
        }
        const id = await createPlayer({
          teamId: input.teamId,
          name: input.name,
          number: input.number || null,
          position: input.position || null,
          size: input.size || null,
        });
        return { id };
      }),

    /** Spieler aktualisieren */
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        teamId: z.number(),
        orgId: z.number(),
        name: z.string().min(1).optional(),
        number: z.string().nullable().optional(),
        position: z.string().nullable().optional(),
        size: z.string().nullable().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const team = await getTeamById(input.teamId);
        if (!team || team.orgId !== input.orgId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Mannschaft nicht gefunden" });
        }
        const membership = await requireOrgMember(ctx.user.id, input.orgId);
        if (membership.role === "trainer" && team.trainerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sie dürfen nur Spieler Ihrer eigenen Mannschaft bearbeiten" });
        }
        const { id, teamId, orgId, ...data } = input;
        await updatePlayer(id, data);
        return { success: true };
      }),

    /** Spieler löschen */
    delete: protectedProcedure
      .input(z.object({ id: z.number(), teamId: z.number(), orgId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const team = await getTeamById(input.teamId);
        if (!team || team.orgId !== input.orgId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Mannschaft nicht gefunden" });
        }
        const membership = await requireOrgMember(ctx.user.id, input.orgId);
        if (membership.role === "trainer" && team.trainerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sie dürfen nur Spieler Ihrer eigenen Mannschaft löschen" });
        }
        await deletePlayer(input.id);
        return { success: true };
      }),

    /** CSV-Import: Mehrere Spieler auf einmal hinzufügen */
    importCsv: protectedProcedure
      .input(z.object({
        teamId: z.number(),
        orgId: z.number(),
        /** CSV-Daten als Array von Objekten */
        players: z.array(z.object({
          name: z.string().min(1),
          number: z.string().optional(),
          position: z.string().optional(),
          size: z.string().optional(),
        })),
        /** Bestehende Spieler vorher löschen? */
        replaceExisting: z.boolean().default(false),
      }))
      .mutation(async ({ input, ctx }) => {
        const team = await getTeamById(input.teamId);
        if (!team || team.orgId !== input.orgId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Mannschaft nicht gefunden" });
        }
        const membership = await requireOrgMember(ctx.user.id, input.orgId);
        if (membership.role === "trainer" && team.trainerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sie dürfen nur Spieler zu Ihrer eigenen Mannschaft importieren" });
        }
        if (input.replaceExisting) {
          await deleteAllPlayersByTeam(input.teamId);
        }
        const result = await bulkCreatePlayers(input.teamId, input.players);
        return { count: result.length, players: result };
      }),
  }),

  // ─── Payment / Abrechnung ───────────────────────────────────────────────────────────────
  payment: router({
    /** Zahlungsmodell für eine Mannschaft abrufen */
    getByTeam: protectedProcedure
      .input(z.object({ teamId: z.number(), orgId: z.number() }))
      .query(async ({ input, ctx }) => {
        const membership = await requireOrgMember(ctx.user.id, input.orgId);
        const team = await getTeamById(input.teamId);
        if (!team || team.orgId !== input.orgId) return null;
        if (membership.role === "trainer" && team.trainerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Kein Zugriff auf diese Mannschaft" });
        }
        const payment = await getTeamPayment(input.teamId);
        const sponsor = await getSponsorByTeam(input.teamId);
        const playerPaymentsList = await listPlayerPayments(input.teamId);
        return { payment, sponsor, playerPayments: playerPaymentsList };
      }),

    /** Zahlungsmodell setzen: Verein zahlt */
    setClubPayment: protectedProcedure
      .input(z.object({ teamId: z.number(), orgId: z.number(), origin: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const membership = await requireOrgMember(ctx.user.id, input.orgId);
        const team = await getTeamById(input.teamId);
        if (!team || team.orgId !== input.orgId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Mannschaft nicht gefunden" });
        }
        if (membership.role === "trainer" && team.trainerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Kein Zugriff" });
        }
        const token = nanoid(32);
        const result = await upsertTeamPayment({ teamId: input.teamId, paymentType: "club", confirmationToken: token });
        // Benachrichtigung an Owner/Spartenleiter mit Bestätigungslink
        const confirmUrl = `${input.origin}/payment/confirm/${token}`;
        await notifyOwner({
          title: `Zahlungsbestätigung angefordert: ${team.name}`,
          content: `Der Trainer hat für die Mannschaft "${team.name}" das Zahlungsmodell "Verein zahlt" ausgewählt.\n\nBitte bestätigen Sie die Kostenübernahme über folgenden Link:\n\n${confirmUrl}\n\nDer Link kann auch an den zuständigen Spartenleiter weitergeleitet werden.`,
        });
        return { success: true, token, confirmUrl, payment: result };
      }),

    /** Zahlungsmodell setzen: Sponsor zahlt */
    setSponsorPayment: protectedProcedure
      .input(z.object({
        teamId: z.number(),
        orgId: z.number(),
        origin: z.string(),
        sponsor: z.object({
          contactName: z.string().min(1),
          companyName: z.string().min(1),
          email: z.string().email(),
          phone: z.string().optional(),
          street: z.string().optional(),
          zip: z.string().optional(),
          city: z.string().optional(),
          notes: z.string().optional(),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        const membership = await requireOrgMember(ctx.user.id, input.orgId);
        const team = await getTeamById(input.teamId);
        if (!team || team.orgId !== input.orgId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Mannschaft nicht gefunden" });
        }
        if (membership.role === "trainer" && team.trainerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Kein Zugriff" });
        }
        const token = nanoid(32);
        await upsertTeamPayment({ teamId: input.teamId, paymentType: "sponsor", confirmationToken: token });
        await upsertSponsor({ teamId: input.teamId, ...input.sponsor });
        // Benachrichtigung mit Bestätigungslink für den Sponsor
        const confirmUrl = `${input.origin}/payment/confirm/${token}`;
        await notifyOwner({
          title: `Sponsor-Bestätigung angefordert: ${team.name}`,
          content: `Für die Mannschaft "${team.name}" wurde der Sponsor "${input.sponsor.companyName}" (${input.sponsor.contactName}, ${input.sponsor.email}) eingetragen.\n\nBitte leiten Sie folgenden Bestätigungslink an den Sponsor weiter:\n\n${confirmUrl}\n\nMit dem Klick auf den Link bestätigt der Sponsor die Kostenübernahme.`,
        });
        const payment = await getTeamPayment(input.teamId);
        const sponsor = await getSponsorByTeam(input.teamId);
        return { success: true, token, confirmUrl, payment, sponsor };
      }),

    /** Zahlungsmodell setzen: Selbstzahler */
    setSelfPayment: protectedProcedure
      .input(z.object({ teamId: z.number(), orgId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const membership = await requireOrgMember(ctx.user.id, input.orgId);
        const team = await getTeamById(input.teamId);
        if (!team || team.orgId !== input.orgId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Mannschaft nicht gefunden" });
        }
        if (membership.role === "trainer" && team.trainerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Kein Zugriff" });
        }
        // Bei Selbstzahler: Status sofort auf confirmed (keine externe Bestätigung nötig)
        const result = await upsertTeamPayment({ teamId: input.teamId, paymentType: "self", status: "confirmed" });
        return { success: true, payment: result };
      }),

    /** Bestätigungslink einlösen (Spartenleiter oder Sponsor) */
    confirm: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        const result = await confirmTeamPayment(input.token);
        if (!result) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Ungültiger oder bereits verwendeter Bestätigungslink" });
        }
        return { success: true, teamId: result.teamId, paymentType: result.paymentType };
      }),

    /** Spieler als bezahlt markieren (Selbstzahler-Modell) */
    setPlayerPaid: protectedProcedure
      .input(z.object({ playerId: z.number(), teamId: z.number(), orgId: z.number(), paid: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        const membership = await requireOrgMember(ctx.user.id, input.orgId);
        const team = await getTeamById(input.teamId);
        if (!team || team.orgId !== input.orgId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Mannschaft nicht gefunden" });
        }
        if (membership.role === "trainer" && team.trainerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Kein Zugriff" });
        }
        await setPlayerPaid(input.playerId, input.teamId, input.paid);
        return { success: true };
      }),

    /** Alle Spieler-Zahlungen einer Mannschaft abrufen */
    listPlayerPayments: protectedProcedure
      .input(z.object({ teamId: z.number(), orgId: z.number() }))
      .query(async ({ input, ctx }) => {
        const membership = await requireOrgMember(ctx.user.id, input.orgId);
        const team = await getTeamById(input.teamId);
        if (!team || team.orgId !== input.orgId) return [];
        if (membership.role === "trainer" && team.trainerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Kein Zugriff" });
        }
        return listPlayerPayments(input.teamId);
      }),
  }),

  // ─── Order Overview (Bestellübersicht für Spartenleiter) ─────────────────────────────────
  orderOverview: router({
    /** Bestellübersicht aller Mannschaften einer Abteilung */
    byDepartment: protectedProcedure
      .input(z.object({ departmentId: z.number(), orgId: z.number() }))
      .query(async ({ input, ctx }) => {
        // Nur Owner oder Spartenleiter dürfen die Übersicht sehen
        await requireDepartmentLead(ctx.user.id, input.orgId, input.departmentId);
        return getOrderOverviewByDepartment(input.departmentId);
      }),
    /** Bestellstatus einer Mannschaft ändern (nur Spartenleiter/Owner) */
    updateStatus: protectedProcedure
      .input(z.object({
        teamId: z.number(),
        orgId: z.number(),
        departmentId: z.number(),
        status: z.enum(["offen", "bestellt", "in_produktion", "geliefert"]),
      }))
      .mutation(async ({ input, ctx }) => {
        await requireDepartmentLead(ctx.user.id, input.orgId, input.departmentId);
        return updateOrderStatus(input.teamId, input.status);
      }),
  }),
  // ─── Order Comments ─────────────────────────────────────────────────────────────────────
  orderComment: router({
    /** Kommentar zu einer Mannschaftsbestellung erstellen */
    create: protectedProcedure
      .input(z.object({
        teamId: z.number(),
        message: z.string().min(1).max(2000),
      }))
      .mutation(async ({ input, ctx }) => {
        // Team laden um orgId und departmentId zu prüfen
        const team = await getTeamById(input.teamId);
        if (!team) throw new TRPCError({ code: "NOT_FOUND", message: "Mannschaft nicht gefunden" });
        // Prüfen ob User berechtigt ist (Spartenleiter der Abteilung ODER Trainer der Mannschaft)
        const allMemberships = await getAllMembershipsByUserAndOrg(ctx.user.id, team.orgId);
        if (allMemberships.length === 0) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Keine Berechtigung" });
        }
        const isOwner = allMemberships.some(m => m.role === "owner");
        const isDeptLead = allMemberships.some(m => m.role === "department_lead" && m.departmentId === team.departmentId);
        const isTrainer = team.trainerId === ctx.user.id;
        if (!isOwner && !isDeptLead && !isTrainer) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Nur Spartenleiter und Trainer dieser Mannschaft dürfen kommentieren" });
        }
        const userRole = (isOwner || isDeptLead) ? "department_lead" as const : "trainer" as const;
        const userName = ctx.user.name || "Unbekannt";
        const commentId = await createOrderComment({
          teamId: input.teamId,
          userId: ctx.user.id,
          userName,
          userRole,
          message: input.message,
        });
        return { id: commentId };
      }),
    /** Kommentare einer Mannschaft laden */
    listByTeam: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input, ctx }) => {
        const team = await getTeamById(input.teamId);
        if (!team) throw new TRPCError({ code: "NOT_FOUND", message: "Mannschaft nicht gefunden" });
        const allMemberships = await getAllMembershipsByUserAndOrg(ctx.user.id, team.orgId);
        if (allMemberships.length === 0) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Keine Berechtigung" });
        }
        const isOwner = allMemberships.some(m => m.role === "owner");
        const isDeptLead = allMemberships.some(m => m.role === "department_lead" && m.departmentId === team.departmentId);
        const isTrainer = team.trainerId === ctx.user.id;
        if (!isOwner && !isDeptLead && !isTrainer) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Keine Berechtigung zum Lesen der Kommentare" });
        }
        return listOrderCommentsByTeam(input.teamId);
      }),
    /** Kommentar-Anzahl pro Mannschaft (für Badge in Bestellübersicht) */
    countByTeams: protectedProcedure
      .input(z.object({ teamIds: z.array(z.number()) }))
      .query(async ({ input }) => {
        return countOrderCommentsByTeams(input.teamIds);
      }),
    /** Kommentare als gelesen markieren (beim Öffnen des Threads) */
    markAsRead: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await markCommentsAsRead(input.teamId, ctx.user.id);
        return { success: true };
      }),
    /** Ungelesene Kommentare pro Team zählen */
    getUnreadCounts: protectedProcedure
      .input(z.object({ teamIds: z.array(z.number()) }))
      .query(async ({ input, ctx }) => {
        return getUnreadCommentCounts(input.teamIds, ctx.user.id);
      }),
    /** Lesebestätigung des Gegenübers holen (für "Gelesen um X Uhr") */
    getReadReceipt: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input, ctx }) => {
        const receipt = await getOtherUserReadReceipt(input.teamId, ctx.user.id);
        if (!receipt) return null;
        return { userId: receipt.userId, lastReadAt: receipt.lastReadAt };
      }),
  }),

  // ─── Admin User Management ───────────────────────────────────────────────────────────────
  adminUsers: router({
    /** Alle Benutzer mit Mitgliedschaften auflisten */
    list: adminProcedure.query(async () => {
      return listAllUsersWithMemberships();
    }),

    /** Neuen lokalen Benutzer anlegen (Hauptverantwortlicher, Spartenleiter, Trainer) */
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6).optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await createLocalUser({
          name: input.name,
          email: input.email,
          password: input.password,
        });
        return result;
      }),

    /** Passwort eines Benutzers zurücksetzen (neues Passwort generieren) */
    resetPassword: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        const newPassword = generatePassword();
        const hash = await bcrypt.hash(newPassword, 12);
        await adminResetUserPassword(input.userId, hash);
        return { password: newPassword };
      }),

    /** Passwort für einen OAuth-Benutzer setzen (damit er auch lokal einloggen kann) */
    setPassword: adminProcedure
      .input(z.object({
        userId: z.number(),
        password: z.string().min(6).optional(),
      }))
      .mutation(async ({ input }) => {
        const password = input.password || generatePassword();
        const hash = await bcrypt.hash(password, 12);
        await setUserPassword(input.userId, hash);
        return { password };
      }),

    /** Benutzer-Name und/oder E-Mail aktualisieren */
    update: adminProcedure
      .input(z.object({
        userId: z.number(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          await updateUserInfo(input.userId, {
            name: input.name,
            email: input.email,
          });
          return { success: true };
        } catch (err: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: err.message || "Fehler beim Aktualisieren",
          });
        }
      }),

    /** Benutzer löschen (inkl. Mitgliedschaften) */
    delete: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // Verhindere Selbstlöschung
        if (input.userId === ctx.user.id) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Sie können sich nicht selbst löschen" });
        }
        await deleteUser(input.userId);
        return { success: true };
      }),
  }),

  savedDesign: router({
    /** Design speichern */
    save: protectedProcedure
      .input(z.object({
        name: z.string().min(1, "Bitte einen Namen eingeben"),
        teamId: z.number(),
        productId: z.number(),
        zonesConfig: z.unknown(),
        colorsConfig: z.unknown().optional(),
        thumbnailBase64: z.string().optional(),
        category: z.enum(["heimtrikot", "auswaertstrikot", "training", "sonstiges"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        let thumbnailUrl: string | undefined;
        if (input.thumbnailBase64) {
          const buf = Buffer.from(input.thumbnailBase64, "base64");
          const key = `designs/thumb-${Date.now()}-${ctx.user.id}.png`;
          const result = await storagePut(key, buf, "image/png");
          thumbnailUrl = result.url;
        }
        const id = await createSavedDesign({
          name: input.name,
          teamId: input.teamId,
          productId: input.productId,
          userId: ctx.user.id,
          zonesConfig: input.zonesConfig,
          colorsConfig: input.colorsConfig,
          thumbnailUrl,
          category: input.category,
        });
        return { id, name: input.name };
      }),

    /** Gespeicherte Designs eines Teams laden */
    list: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input, ctx }) => {
        return listSavedDesignsByTeam(input.teamId);
      }),

    /** Einzelnes Design laden */
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getSavedDesign(input.id);
      }),

    /** Design aktualisieren (überschreiben) */
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        zonesConfig: z.unknown().optional(),
        colorsConfig: z.unknown().optional(),
        thumbnailBase64: z.string().optional(),
        category: z.enum(["heimtrikot", "auswaertstrikot", "training", "sonstiges"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const design = await getSavedDesign(input.id);
        if (!design || design.userId !== ctx.user.id) {
          throw new Error("Design nicht gefunden oder keine Berechtigung");
        }
        let thumbnailUrl: string | undefined;
        if (input.thumbnailBase64) {
          const buf = Buffer.from(input.thumbnailBase64, "base64");
          const key = `designs/thumb-${Date.now()}-${ctx.user.id}.png`;
          const result = await storagePut(key, buf, "image/png");
          thumbnailUrl = result.url;
        }
        const { id, thumbnailBase64, ...rest } = input;
        await updateSavedDesign(id, { ...rest, thumbnailUrl });
        return { success: true };
      }),

    /** Design löschen */
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const design = await getSavedDesign(input.id);
        if (!design || design.userId !== ctx.user.id) {
          throw new Error("Design nicht gefunden oder keine Berechtigung");
        }
        await deleteSavedDesign(input.id);
        return { success: true };
      }),

    /** Organisationsweite Vorlagen auflisten */
    listOrgTemplates: protectedProcedure
      .input(z.object({ orgId: z.number() }))
      .query(async ({ input }) => {
        return listOrgTemplates(input.orgId);
      }),

    /** Design als Org-Vorlage markieren (nur Owner) */
    setOrgTemplate: protectedProcedure
      .input(z.object({
        id: z.number(),
        orgId: z.number(),
        isOrgTemplate: z.boolean(),
      }))
      .mutation(async ({ input, ctx }) => {
        const membership = await getMembershipByUserAndOrg(ctx.user.id, input.orgId);
        if (!membership || membership.role !== "owner") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Nur der Vereinsverantwortliche kann Org-Vorlagen verwalten" });
        }
        await updateSavedDesign(input.id, { isOrgTemplate: input.isOrgTemplate, orgId: input.orgId });
        return { success: true };
      }),

    /** Design duplizieren (in ein anderes Team kopieren) */
    duplicate: protectedProcedure
      .input(z.object({
        sourceId: z.number(),
        targetTeamId: z.number(),
        newName: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const newId = await duplicateSavedDesign(input.sourceId, input.targetTeamId, ctx.user.id, input.newName);
        return { id: newId };
      }),
  }),

  // ─── Sponsor Templates ─────────────────────────────────────────────────
  sponsorTemplate: router({
    /** Alle Sponsor-Vorlagen einer Organisation abrufen (für alle Mitglieder) */
    list: protectedProcedure
      .input(z.object({ orgId: z.number() }))
      .query(async ({ input }) => {
        return listSponsorTemplates(input.orgId);
      }),

    /** Einzelne Sponsor-Vorlage abrufen */
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getSponsorTemplate(input.id);
      }),

    /** Neue Sponsor-Vorlage erstellen (nur Owner) */
    create: protectedProcedure
      .input(z.object({
        orgId: z.number(),
        name: z.string().min(1).max(255),
        logoBase64: z.string(),
        mimeType: z.string(),
        category: z.string().max(100).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Prüfe ob User Owner der Org ist
        const membership = await getMembershipByUserAndOrg(ctx.user.id, input.orgId);
        if (!membership || membership.role !== "owner") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Nur der Vereinsverantwortliche kann Sponsor-Vorlagen erstellen" });
        }
        // Upload Logo zu S3
        const buffer = Buffer.from(input.logoBase64, "base64");
        const ext = input.mimeType.includes("png") ? ".png" : input.mimeType.includes("svg") ? ".svg" : ".jpg";
        const key = `org-${input.orgId}/sponsor-templates/${Date.now()}-${input.name.replace(/[^a-zA-Z0-9]/g, "_")}`;
        const { key: storageKey, url } = await storagePut(key + ext, buffer, input.mimeType);
        // In DB speichern
        const id = await createSponsorTemplate({
          orgId: input.orgId,
          name: input.name,
          logoUrl: url,
          storageKey,
          category: input.category || null,
          createdBy: ctx.user.id,
        });
        return { id, logoUrl: url };
      }),

    /** Sponsor-Vorlage aktualisieren (nur Owner) */
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        orgId: z.number(),
        name: z.string().min(1).max(255).optional(),
        category: z.string().max(100).optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const membership = await getMembershipByUserAndOrg(ctx.user.id, input.orgId);
        if (!membership || membership.role !== "owner") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Nur der Vereinsverantwortliche kann Sponsor-Vorlagen bearbeiten" });
        }
        const { id, orgId, ...data } = input;
        await updateSponsorTemplate(id, data);
        return { success: true };
      }),

    /** Sponsor-Vorlage löschen (nur Owner) */
    delete: protectedProcedure
      .input(z.object({ id: z.number(), orgId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const membership = await getMembershipByUserAndOrg(ctx.user.id, input.orgId);
        if (!membership || membership.role !== "owner") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Nur der Vereinsverantwortliche kann Sponsor-Vorlagen löschen" });
        }
        await deleteSponsorTemplate(input.id);
        return { success: true };
      }),
   }),

  /** Mockup-Galerie */
  mockupGallery: router({
    /** Mockup in Galerie speichern */
    save: protectedProcedure
      .input(z.object({
        teamId: z.number(),
        productId: z.number(),
        imageUrl: z.string(),
        side: z.enum(["front", "back"]).default("front"),
        title: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const shareToken = nanoid(16);
        const result = await createMockupGalleryItem({
          teamId: input.teamId,
          productId: input.productId,
          userId: ctx.user!.id,
          imageUrl: input.imageUrl,
          side: input.side,
          title: input.title || null,
          shareToken,
        });
        return { id: result.id, shareToken };
      }),

    /** Alle Mockups eines Teams laden */
    listByTeam: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input }) => {
        return listMockupsByTeam(input.teamId);
      }),

    /** Mockup per Share-Token laden (öffentlich) */
    getByShareToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const item = await getMockupByShareToken(input.token);
        if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Mockup nicht gefunden" });
        return item;
      }),

    /** Mockup löschen */
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteMockupGalleryItem(input.id, ctx.user!.id);
        return { success: true };
      }),
  }),

  /** Mockup-Generierung */
  mockup: router({
    /** KI-Mockup generieren – nutzt das aktuelle Design als Referenzbild */
    generateAi: protectedProcedure
      .input(z.object({
        productName: z.string(),
        productType: z.string().optional(),
        colorDescription: z.string().optional().describe("Farbbeschreibung der Teile, z.B. 'Vorderteil: #ff0000, Rückteil: #0000ff'"),
        /** Base64-kodiertes Bild des aktuellen Designs (data:image/png;base64,...) */
        designImageBase64: z.string().optional(),
        /** Beschreibung der Zonen-Inhalte (Logos, Texte, Nummern) */
        zoneDescriptions: z.string().optional(),
        /** Welche Seite: front oder back */
        side: z.enum(["front", "back"]).optional().default("front"),
      }))
      .mutation(async ({ input }) => {
        const sideLabel = input.side === "back" ? "back" : "front";
        
        // Bestimme den Kleidungstyp auf Englisch
        const garmentType = input.productName.toLowerCase().includes("hoodie") ? "hoodie"
          : input.productName.toLowerCase().includes("jacke") ? "sports jacket"
          : input.productName.toLowerCase().includes("t-shirt") ? "t-shirt"
          : input.productName.toLowerCase().includes("polo") ? "polo shirt"
          : input.productName.toLowerCase().includes("trikot") ? "soccer jersey"
          : "sportswear garment";

        let prompt: string;
        if (input.designImageBase64) {
          // Image-to-Image: Fotorealistisches Mockup mit Person
          prompt = `Professional fashion photography of a young athletic man wearing this exact ${garmentType} shown in the reference image. The ${sideLabel} of the garment must match the reference EXACTLY - preserve all logos, text, numbers, colors, and graphic placements precisely as shown. Full body shot, model standing naturally on an urban sidewalk with blurred city background. Natural daylight, shallow depth of field, shot on Canon EOS R5 85mm f/1.4. High-end commercial fashion photography style.`;
        } else {
          // Fallback ohne Referenzbild
          const colorDesc = input.colorDescription ? ` in colors ${input.colorDescription}` : "";
          prompt = `Professional fashion photography of a young athletic man wearing a ${garmentType}${colorDesc}. ${sideLabel} view. Full body shot, model standing naturally on an urban sidewalk with blurred city background. Natural daylight, shallow depth of field, shot on Canon EOS R5 85mm f/1.4. High-end commercial fashion photography.`;
        }

        // Wenn ein Design-Bild vorhanden ist, als Referenz übergeben
        const originalImages = input.designImageBase64
          ? [{
              b64Json: input.designImageBase64.replace(/^data:image\/\w+;base64,/, ""),
              mimeType: "image/png",
            }]
          : undefined;

        const result = await generateImage({ prompt, originalImages });

        return { url: result.url };
      }),

    /** Photoroom Virtual Model Mockup generieren */
    generatePhotoroom: protectedProcedure
      .input(z.object({
        /** Base64-kodiertes Bild des aktuellen Designs (data:image/png;base64,...) */
        designImageBase64: z.string(),
        /** Model Preset (default: avery) */
        modelPreset: z.string().optional(),
        /** Scene Preset (default: street) */
        scenePreset: z.string().optional(),
        /** Pose (default: standing) */
        pose: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        if (!isPhotoroomConfigured()) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Photoroom API Key ist nicht konfiguriert. Bitte in den Einstellungen hinterlegen.",
          });
        }

        const result = await generatePhotoroomMockup({
          imageBase64: input.designImageBase64,
          modelPreset: input.modelPreset,
          scenePreset: input.scenePreset,
          pose: input.pose,
        });

        return { url: result.url };
      }),

    /** Prüfe ob Photoroom API konfiguriert ist */
    photoroomStatus: protectedProcedure
      .query(() => {
        return { configured: isPhotoroomConfigured() };
      }),
  }),
});
export type AppRouter = typeof appRouter;
