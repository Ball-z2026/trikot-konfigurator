import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { generateImage } from "./_core/imageGeneration";
import { makeRequest, type GeocodingResult } from "./_core/map";
import { generatePhotoroomMockup, isPhotoroomConfigured } from "./photoroom";
import { z } from "zod";
import { TEXTIL_TEMPLATES } from "../shared/templates";
import { getJerseyRules, validateZonesAgainstRules, type ZoneForValidation, type SportartCode } from "../shared/jerseyRules";
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
  listTeamsByOrg,
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
  getMandatorySponsors,
  getSponsorTemplate,
  updateSponsorTemplate,
  deleteSponsorTemplate,
  listOrgTemplates,
  duplicateSavedDesign,
  createMockupGalleryItem,
  listMockupsByTeam,
  getMockupByShareToken,
  getMockupById,
  deleteMockupGalleryItem,
  createCollection,
  getCollection,
  updateCollection,
  deleteCollection,
  listCollectionsForOrg,
  listCollectionsForDepartment,
  addCollectionItem,
  listCollectionItems,
  removeCollectionItem,
  assignCollectionToDepartment,
  unassignCollectionFromDepartment,
  listAssignmentsForCollection,
  assignSponsorToProduct,
  unassignSponsorFromProduct,
  listProductsBySponsor,
  listSponsorsByProduct,
  listAssignedProductIdsForSponsor,
  syncSponsorProducts,
  createMockupApproval,
  getMockupApprovalByToken,
  listMockupApprovalsByMockup,
  listMockupApprovalsBySponsor,
  listPendingApprovalsBySponsor,
  reviewMockupApproval,
  getApprovalStatusForMockup,
  createSponsorInvitation,
  getSponsorInvitationByToken,
  listSponsorInvitations,
  completeSponsorInvitation,
  getUserById,
  setUserTotpSecret,
  enableUserTotp,
  disableUserTotp,
  updateUserBackupCodes,
  listAllOrganizations,
  getAdminDashboardStats,
  createOrgMember,
  getOrgMemberById,
  listOrgMembers,
  listOrgMembersByDepartment,
  listOrgMembersByTeam,
  updateOrgMember,
  deleteOrgMember,
  bulkCreateOrgMembers,
  countOrgMembers,
  listDepartmentSuppliers,
  listSuppliersByDepartment,
  getDepartmentSupplierById,
  createDepartmentSupplier,
  updateDepartmentSupplier,
  deleteDepartmentSupplier,
  createDesignTemplate,
  listDesignTemplates,
  getDesignTemplateById,
  deleteDesignTemplate,
  updateDesignTemplate,
  createTemplateApproval,
  getTemplateApprovalById,
  listApprovalsByTemplate,
  listPendingApprovalsForUser,
  updateTemplateApproval,
  setDesignTemplateApprovalStatus,
  createTemplatePoll,
  getTemplatePollById,
  listPollsByTeam,
  updateTemplatePoll,
  createPollOption,
  listPollOptions,
  createPollVote,
  listVotesByPoll,
  hasUserVoted,
  getPollResults,
  createBetaFeedback,
  listBetaFeedback,
  countBetaFeedbackByPage,
  updateBetaFeedbackStatus,
  deleteBetaFeedback,
} from "./db";
import { storagePut, storageGet } from "./storage";
import {
  generateAllPrintSheets,
  fillZonesForPlayer,
  type PrintSheetConfig,
  type PrintZone,
  type PlayerPrintData,
  type PrintJobConfig,
} from "./printSheet";
import {
  getSizeDimensions,
  getAvailableSizes,
  genderFromTeamCategory,
  type SizeCode,
  type SportCode,
  type GenderCode,
} from "../shared/sizeCharts";
import { createLocalUser, generatePassword } from "./localUserHelpers";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { notifyOwner } from "./_core/notification";
import {
  generateTotpSecret,
  generateQrCodeDataUrl,
  verifyTotpToken,
  generateBackupCodes,
  verifyBackupCode,
} from "./twoFactor";

// Shared zone schema for reuse
const zonePurpose = z.enum(["logo", "clubLogo", "playerName", "playerNumber", "playerInitials", "clubName", "abbreviation", "coordinates", "hashtag", "flag", "qrCode", "sponsor", "custom"]);
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
      // Eingeloggte User sehen alle Produkte, nicht-eingeloggte nur veröffentlichte
      const publishedOnly = !ctx.user;
      return listProducts(publishedOnly);
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const product = await getProductById(input.id);
        if (!product) return null;
        // Unveröffentlichte Produkte: nur für eingeloggte User sichtbar
        if (!product.published && !ctx.user) return null;
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

    create: protectedProcedure
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
    createFromTemplate: protectedProcedure
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

    update: protectedProcedure
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

    delete: protectedProcedure
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

    create: protectedProcedure
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

    update: protectedProcedure
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

    delete: protectedProcedure
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

    create: protectedProcedure
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

    update: protectedProcedure
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
          // Regel-Felder
          minWidthCm: z.number().nullable().optional(),
          maxWidthCm: z.number().nullable().optional(),
          minHeightCm: z.number().nullable().optional(),
          maxHeightCm: z.number().nullable().optional(),
          maxAreaCm2: z.number().nullable().optional(),
          required: z.boolean().optional(),
          allowedFonts: z.array(z.string()).nullable().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateZone(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteZone(input.id);
        return { success: true };
      }),

    bulkUpdatePositions: protectedProcedure
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
        // Bei Trikots: clubLogo-Zonen dürfen nur Position ändern (keine Größe/Rotation)
        const tmpl = product.templateId ? TEXTIL_TEMPLATES.find(t => t.id === product.templateId) : null;
        const isTrikot = tmpl?.category === 'Trikot' || product.category === 'Trikot';
        if (isTrikot) {
          const existingZones = await listZonesByProduct(input.productId);
          const clubLogoIds = new Set(existingZones.filter(z => z.purpose === 'clubLogo').map(z => z.id));
          const protectedZones = input.zones.map(z => {
            if (clubLogoIds.has(z.id)) {
              const original = existingZones.find(ez => ez.id === z.id)!;
              return { ...z, width: original.width, height: original.height, rotation: original.rotation ?? 0 };
            }
            return z;
          });
          await bulkUpdateZones(protectedZones);
        } else {
          await bulkUpdateZones(input.zones);
        }
        return { success: true };
      }),
  }),

  // ─── Organizations ───────────────────────────────────────────────────────────
  org: router({
    /** Alle Organisationen des angemeldeten Benutzers */
    list: protectedProcedure.query(async ({ ctx }) => {
      return listOrganizationsByUser(ctx.user.id);
    }),

    /** Organisation erstellen (jeder eingeloggte Benutzer) */
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        type: z.enum(["verein", "firma"]).default("verein"),
        state: z.string().max(5).optional(),
        sport: z.string().max(50).optional(),
        street: z.string().max(255).optional(),
        zip: z.string().max(10).optional(),
        city: z.string().max(255).optional(),
        country: z.string().max(100).optional(),
        officialName: z.string().max(500).optional(),
        contactFirstName: z.string().max(100).optional(),
        contactLastName: z.string().max(100).optional(),
        contactRole: z.string().max(100).optional(),
        phone: z.string().max(50).optional(),
        email: z.string().max(255).optional(),
        website: z.string().max(500).optional(),
        fax: z.string().max(50).optional(),
        registerNumber: z.string().max(100).optional(),
        taxId: z.string().max(50).optional(),
        foundedYear: z.number().int().min(1800).max(2100).optional().nullable(),
        hashtag: z.string().max(100).optional(),
        primaryColor: z.string().max(7).optional(),
        secondaryColor: z.string().max(7).optional(),
        primaryColorCmyk: z.string().max(50).optional(),
        secondaryColorCmyk: z.string().max(50).optional(),
        jerseyName: z.string().max(255).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const orgId = await createOrganization({
          name: input.name,
          type: input.type,
          state: input.state || null,
          sport: input.sport || null,
          street: input.street || null,
          zip: input.zip || null,
          city: input.city || null,
          country: input.country || "Deutschland",
          officialName: input.officialName || null,
          contactFirstName: input.contactFirstName || null,
          contactLastName: input.contactLastName || null,
          contactRole: input.contactRole || null,
          phone: input.phone || null,
          email: input.email || null,
          website: input.website || null,
          fax: input.fax || null,
          registerNumber: input.registerNumber || null,
          taxId: input.taxId || null,
          foundedYear: input.foundedYear || null,
          hashtag: input.hashtag || null,
          primaryColor: input.primaryColor || null,
          secondaryColor: input.secondaryColor || null,
          primaryColorCmyk: input.primaryColorCmyk || null,
          secondaryColorCmyk: input.secondaryColorCmyk || null,
          jerseyName: input.jerseyName || null,
          ownerId: ctx.user.id,
        });
        // Ersteller als Owner-Mitglied hinzufügen
        await createMembership({
          userId: ctx.user.id,
          orgId,
          role: "owner",
        });
        // Geocoding: Adresse -> Koordinaten
        if (input.street && input.city) {
          try {
            const address = `${input.street}, ${input.zip || ""} ${input.city}, ${input.country || "Deutschland"}`;
            const result = await makeRequest<GeocodingResult>("/maps/api/geocode/json", { address });
            if (result.status === "OK" && result.results.length > 0) {
              const loc = result.results[0].geometry.location;
              await updateOrganization(orgId, { latitude: loc.lat, longitude: loc.lng });
            }
          } catch (e) {
            console.warn("[Org] Geocoding fehlgeschlagen:", e);
          }
        }
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
        street: z.string().max(255).optional(),
        zip: z.string().max(10).optional(),
        city: z.string().max(255).optional(),
        country: z.string().max(100).optional(),
        officialName: z.string().max(500).optional(),
        contactFirstName: z.string().max(100).optional(),
        contactLastName: z.string().max(100).optional(),
        contactRole: z.string().max(100).optional(),
        phone: z.string().max(50).optional(),
        email: z.string().max(255).optional(),
        website: z.string().max(500).optional(),
        fax: z.string().max(50).optional(),
        registerNumber: z.string().max(100).optional(),
        taxId: z.string().max(50).optional(),
        foundedYear: z.number().int().min(1800).max(2100).optional().nullable(),
        hashtag: z.string().max(100).optional(),
        primaryColor: z.string().max(7).optional(),
        secondaryColor: z.string().max(7).optional(),
        primaryColorCmyk: z.string().max(50).optional(),
        secondaryColorCmyk: z.string().max(50).optional(),
        jerseyName: z.string().max(255).optional(),
        onboardingComplete: z.boolean().optional(),
        supplierBrand: z.string().max(100).optional().nullable(),
        supplierScope: z.enum(["ganzer_verein", "nur_sparten", "nur_trikots", "alle_artikel"]).optional().nullable(),
        supplierContractStart: z.string().optional().nullable(),
        supplierContractEnd: z.string().optional().nullable(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Onboarding-Abschluss darf jeder Org-Mitglied (Farben, Logo, jerseyName, onboardingComplete)
        const onboardingOnlyFields = ["primaryColor", "secondaryColor", "primaryColorCmyk", "secondaryColorCmyk", "jerseyName", "onboardingComplete"];
        const inputKeys = Object.keys(input).filter(k => k !== "id" && input[k as keyof typeof input] !== undefined);
        const isOnboardingOnly = inputKeys.every(k => onboardingOnlyFields.includes(k));
        if (isOnboardingOnly) {
          // Jedes Org-Mitglied darf Onboarding abschließen
          await requireOrgMember(ctx.user.id, input.id);
        } else {
          // Volle Bearbeitung nur für Owner
          await requireOrgOwner(ctx.user.id, input.id);
        }
        const { id, supplierContractStart, supplierContractEnd, ...rest } = input;
        const data: Record<string, any> = { ...rest };
        if (supplierContractStart !== undefined) {
          data.supplierContractStart = supplierContractStart ? new Date(supplierContractStart) : null;
        }
        if (supplierContractEnd !== undefined) {
          data.supplierContractEnd = supplierContractEnd ? new Date(supplierContractEnd) : null;
        }
        await updateOrganization(id, data);
        // Geocoding: Adresse -> Koordinaten (wenn Adresse geändert)
        if (input.street || input.city) {
          try {
            const org = await getOrganizationById(id);
            const street = input.street || org?.street || "";
            const zip = input.zip || org?.zip || "";
            const city = input.city || org?.city || "";
            const country = input.country || org?.country || "Deutschland";
            if (street && city) {
              const address = `${street}, ${zip} ${city}, ${country}`;
              const result = await makeRequest<GeocodingResult>("/maps/api/geocode/json", { address });
              if (result.status === "OK" && result.results.length > 0) {
                const loc = result.results[0].geometry.location;
                await updateOrganization(id, { latitude: loc.lat, longitude: loc.lng });
              }
            }
          } catch (e) {
            console.warn("[Org] Geocoding fehlgeschlagen:", e);
          }
        }
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

  // ─── Department Suppliers (Ausrüster pro Sparte) ─────────────────────────
  departmentSupplier: router({
    /** Alle Ausrüster einer Organisation (über alle Sparten) */
    listByOrg: protectedProcedure
      .input(z.object({ orgId: z.number() }))
      .query(async ({ input, ctx }) => {
        await requireOrgMember(ctx.user.id, input.orgId);
        return listDepartmentSuppliers(input.orgId);
      }),

    /** Ausrüster einer bestimmten Sparte */
    listByDepartment: protectedProcedure
      .input(z.object({ departmentId: z.number(), orgId: z.number() }))
      .query(async ({ input, ctx }) => {
        await requireOrgMember(ctx.user.id, input.orgId);
        return listSuppliersByDepartment(input.departmentId);
      }),

    /** Ausrüster einer Sparte zuweisen (Owner oder Spartenleiter) */
    create: protectedProcedure
      .input(z.object({
        departmentId: z.number(),
        orgId: z.number(),
        brand: z.string().min(1).max(100),
        scope: z.enum(["alle_artikel", "nur_trikots"]).default("alle_artikel"),
        contractStart: z.date().optional().nullable(),
        contractEnd: z.date().optional().nullable(),
      }))
      .mutation(async ({ input, ctx }) => {
        await requireDepartmentLead(ctx.user.id, input.orgId, input.departmentId);
        const result = await createDepartmentSupplier({
          ...input,
          contractStart: input.contractStart || null,
          contractEnd: input.contractEnd || null,
          createdBy: ctx.user.id,
        });
        return result;
      }),

    /** Ausrüster aktualisieren (Owner oder Spartenleiter) */
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        orgId: z.number(),
        brand: z.string().min(1).max(100).optional(),
        scope: z.enum(["alle_artikel", "nur_trikots"]).optional(),
        contractStart: z.date().optional().nullable(),
        contractEnd: z.date().optional().nullable(),
      }))
      .mutation(async ({ input, ctx }) => {
        const supplier = await getDepartmentSupplierById(input.id);
        if (!supplier) throw new TRPCError({ code: "NOT_FOUND" });
        await requireDepartmentLead(ctx.user.id, input.orgId, supplier.departmentId);
        const { id, orgId, ...data } = input;
        await updateDepartmentSupplier(id, data);
        return { success: true };
      }),

    /** Ausrüster-Zuordnung löschen (Owner oder Spartenleiter) */
    delete: protectedProcedure
      .input(z.object({ id: z.number(), orgId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const supplier = await getDepartmentSupplierById(input.id);
        if (!supplier) throw new TRPCError({ code: "NOT_FOUND" });
        await requireDepartmentLead(ctx.user.id, input.orgId, supplier.departmentId);
        await deleteDepartmentSupplier(input.id);
        return { success: true };
      }),
  }),

  // ─── Design Templates (Vorlagen-System) ───────────────────────────────────
  designTemplate: router({
    /** Vorlagen auflisten (sichtbar für den Benutzer) */
    list: protectedProcedure
      .input(z.object({
        orgId: z.number(),
        departmentId: z.number().optional(),
        teamId: z.number().optional(),
      }))
      .query(async ({ input, ctx }) => {
        // Rolle des Users in der Org ermitteln für Freigabe-Sichtbarkeit
        const membership = await getMembershipByUserAndOrg(ctx.user.id, input.orgId);
        const userRole = membership?.role || "trainer";
        return listDesignTemplates(input.orgId, ctx.user.id, input.departmentId, input.teamId, userRole);
      }),

    /** Einzelne Vorlage laden */
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getDesignTemplateById(input.id);
      }),

    /** Neue Vorlage erstellen (alle Vereinsmitglieder dürfen) */
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        imageUrl: z.string(),
        storageKey: z.string().optional(),
        positionsConfig: z.any().optional(),
        orgId: z.number(),
        departmentId: z.number().optional(),
        teamId: z.number().optional(),
        sport: z.enum(["fussball", "handball", "volleyball", "basketball"]).optional(),
        category: z.enum(["Trikot", "Bekleidung"]).optional(),
        visibility: z.enum(["private", "team", "department", "org"]).default("team"),
        // Optional: Zonen auf ein bestehendes Produkt übertragen
        productId: z.number().optional(),
        zones: z.array(z.object({
          name: z.string(),
          purpose: z.string(),
          x: z.number(),
          y: z.number(),
          width: z.number(),
          height: z.number(),
          side: z.enum(["front", "back"]).optional(),
          fontColor: z.string().optional(),
          fontWeight: z.string().optional(),
          fontSize: z.number().optional(),
          fontFamily: z.string().optional(),
          textStyle: z.enum(["arc", "straight"]).optional(),
          arcDegree: z.number().optional(),
          outlineColor: z.string().optional(),
          outlineWidth: z.number().optional(),
        })).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Sportart ist Pflicht bei Trikots
        if (input.category === "Trikot" && !input.sport) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Bei Trikots muss eine Sportart angegeben werden.",
          });
        }
        const { productId, zones, ...templateData } = input;
        const id = await createDesignTemplate({
          ...templateData,
          createdByUserId: ctx.user.id,
        });

        // Zonen auf das ausgewählte Produkt übertragen
        if (productId && zones && zones.length > 0) {
          const parts = await listPartsByProduct(productId);
          for (const zone of zones) {
            // Part anhand der Seite zuordnen: front → vorderteil/front, back → rueckteil/back
            const side = zone.side || "front";
            const matchingPart = parts.find((p) => {
              const key = p.key.toLowerCase();
              if (side === "front") return key.includes("vorder") || key.includes("front");
              if (side === "back") return key.includes("rueck") || key.includes("back") || key.includes("rück");
              return false;
            });
            // Purpose-Mapping: TemplateUpload purpose → DB purpose
            const purposeMap: Record<string, string> = {
              logo: "logo",
              clubLogo: "clubLogo",
              playerName: "playerName",
              playerNumber: "playerNumber",
              clubName: "clubName",
              sponsor: "custom",
              abbreviation: "abbreviation",
              custom: "custom",
            };
            const dbPurpose = purposeMap[zone.purpose] || "custom";
            // Zone-Typ bestimmen
            const textPurposes = ["playerName", "playerNumber", "clubName", "abbreviation"];
            const imagePurposes = ["logo", "clubLogo"];
            let zoneType: "image" | "text" | "both" = "both";
            if (textPurposes.includes(dbPurpose)) zoneType = "text";
            else if (imagePurposes.includes(dbPurpose)) zoneType = "image";

            await createZone({
              productId,
              partId: matchingPart?.id ?? null,
              label: zone.name,
              side,
              type: zoneType,
              purpose: dbPurpose as any,
              posX: zone.x,
              posY: zone.y,
              width: zone.width,
              height: zone.height,
              rotation: 0,
              fontColor: zone.fontColor || null,
              fontWeight: zone.fontWeight || null,
              fontSize: zone.fontSize || null,
              fontFamily: zone.fontFamily || null,
              textStyle: (zone.textStyle as any) || null,
              arcDegree: zone.arcDegree || null,
              outlineColor: zone.outlineColor || null,
              outlineWidth: zone.outlineWidth || null,
              sortOrder: 0,
            });
          }
        }

        return { id };
      }),

    /** Vorlage aktualisieren (nur Ersteller) */
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        positionsConfig: z.any().optional(),
        visibility: z.enum(["private", "team", "department", "org"]).optional(),
        sport: z.enum(["fussball", "handball", "volleyball", "basketball"]).optional(),
        category: z.enum(["Trikot", "Bekleidung"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const tmpl = await getDesignTemplateById(input.id);
        if (!tmpl) throw new TRPCError({ code: "NOT_FOUND" });
        if (tmpl.createdByUserId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Nur der Ersteller kann die Vorlage bearbeiten." });
        }
        const { id, ...data } = input;
        await updateDesignTemplate(id, data);
        return { success: true };
      }),

    /** Vorlage löschen (nur Ersteller) */
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const tmpl = await getDesignTemplateById(input.id);
        if (!tmpl) throw new TRPCError({ code: "NOT_FOUND" });
        if (tmpl.createdByUserId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Nur der Ersteller kann die Vorlage löschen." });
        }
        await deleteDesignTemplate(input.id);
        return { success: true };
      }),

    /** Vorlage als JSON exportieren */
    export: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const tmpl = await getDesignTemplateById(input.id);
        if (!tmpl) throw new TRPCError({ code: "NOT_FOUND" });
        // Zonen des zugeordneten Produkts laden (falls vorhanden)
        const config = tmpl.positionsConfig as any;
        const productId = config?.productId;
        let zones: any[] = [];
        if (productId) {
          const productZones = await listZonesByProduct(productId);
          zones = productZones.map(z => ({
            label: z.label,
            purpose: z.purpose,
            type: z.type,
            side: z.side,
            posX: z.posX,
            posY: z.posY,
            width: z.width,
            height: z.height,
            rotation: z.rotation,
            fontFamily: z.fontFamily,
            fontWeight: z.fontWeight,
            fontSize: z.fontSize,
            fontColor: z.fontColor,
            textAlign: z.textAlign,
            textStyle: z.textStyle,
            arcDegree: z.arcDegree,
            outlineColor: z.outlineColor,
            outlineWidth: z.outlineWidth,
            widthCm: z.widthCm,
            heightCm: z.heightCm,
            minWidthCm: z.minWidthCm,
            maxWidthCm: z.maxWidthCm,
            minHeightCm: z.minHeightCm,
            maxHeightCm: z.maxHeightCm,
            maxAreaCm2: z.maxAreaCm2,
            required: z.required,
          }));
        }
        return {
          version: "1.0",
          name: tmpl.name,
          description: tmpl.description,
          sport: tmpl.sport,
          category: tmpl.category,
          imageUrl: tmpl.imageUrl,
          zones,
          exportedAt: new Date().toISOString(),
        };
      }),

    /** Vorlage aus JSON importieren */
    import: protectedProcedure
      .input(z.object({
        orgId: z.number(),
        departmentId: z.number().optional(),
        teamId: z.number().optional(),
        templateJson: z.object({
          name: z.string(),
          description: z.string().nullable().optional(),
          sport: z.enum(["fussball", "handball", "volleyball", "basketball"]).nullable().optional(),
          category: z.enum(["Trikot", "Bekleidung"]).nullable().optional(),
          imageUrl: z.string(),
          zones: z.array(z.object({
            label: z.string(),
            purpose: z.string(),
            type: z.string().optional(),
            side: z.string().optional(),
            posX: z.number(),
            posY: z.number(),
            width: z.number(),
            height: z.number(),
            rotation: z.number().optional(),
            fontFamily: z.string().nullable().optional(),
            fontWeight: z.string().nullable().optional(),
            fontSize: z.number().nullable().optional(),
            fontColor: z.string().nullable().optional(),
            textAlign: z.string().nullable().optional(),
            textStyle: z.string().nullable().optional(),
            arcDegree: z.number().nullable().optional(),
            outlineColor: z.string().nullable().optional(),
            outlineWidth: z.number().nullable().optional(),
            widthCm: z.number().nullable().optional(),
            heightCm: z.number().nullable().optional(),
            minWidthCm: z.number().nullable().optional(),
            maxWidthCm: z.number().nullable().optional(),
            minHeightCm: z.number().nullable().optional(),
            maxHeightCm: z.number().nullable().optional(),
            maxAreaCm2: z.number().nullable().optional(),
            required: z.boolean().nullable().optional(),
          })).optional(),
        }),
        visibility: z.enum(["private", "team", "department", "org"]).default("team"),
      }))
      .mutation(async ({ input, ctx }) => {
        const { templateJson, orgId, departmentId, teamId, visibility } = input;
        const id = await createDesignTemplate({
          name: `${templateJson.name} (Import)`,
          description: templateJson.description || null,
          imageUrl: templateJson.imageUrl,
          sport: templateJson.sport || null,
          category: templateJson.category || "Trikot",
          orgId,
          departmentId: departmentId || null,
          teamId: teamId || null,
          visibility,
          createdByUserId: ctx.user.id,
          positionsConfig: { zones: templateJson.zones || [] },
        });
        return { id, name: templateJson.name };
      }),

    /** KI-Bild-Analyse: Exakte Bounding-Box-Erkennung + Schrifterkennung */
    analyzeImage: protectedProcedure
      .input(z.object({
        imageUrl: z.string(),
        sport: z.enum(["fussball", "handball", "volleyball", "basketball"]).optional(),
        category: z.enum(["Trikot", "Bekleidung"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const { createGridOverlayImage, gridCellsToPercent } = await import("./gridOverlay");

        // Schritt 1: Bild herunterladen und Grid-Overlay erstellen
        let gridImageBase64: string;
        let imageWidth: number;
        let imageHeight: number;
        
        try {
          const response = await fetch(input.imageUrl);
          const imageBuffer = Buffer.from(await response.arrayBuffer());
          const gridResult = await createGridOverlayImage(imageBuffer);
          gridImageBase64 = gridResult.gridImageBase64;
          imageWidth = gridResult.imageWidth;
          imageHeight = gridResult.imageHeight;
        } catch (e) {
          // Fallback: Bild direkt ohne Grid verwenden
          gridImageBase64 = input.imageUrl;
          imageWidth = 800;
          imageHeight = 1000;
        }

        const systemPrompt = `Du bist ein PIXEL-GENAUER Computer-Vision-Analyst für Sportbekleidung.

## GRID-SYSTEM

Das Bild hat ein ROTES RASTER mit Beschriftungen:
- Spalten: A bis J (von links nach rechts, je 10% der Bildbreite)
- Zeilen: 1 bis 10 (von oben nach unten, je 10% der Bildhöhe)

Jede Zelle ist z.B. "A1" (oben links), "J10" (unten rechts), "E5" (Mitte).

## DEINE AUFGABE

Für jedes erkannte Element (Text, Logo, Nummer, Name, Sponsor):
1. Bestimme die START-ZELLE (obere linke Ecke des Elements)
2. Bestimme die END-ZELLE (untere rechte Ecke des Elements)
3. Gib ZUSÄTZLICH eine FEIN-JUSTIERUNG in % innerhalb der Start-Zelle an (0-100%)

## FEIN-JUSTIERUNG (für sub-cell Genauigkeit)

Da jede Zelle 10% des Bildes ist, brauchst du eine Fein-Justierung:
- offsetX: Wie weit ist die linke Kante des Elements INNERHALB der Start-Zelle? (0% = am linken Rand der Zelle, 50% = Mitte, 100% = rechter Rand)
- offsetY: Wie weit ist die obere Kante des Elements INNERHALB der Start-Zelle? (0% = oberer Rand, 50% = Mitte, 100% = unterer Rand)
- endOffsetX: Wie weit reicht das Element INNERHALB der End-Zelle? (0% = linker Rand, 50% = Mitte, 100% = rechter Rand)
- endOffsetY: Wie weit reicht das Element INNERHALB der End-Zelle? (0% = oberer Rand, 50% = Mitte, 100% = unterer Rand)

## SCHRIFTERKENNUNG

Für jeden Text: Welche **Google Font** passt am besten?
- Breite Block-Schriften, bold, condensed → "Bebas Neue", "Anton"
- Kondensierte Bold-Schriften → "Oswald", "Barlow Condensed", "Teko"
- Geometrische Sans-Serif → "Montserrat", "Poppins"
- Sportliche Display-Fonts → "Russo One", "Righteous", "Passion One"

## ELEMENTTYPEN

- playerName: Spielername
- playerNumber: Spielernummer (Brust oder Rücken)
- clubName: Vereinsname
- logo: Vereinswappen/Logo
- sponsor: Sponsor
- abbreviation: Kürzel
- custom: Patch, Badge, Flagge, Herstellerlogo

## DEUTSCHE BEZEICHNUNGEN (PFLICHT)

- "Spielername" / "Rückennummer" / "Brustnummer"
- "Vereinswappen" / "Vereinsname"
- "Sponsor Brust" / "Sponsor Bauch" / "Sponsor Rücken"
- "Herstellerlogo" / "Patch" / "Badge" / "Flagge"

## BEISPIEL

Ein Logo auf der linken Brust, das bei Zelle B2 beginnt und bei C3 endet:
- startCell: "B2", endCell: "C3"
- offsetX: 30 (beginnt 30% innerhalb von Spalte B)
- offsetY: 20 (beginnt 20% innerhalb von Zeile 2)
- endOffsetX: 70 (endet 70% innerhalb von Spalte C)
- endOffsetY: 80 (endet 80% innerhalb von Zeile 3)`;

        // Schritt 2: LLM mit Grid-Overlay-Bild aufrufen
        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: { url: gridImageBase64, detail: "high" },
                },
                {
                  type: "text",
                  text: `Analysiere dieses ${input.category || "Sportbekleidungs"}-Bild${input.sport ? " (Sportart: " + input.sport + ")" : ""}.

Das Bild hat ein ROTES RASTER (Grid) mit Zellen A1-J10.
Nutze das Raster um die EXAKTE Position jedes Elements anzugeben.

Für jedes Element:
1. In welcher Zelle beginnt die OBERE LINKE Ecke? (startCell)
2. In welcher Zelle endet die UNTERE RECHTE Ecke? (endCell)
3. Fein-Justierung: Wo genau innerhalb der Start/End-Zelle? (offsetX/Y, endOffsetX/Y in %)
4. Welche Google Font passt zur Schrift?

Sei EXTREM PRÄZISE mit den Zellen! Schau dir das Raster genau an.
Liefere NUR Elemente die du SICHER erkennst.`,
                },
              ],
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "grid_zone_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  zones: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Deutscher Name der Zone" },
                        purpose: { type: "string", enum: ["playerName", "playerNumber", "clubName", "logo", "sponsor", "abbreviation", "custom"] },
                        startCell: { type: "string", description: "Grid-Zelle der oberen linken Ecke (z.B. 'B2')" },
                        endCell: { type: "string", description: "Grid-Zelle der unteren rechten Ecke (z.B. 'D4')" },
                        offsetX: { type: "number", description: "Fein-Justierung X in Start-Zelle (0-100%)" },
                        offsetY: { type: "number", description: "Fein-Justierung Y in Start-Zelle (0-100%)" },
                        endOffsetX: { type: "number", description: "Fein-Justierung X in End-Zelle (0-100%)" },
                        endOffsetY: { type: "number", description: "Fein-Justierung Y in End-Zelle (0-100%)" },
                        side: { type: "string", enum: ["front", "back"] },
                        textStyle: { type: "string", enum: ["arc", "straight"] },
                        arcDegree: { type: "number" },
                        fontColor: { type: "string", description: "HEX Farbe" },
                        outlineColor: { type: "string", description: "HEX oder 'none'" },
                        outlineWidth: { type: "number" },
                        fontFamily: { type: "string", description: "Google Font Name" },
                        fontWeight: { type: "string", enum: ["normal", "bold"] },
                        fontSize: { type: "number", description: "Füllung der Zonenhöhe in %" },
                      },
                      required: ["name", "purpose", "startCell", "endCell", "offsetX", "offsetY", "endOffsetX", "endOffsetY", "side", "textStyle", "arcDegree", "fontColor", "outlineColor", "outlineWidth", "fontFamily", "fontWeight", "fontSize"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["zones"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message?.content;
        if (!content || typeof content !== "string") {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "KI-Analyse fehlgeschlagen" });
        }

        try {
          const parsed = JSON.parse(content);
          const rawZones = parsed.zones || [];
          
          // Schritt 3: Grid-Zellen in Prozent-Koordinaten umrechnen
          const colLabels = "ABCDEFGHIJ";
          const validatedZones = rawZones.map((z: any) => {
            // Parse start and end cells
            const startCol = colLabels.indexOf(z.startCell[0].toUpperCase());
            const startRow = parseInt(z.startCell.slice(1)) - 1;
            const endCol = colLabels.indexOf(z.endCell[0].toUpperCase());
            const endRow = parseInt(z.endCell.slice(1)) - 1;
            
            if (startCol < 0 || endCol < 0 || startRow < 0 || endRow < 0) {
              return null;
            }
            
            // Berechne exakte Prozent-Position mit Fein-Justierung
            const cellPercent = 10; // Jede Zelle = 10%
            const x = startCol * cellPercent + (z.offsetX / 100) * cellPercent;
            const y = startRow * cellPercent + (z.offsetY / 100) * cellPercent;
            const endX = endCol * cellPercent + (z.endOffsetX / 100) * cellPercent;
            const endY = endRow * cellPercent + (z.endOffsetY / 100) * cellPercent;
            const width = endX - x;
            const height = endY - y;
            
            return {
              name: z.name,
              purpose: z.purpose,
              x: Math.round(Math.max(0, Math.min(95, x)) * 10) / 10,
              y: Math.round(Math.max(0, Math.min(95, y)) * 10) / 10,
              width: Math.round(Math.max(3, Math.min(100, width)) * 10) / 10,
              height: Math.round(Math.max(3, Math.min(100, height)) * 10) / 10,
              side: z.side,
              textStyle: z.textStyle,
              arcDegree: z.arcDegree,
              fontColor: z.fontColor,
              outlineColor: z.outlineColor,
              outlineWidth: z.outlineWidth,
              fontFamily: z.fontFamily,
              fontWeight: z.fontWeight,
              fontSize: z.fontSize,
            };
          }).filter((z: any) => z !== null && z.width > 0 && z.height > 0);
          
          return { zones: validatedZones };
        } catch {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "KI-Antwort konnte nicht verarbeitet werden" });
        }
      }),

    /** Marken-Trikot analysieren: Naht-Erkennung, Panel-Zerlegung, Druckbereiche */
    analyzeJersey: protectedProcedure
      .input(z.object({
        imageUrl: z.string(),
        sport: z.enum(["fussball", "handball", "volleyball", "basketball"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");

        const systemPrompt = `Du bist ein Experte für Sportbekleidungs-Analyse und Textildruck.

## AUFGABE
Analysiere das hochgeladene Foto eines Marken-Trikots (z.B. Nike, Adidas, Puma) und identifiziere:

1. **PANELS (Schnittteile)**: Erkenne die einzelnen Panels des Trikots
   - Vorderteil (front)
   - Rückenteil (back)
   - Ärmel links (sleeve_left)
   - Ärmel rechts (sleeve_right)
   - Kragen (collar) - falls sichtbar
   - Seitenstreifen (side_panel) - falls vorhanden

2. **NÄHTE**: Erkenne alle sichtbaren Nähte und gib ihre Position als Linie an
   - Schulternähte
   - Seitennähte
   - Ärmelnähte
   - Kragennähte
   - Einsätze/Paspeln

3. **DRUCKBEREICHE**: Definiere die sicheren Druckbereiche (mind. 2cm Abstand von Nähten)
   - Brust (links/rechts/mitte)
   - Bauch
   - Rücken oben (Schulterblatt)
   - Rücken mitte (Nummer)
   - Rücken unten (Name)
   - Ärmel

4. **MARKE**: Erkenne den Hersteller und das Modell (falls möglich)

Alle Positionen in PROZENT des Bildbereichs (0-100).
Nähte als Linien (x1,y1 -> x2,y2).
Panels und Druckbereiche als Rechtecke (x, y, width, height).`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: { url: input.imageUrl, detail: "high" },
                },
                {
                  type: "text",
                  text: `Analysiere dieses Markentrikot-Foto${input.sport ? " (Sportart: " + input.sport + ")" : ""}.
Erkenne alle Panels, Nähte und sichere Druckbereiche.
Gib alle Positionen in Prozent des sichtbaren Bildbereichs an.`,
                },
              ],
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "jersey_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  brand: { type: "string", description: "Erkannter Hersteller (z.B. Nike, Adidas, Puma, unbekannt)" },
                  model: { type: "string", description: "Erkanntes Modell (z.B. Dri-FIT ADV, Tiro 24, oder unbekannt)" },
                  panels: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        key: { type: "string", description: "Panel-ID: front, back, sleeve_left, sleeve_right, collar, side_panel" },
                        label: { type: "string", description: "Deutsche Bezeichnung" },
                        x: { type: "number", description: "X-Position in %" },
                        y: { type: "number", description: "Y-Position in %" },
                        width: { type: "number", description: "Breite in %" },
                        height: { type: "number", description: "Höhe in %" },
                        visible: { type: "boolean", description: "Ist das Panel auf dem Foto sichtbar?" },
                      },
                      required: ["key", "label", "x", "y", "width", "height", "visible"],
                      additionalProperties: false,
                    },
                  },
                  seams: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        label: { type: "string", description: "Naht-Bezeichnung (z.B. Schulternaht links)" },
                        x1: { type: "number", description: "Start X in %" },
                        y1: { type: "number", description: "Start Y in %" },
                        x2: { type: "number", description: "Ende X in %" },
                        y2: { type: "number", description: "Ende Y in %" },
                      },
                      required: ["label", "x1", "y1", "x2", "y2"],
                      additionalProperties: false,
                    },
                  },
                  printAreas: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        label: { type: "string", description: "Druckbereich-Bezeichnung" },
                        purpose: { type: "string", description: "Empfohlene Nutzung: sponsor, clubLogo, playerNumber, playerName, custom" },
                        x: { type: "number", description: "X-Position in % (2cm Abstand von Nähten)" },
                        y: { type: "number", description: "Y-Position in %" },
                        width: { type: "number", description: "Breite in %" },
                        height: { type: "number", description: "Höhe in %" },
                        maxWidthCm: { type: "number", description: "Empfohlene max. Breite in cm" },
                        maxHeightCm: { type: "number", description: "Empfohlene max. Höhe in cm" },
                      },
                      required: ["label", "purpose", "x", "y", "width", "height", "maxWidthCm", "maxHeightCm"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["brand", "model", "panels", "seams", "printAreas"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message?.content;
        if (!content || typeof content !== "string") {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "KI-Analyse fehlgeschlagen" });
        }

        try {
          return JSON.parse(content);
        } catch {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "KI-Antwort konnte nicht verarbeitet werden" });
        }
      }),
  }),

  // ─── Freigabe-Workflow (Template Approvals) ────────────────────────────
  templateApproval: router({
    /** Vorlage zur Freigabe einreichen (Trainer → Spartenleiter/Owner + Sponsoren) */
    submitForApproval: protectedProcedure
      .input(z.object({
        templateId: z.number(),
        approvers: z.array(z.object({
          type: z.enum(["department_lead", "owner", "sponsor"]),
          userId: z.number().optional(),
          sponsorId: z.number().optional(),
        })),
        message: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await setDesignTemplateApprovalStatus(input.templateId, "pending");

        for (const a of input.approvers) {
          await createTemplateApproval({
            templateId: input.templateId,
            approverType: a.type as "department_lead" | "owner" | "sponsor",
            approverUserId: a.userId || null,
            sponsorId: a.sponsorId || null,
          });
        }

        return { success: true, pendingCount: input.approvers.length };
      }),

    /** Genehmigung erteilen oder ablehnen */
    decide: protectedProcedure
      .input(z.object({
        approvalId: z.number(),
        decision: z.enum(["approved", "rejected"]),
        comment: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await updateTemplateApproval(input.approvalId, {
          status: input.decision,
          comment: input.comment || null,
          decidedAt: new Date(),
        });

        const approval = await getTemplateApprovalById(input.approvalId);
        if (!approval) throw new TRPCError({ code: "NOT_FOUND" });

        const allApprovals = await listApprovalsByTemplate(approval.templateId);
        const allApproved = allApprovals.every(a => a.status === "approved");
        const anyRejected = allApprovals.some(a => a.status === "rejected");

        if (allApproved) {
          await setDesignTemplateApprovalStatus(approval.templateId, "approved");
        } else if (anyRejected) {
          await setDesignTemplateApprovalStatus(approval.templateId, "rejected");
        }

        return { success: true, templateStatus: allApproved ? "approved" : anyRejected ? "rejected" : "pending" };
      }),

    /** Alle ausstehenden Freigaben für den aktuellen Benutzer */
    pendingForMe: protectedProcedure
      .input(z.object({ orgId: z.number() }))
      .query(async ({ input, ctx }) => {
        const pending = await listPendingApprovalsForUser(ctx.user.id);
        const results = [];
        for (const p of pending) {
          const template = await getDesignTemplateById(p.templateId);
          if (template) {
            results.push({ ...p, template });
          }
        }
        return results;
      }),

    /** Freigabe-Status einer Vorlage abfragen */
    statusForTemplate: protectedProcedure
      .input(z.object({ templateId: z.number() }))
      .query(async ({ input }) => {
        return listApprovalsByTemplate(input.templateId);
      }),
  }),

  // ─── Mannschafts-Abstimmung (Template Polls) ─────────────────────────
  templatePoll: router({
    /** Neue Abstimmung erstellen (Trainer teilt Vorlagen mit Mannschaft) */
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        teamId: z.number(),
        orgId: z.number(),
        templateIds: z.array(z.number()).min(1),
        expiresAt: z.date().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const pollId = await createTemplatePoll({
          title: input.title,
          description: input.description || null,
          teamId: input.teamId,
          orgId: input.orgId,
          createdByUserId: ctx.user.id,
          expiresAt: input.expiresAt || null,
        });

        // Optionen erstellen (eine pro Vorlage)
        for (const templateId of input.templateIds) {
          const template = await getDesignTemplateById(templateId);
          await createPollOption({
            pollId,
            templateId,
            label: template?.name || `Vorlage ${templateId}`,
          });
        }

        return { success: true, pollId };
      }),

    /** Abstimmung abschließen */
    close: protectedProcedure
      .input(z.object({ pollId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await updateTemplatePoll(input.pollId, { status: "closed" });
        return { success: true };
      }),

    /** Stimme abgeben */
    vote: protectedProcedure
      .input(z.object({
        pollId: z.number(),
        optionId: z.number(),
        comment: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Prüfe ob bereits abgestimmt
        const alreadyVoted = await hasUserVoted(input.pollId, ctx.user.id);
        if (alreadyVoted) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Du hast bereits abgestimmt" });
        }

        await createPollVote({
          pollId: input.pollId,
          optionId: input.optionId,
          userId: ctx.user.id,
          comment: input.comment || null,
        });

        return { success: true };
      }),

    /** Abstimmungen für eine Mannschaft auflisten */
    listByTeam: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input }) => {
        return listPollsByTeam(input.teamId);
      }),

    /** Ergebnisse einer Abstimmung */
    results: protectedProcedure
      .input(z.object({ pollId: z.number() }))
      .query(async ({ input }) => {
        const poll = await getTemplatePollById(input.pollId);
        if (!poll) throw new TRPCError({ code: "NOT_FOUND" });
        const results = await getPollResults(input.pollId);
        const votes = await listVotesByPoll(input.pollId);
        return { poll, options: results, totalVotes: votes.length };
      }),

    /** Prüfe ob der aktuelle User bereits abgestimmt hat */
    hasVoted: protectedProcedure
      .input(z.object({ pollId: z.number() }))
      .query(async ({ input, ctx }) => {
        return hasUserVoted(input.pollId, ctx.user.id);
      }),
  }),

  // ─── Memberships (Mitgliedschaften) ───────────────────────────────────────
  membership: router({
    /** Alle Mitgliedschaften des aktuellen Benutzers (für Auto-Zuweisung im Konfigurator) */
    mine: protectedProcedure.query(async ({ ctx }) => {
      return listMembershipsByUser(ctx.user.id);
    }),

    /** Alle Mitglieder einer Organisation (gefiltert nach Rolle) */
    listByOrg: protectedProcedure
      .input(z.object({ orgId: z.number() }))
      .query(async ({ input, ctx }) => {
        const membership = await requireOrgMember(ctx.user.id, input.orgId);
        const allMembers = await listMembershipsByOrg(input.orgId);
        // Owner sieht alle
        if (membership.role === "owner") return allMembers;
        // Spartenleiter sieht nur Mitglieder seiner Abteilung + Owner
        if (membership.role === "department_lead" && membership.departmentId) {
          return allMembers.filter(m => m.departmentId === membership.departmentId || m.role === "owner");
        }
        // Trainer sieht nur seine Mannschaftsmitglieder + Owner + seinen SL
        if (membership.role === "trainer" && membership.departmentId) {
          return allMembers.filter(m => m.departmentId === membership.departmentId || m.role === "owner");
        }
        return allMembers;
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

    /** Logo hochladen (Owner, Spartenleiter, oder Trainer beim Onboarding) */
    upload: protectedProcedure
      .input(z.object({
        orgId: z.number(),
        name: z.string().min(1),
        imageBase64: z.string(),
        mimeType: z.string().default("image/png"),
        isDefault: z.boolean().default(false),
      }))
      .mutation(async ({ input, ctx }) => {
        // Prüfe ob Onboarding noch nicht abgeschlossen ist - dann darf jedes Mitglied Logo hochladen
        const org = await getOrganizationById(input.orgId);
        if (org && !org.onboardingComplete) {
          await requireOrgMember(ctx.user.id, input.orgId);
        } else {
          await requireOrgOwnerOrDeptLead(ctx.user.id, input.orgId);
        }
        // Decode base64 and upload to S3
        const buffer = Buffer.from(input.imageBase64, "base64");
        const key = `org-logos/${input.orgId}/${input.name.replace(/\s+/g, "-").toLowerCase()}`;
        const ext = input.mimeType === "image/png" ? ".png" : input.mimeType === "image/svg+xml" ? ".svg" : input.mimeType === "application/pdf" ? ".pdf" : ".jpg";
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

    /** Alle Mannschaften einer Organisation */
    listByOrg: protectedProcedure
      .input(z.object({ orgId: z.number() }))
      .query(async ({ input, ctx }) => {
        await requireOrgMember(ctx.user.id, input.orgId);
        return listTeamsByOrg(input.orgId);
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

  // ─── Admin Dashboard ───────────────────────────────────────────────────────────────────────────────
  adminDashboard: router({
    /** Statistiken für das Admin-Dashboard */
    stats: adminProcedure.query(async () => {
      return getAdminDashboardStats();
    }),

    /** Alle Organisationen auflisten */
    allOrgs: adminProcedure.query(async () => {
      return listAllOrganizations();
    }),

    /** Alle Produkte auflisten */
    allProducts: adminProcedure.query(async () => {
      return listProducts(false);
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
    /** Alle Sponsor-Vorlagen einer Organisation abrufen (gefiltert nach Rolle) */
    list: protectedProcedure
      .input(z.object({ orgId: z.number() }))
      .query(async ({ input, ctx }) => {
        const membership = await requireOrgMember(ctx.user.id, input.orgId);
        const allSponsors = await listSponsorTemplates(input.orgId);
        // Owner sieht alle Sponsoren
        if (membership.role === "owner") return allSponsors;
        // Spartenleiter sieht: Hauptsponsoren + Spartensponsor seiner Abteilung + Mannschaftssponsoren seiner Abteilung
        if (membership.role === "department_lead" && membership.departmentId) {
          return allSponsors.filter(s =>
            s.sponsorType === "hauptsponsor" ||
            (s.sponsorType === "spartensponsor" && s.departmentId === membership.departmentId) ||
            (s.sponsorType === "mannschaftssponsor" && s.departmentId === membership.departmentId)
          );
        }
        // Trainer sieht: Hauptsponsoren + Spartensponsor seiner Abteilung + Mannschaftssponsoren seiner Mannschaft
        if (membership.role === "trainer") {
          const trainerTeams = await listTeamsByTrainer(ctx.user.id);
          const trainerTeamIds = trainerTeams.map(t => t.id);
          return allSponsors.filter(s =>
            s.sponsorType === "hauptsponsor" ||
            (s.sponsorType === "spartensponsor" && s.departmentId === membership.departmentId) ||
            (s.sponsorType === "mannschaftssponsor" && s.teamId && trainerTeamIds.includes(s.teamId))
          );
        }
        return allSponsors;
      }),

    /** Verpflichtende Sponsoren einer Organisation abrufen */
    mandatory: protectedProcedure
      .input(z.object({ orgId: z.number() }))
      .query(async ({ input }) => {
        return getMandatorySponsors(input.orgId);
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
        sponsorType: z.enum(["hauptsponsor", "spartensponsor", "mannschaftssponsor"]).default("hauptsponsor"),
        obligation: z.enum(["alle_produkte", "nur_trikot", "nicht_verpflichtend"]).default("nicht_verpflichtend"),
        departmentId: z.number().optional(),
        teamId: z.number().optional(),
        // Kontaktdaten
        contactFirstName: z.string().max(100).optional(),
        contactLastName: z.string().max(100).optional(),
        contactEmail: z.string().email().optional(),
        contactPhone: z.string().max(50).optional(),
        // Firmenadresse
        street: z.string().max(255).optional(),
        zip: z.string().max(10).optional(),
        city: z.string().max(100).optional(),
        country: z.string().max(100).optional(),
        // Rechnungsdaten
        vatId: z.string().max(50).optional(),
        billingDifferent: z.boolean().optional(),
        billingStreet: z.string().max(255).optional(),
        billingZip: z.string().max(10).optional(),
        billingCity: z.string().max(100).optional(),
        billingCountry: z.string().max(100).optional(),
        // Sponsoring (nur Owner)
        sponsoringAmount: z.number().optional(),
        contractStart: z.string().optional(),
        contractEnd: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Rollenbasierte Berechtigung prüfen
        const membership = await requireOrgMember(ctx.user.id, input.orgId);
        if (membership.role === "trainer") {
          // Trainer darf nur Mannschaftssponsoren für seine eigene Mannschaft erstellen
          if (input.sponsorType !== "mannschaftssponsor") {
            throw new TRPCError({ code: "FORBIDDEN", message: "Trainer können nur Mannschaftssponsoren erstellen" });
          }
          if (!input.teamId) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Mannschaft muss angegeben werden" });
          }
          const trainerTeams = await listTeamsByTrainer(ctx.user.id);
          if (!trainerTeams.some(t => t.id === input.teamId)) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Sie können nur Sponsoren für Ihre eigene Mannschaft erstellen" });
          }
        } else if (membership.role === "department_lead") {
          // Spartenleiter darf Spartensponsor + Mannschaftssponsoren seiner Abteilung erstellen
          if (input.sponsorType === "hauptsponsor") {
            throw new TRPCError({ code: "FORBIDDEN", message: "Nur der Vereinsverantwortliche kann Hauptsponsoren erstellen" });
          }
          if (input.sponsorType === "spartensponsor" && input.departmentId !== membership.departmentId) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Sie können nur Spartensponsor für Ihre eigene Abteilung erstellen" });
          }
        }
        // Owner darf alles
        // Upload Logo zu S3
        const buffer = Buffer.from(input.logoBase64, "base64");
        const ext = input.mimeType.includes("png") ? ".png" : input.mimeType.includes("svg") ? ".svg" : input.mimeType.includes("pdf") ? ".pdf" : ".jpg";
        const key = `org-${input.orgId}/sponsor-templates/${Date.now()}-${input.name.replace(/[^a-zA-Z0-9]/g, "_")}`;
        const { key: storageKey, url } = await storagePut(key + ext, buffer, input.mimeType);
        // In DB speichern
        const id = await createSponsorTemplate({
          orgId: input.orgId,
          name: input.name,
          logoUrl: url,
          storageKey,
          logoMimeType: input.mimeType,
          category: input.category || null,
          sponsorType: input.sponsorType,
          obligation: input.obligation,
          departmentId: input.departmentId || null,
          teamId: input.teamId || null,
          contactFirstName: input.contactFirstName || null,
          contactLastName: input.contactLastName || null,
          contactEmail: input.contactEmail || null,
          contactPhone: input.contactPhone || null,
          street: input.street || null,
          zip: input.zip || null,
          city: input.city || null,
          country: input.country || "Deutschland",
          vatId: input.vatId || null,
          billingDifferent: input.billingDifferent || false,
          billingStreet: input.billingStreet || null,
          billingZip: input.billingZip || null,
          billingCity: input.billingCity || null,
           billingCountry: input.billingCountry || null,
          sponsoringAmount: (membership.role === "owner" && input.sponsoringAmount) ? input.sponsoringAmount : null,
          contractStart: input.contractStart ? new Date(input.contractStart) : null,
          contractEnd: input.contractEnd ? new Date(input.contractEnd) : null,
          createdBy: ctx.user.id,
        });
        // Owner über neuen Sponsor benachrichtigen
        try {
          const org = await getOrganizationById(input.orgId);
          const sponsorTypeLabel = input.sponsorType === "hauptsponsor" ? "Hauptsponsor" : input.sponsorType === "spartensponsor" ? "Spartensponsor" : "Mannschaftssponsor";
          const kontakt = [input.contactFirstName, input.contactLastName].filter(Boolean).join(" ");
          const adresse = [input.street, input.zip, input.city].filter(Boolean).join(", ");
          await notifyOwner({
            title: `Neuer Sponsor erfasst: ${input.name}`,
            content: [
              `Ein neuer Sponsor wurde f\u00fcr "${org?.name || "Verein"}" erfasst.`,
              ``,
              `Sponsor: ${input.name}`,
              `Typ: ${sponsorTypeLabel}`,
              kontakt ? `Kontaktperson: ${kontakt}` : null,
              input.contactEmail ? `E-Mail: ${input.contactEmail}` : null,
              input.contactPhone ? `Telefon: ${input.contactPhone}` : null,
              adresse ? `Adresse: ${adresse}` : null,
              input.vatId ? `USt-IdNr.: ${input.vatId}` : null,
              ``,
              `Erfasst von: ${ctx.user.name || ctx.user.email || "Unbekannt"}`,
            ].filter(Boolean).join("\n"),
          });
        } catch (e) { /* Notification ist optional */ }
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
        sponsorType: z.enum(["hauptsponsor", "spartensponsor", "mannschaftssponsor"]).optional(),
        obligation: z.enum(["alle_produkte", "nur_trikot", "nicht_verpflichtend"]).optional(),
        departmentId: z.number().nullable().optional(),
        teamId: z.number().nullable().optional(),
        // Kontaktdaten
        contactFirstName: z.string().max(100).nullable().optional(),
        contactLastName: z.string().max(100).nullable().optional(),
        contactEmail: z.string().email().nullable().optional(),
        contactPhone: z.string().max(50).nullable().optional(),
        // Firmenadresse
        street: z.string().max(255).nullable().optional(),
        zip: z.string().max(10).nullable().optional(),
        city: z.string().max(100).nullable().optional(),
        country: z.string().max(100).nullable().optional(),
        // Rechnungsdaten
        vatId: z.string().max(50).nullable().optional(),
        billingDifferent: z.boolean().nullable().optional(),
        billingStreet: z.string().max(255).nullable().optional(),
        billingZip: z.string().max(10).nullable().optional(),
        billingCity: z.string().max(100).nullable().optional(),
        billingCountry: z.string().max(100).nullable().optional(),
        // Sponsoring (nur Owner)
        sponsoringAmount: z.number().nullable().optional(),
        contractStart: z.string().nullable().optional(),
        contractEnd: z.string().nullable().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const membership = await getMembershipByUserAndOrg(ctx.user.id, input.orgId);
        if (!membership || membership.role !== "owner") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Nur der Vereinsverantwortliche kann Sponsor-Vorlagen bearbeiten" });
        }
        const { id, orgId, contractStart, contractEnd, ...data } = input;
        await updateSponsorTemplate(id, {
          ...data,
          contractStart: contractStart ? new Date(contractStart) : contractStart === null ? null : undefined,
          contractEnd: contractEnd ? new Date(contractEnd) : contractEnd === null ? null : undefined,
        });
        return { success: true };
      }),

    /** Zugeschnittenes Logo speichern */
    updateLogo: protectedProcedure
      .input(z.object({
        id: z.number(),
        orgId: z.number(),
        logoBase64: z.string(),
        mimeType: z.string().default("image/png"),
      }))
      .mutation(async ({ input, ctx }) => {
        const membership = await requireOrgMember(ctx.user.id, input.orgId);
        // Owner, Spartenleiter und Trainer dürfen Logos zuschneiden
        const buffer = Buffer.from(input.logoBase64, "base64");
        const ext = input.mimeType.includes("png") ? ".png" : ".jpg";
        const key = `org-${input.orgId}/sponsor-templates/${Date.now()}-cropped`;
        const { key: storageKey, url } = await storagePut(key + ext, buffer, input.mimeType);
        await updateSponsorTemplate(input.id, {
          logoUrl: url,
          storageKey,
          logoMimeType: input.mimeType,
        });
        return { logoUrl: url };
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

    /** Zugewiesene Produkt-IDs eines Sponsors abrufen */
    assignedProducts: protectedProcedure
      .input(z.object({ sponsorId: z.number() }))
      .query(async ({ input }) => {
        return listAssignedProductIdsForSponsor(input.sponsorId);
      }),

    /** Produkte einem Sponsor zuweisen/synchronisieren (nur Owner) */
    syncProducts: protectedProcedure
      .input(z.object({
        sponsorId: z.number(),
        orgId: z.number(),
        productIds: z.array(z.number()),
      }))
      .mutation(async ({ input, ctx }) => {
        const membership = await getMembershipByUserAndOrg(ctx.user.id, input.orgId);
        if (!membership || membership.role !== "owner") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Nur der Vereinsverantwortliche kann Produkt-Zuweisungen verwalten" });
        }
        await syncSponsorProducts(input.sponsorId, input.productIds, ctx.user.id);
        return { success: true };
      }),

    /** Sponsoren eines Produkts abrufen (mit Freigabe-Info) */
    sponsorsForProduct: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ input }) => {
        return listSponsorsByProduct(input.productId);
      }),
   }),

  /** Mockup-Freigabe */
  mockupApproval: router({
    /** Mockup zur Freigabe einreichen */
    submit: protectedProcedure
      .input(z.object({
        mockupId: z.number(),
        sponsorId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const reviewToken = nanoid(32);
        const result = await createMockupApproval({
          mockupId: input.mockupId,
          sponsorId: input.sponsorId,
          status: "pending",
          reviewToken,
          submittedByUserId: ctx.user.id,
        });
        // Sponsor-E-Mail laden für Benachrichtigung
        const sponsor = await getSponsorTemplate(input.sponsorId);
        const mockup = await getMockupById(input.mockupId);
        // Owner benachrichtigen
        try {
          await notifyOwner({
            title: `Mockup-Freigabe angefragt: ${sponsor?.name || "Sponsor"}`,
            content: `Ein Mockup "${mockup?.title || "KI-Mockup"}" wurde zur Freigabe bei ${sponsor?.name || "Sponsor"} eingereicht.\n\nSponsor-Kontakt: ${sponsor?.contactEmail || "keine E-Mail hinterlegt"}\nFreigabe-Token: ${reviewToken}\n\nDer Freigabe-Link kann über das Trainer-Dashboard geteilt werden.`,
          });
        } catch (e) {
          console.warn("[MockupApproval] Benachrichtigung fehlgeschlagen:", e);
        }
        return { id: result.id, reviewToken, sponsorEmail: sponsor?.contactEmail || null };
      }),

    /** Offene Freigaben eines Sponsors auflisten */
    listBySponsor: protectedProcedure
      .input(z.object({ sponsorId: z.number() }))
      .query(async ({ input }) => {
        return listMockupApprovalsBySponsor(input.sponsorId);
      }),

    /** Alle Freigaben eines Mockups auflisten */
    listByMockup: protectedProcedure
      .input(z.object({ mockupId: z.number() }))
      .query(async ({ input }) => {
        return listMockupApprovalsByMockup(input.mockupId);
      }),

    /** Offene Freigaben eines Sponsors */
    pendingBySponsor: protectedProcedure
      .input(z.object({ sponsorId: z.number() }))
      .query(async ({ input }) => {
        return listPendingApprovalsBySponsor(input.sponsorId);
      }),

    /** Freigabe-Status eines Mockups abrufen */
    statusForMockup: protectedProcedure
      .input(z.object({ mockupId: z.number() }))
      .query(async ({ input }) => {
        return getApprovalStatusForMockup(input.mockupId);
      }),

    /** Mockup per Review-Token laden (öffentlich für Sponsor) */
    getByToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const approval = await getMockupApprovalByToken(input.token);
        if (!approval) throw new TRPCError({ code: "NOT_FOUND", message: "Freigabe nicht gefunden" });
        // Mockup-Daten laden
        const mockup = await getMockupById(approval.mockupId);
        const sponsor = await getSponsorTemplate(approval.sponsorId);
        return { approval, mockup, sponsor };
      }),

    /** Freigabe erteilen oder ablehnen (öffentlich per Token) */
    review: publicProcedure
      .input(z.object({
        token: z.string(),
        status: z.enum(["approved", "rejected"]),
        reviewedBy: z.string().min(1).max(255),
        reviewNote: z.string().max(1000).optional(),
      }))
      .mutation(async ({ input }) => {
        const approval = await getMockupApprovalByToken(input.token);
        if (!approval) throw new TRPCError({ code: "NOT_FOUND", message: "Freigabe nicht gefunden" });
        if (approval.status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "Diese Freigabe wurde bereits bearbeitet" });
        await reviewMockupApproval(approval.id, input.status, input.reviewedBy, input.reviewNote);
        return { success: true, status: input.status };
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
        /** Custom Model Foto (Base64, optional - ersetzt modelPreset) */
        customModelImageBase64: z.string().optional(),
        /** Seite des Kleidungsstücks: front oder back */
        side: z.enum(["front", "back"]).optional(),
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
          customModelImageBase64: input.customModelImageBase64,
          side: input.side,
        });

        return { url: result.url };
      }),

    /** Prüfe ob Photoroom API konfiguriert ist */
    photoroomStatus: publicProcedure
      .query(() => {
        return { configured: isPhotoroomConfigured() };
      }),
  }),

  // ─── Kollektions-System ──────────────────────────────────────────────────
  collection: router({
    /** Kollektion erstellen */
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        orgId: z.number(),
        departmentId: z.number().optional(),
        scope: z.enum(["team", "department", "org"]),
        enforcement: z.enum(["optional", "mandatory"]).optional(),
        thumbnailUrl: z.string().optional(),
        savedDesignIds: z.array(z.number()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Berechtigungsprüfung basierend auf scope
        const membership = await getMembershipByUserAndOrg(ctx.user.id, input.orgId);
        if (!membership) throw new TRPCError({ code: "FORBIDDEN", message: "Kein Mitglied dieser Organisation" });

        if (input.scope === "org" && membership.role !== "owner") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Nur der Vereinsinhaber kann Vereinskollektionen erstellen" });
        }
        if (input.scope === "department" && membership.role !== "department_lead" && membership.role !== "owner") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Nur Spartenleiter oder Owner können Sparten-Kollektionen erstellen" });
        }

        const collectionId = await createCollection({
          name: input.name,
          description: input.description || null,
          orgId: input.orgId,
          departmentId: input.departmentId || null,
          createdByUserId: ctx.user.id,
          scope: input.scope,
          enforcement: input.enforcement || "optional",
          thumbnailUrl: input.thumbnailUrl || null,
        });

        // Designs hinzufügen falls angegeben
        if (input.savedDesignIds && input.savedDesignIds.length > 0) {
          for (let i = 0; i < input.savedDesignIds.length; i++) {
            await addCollectionItem({
              collectionId,
              savedDesignId: input.savedDesignIds[i],
              sortOrder: i,
            });
          }
        }

        return { id: collectionId };
      }),

    /** Kollektionen auflisten (basierend auf Org) */
    list: protectedProcedure
      .input(z.object({
        orgId: z.number(),
        departmentId: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const membership = await getMembershipByUserAndOrg(ctx.user.id, input.orgId);
        if (!membership) throw new TRPCError({ code: "FORBIDDEN" });

        let colls;
        if (input.departmentId) {
          colls = await listCollectionsForDepartment(input.departmentId, input.orgId);
        } else {
          colls = await listCollectionsForOrg(input.orgId);
        }

        // Für jeden Kollektion die Items laden
        const result = await Promise.all(colls.map(async (c) => {
          const items = await listCollectionItems(c.id);
          const assignments = await listAssignmentsForCollection(c.id);
          return {
            ...c,
            items: items.map(i => ({ ...i.item, design: i.design })),
            assignedDepartments: assignments.map(a => a.departmentId),
          };
        }));

        return result;
      }),

    /** Einzelne Kollektion mit Items laden */
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const coll = await getCollection(input.id);
        if (!coll) throw new TRPCError({ code: "NOT_FOUND" });

        const membership = await getMembershipByUserAndOrg(ctx.user.id, coll.orgId);
        if (!membership) throw new TRPCError({ code: "FORBIDDEN" });

        const items = await listCollectionItems(coll.id);
        const assignments = await listAssignmentsForCollection(coll.id);

        return {
          ...coll,
          items: items.map(i => ({ ...i.item, design: i.design })),
          assignedDepartments: assignments.map(a => a.departmentId),
        };
      }),

    /** Kollektion aktualisieren */
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        enforcement: z.enum(["optional", "mandatory"]).optional(),
        thumbnailUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const coll = await getCollection(input.id);
        if (!coll) throw new TRPCError({ code: "NOT_FOUND" });

        const membership = await getMembershipByUserAndOrg(ctx.user.id, coll.orgId);
        if (!membership) throw new TRPCError({ code: "FORBIDDEN" });

        // Nur Ersteller, Spartenleiter oder Owner dürfen bearbeiten
        if (coll.createdByUserId !== ctx.user.id && membership.role !== "owner" && membership.role !== "department_lead") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Keine Berechtigung" });
        }

        // enforcement nur für Owner änderbar
        if (input.enforcement && membership.role !== "owner") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Nur der Owner kann die Verbindlichkeit ändern" });
        }

        const updateData: Record<string, unknown> = {};
        if (input.name) updateData.name = input.name;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.enforcement) updateData.enforcement = input.enforcement;
        if (input.thumbnailUrl) updateData.thumbnailUrl = input.thumbnailUrl;

        await updateCollection(input.id, updateData as any);
        return { success: true };
      }),

    /** Kollektion löschen */
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const coll = await getCollection(input.id);
        if (!coll) throw new TRPCError({ code: "NOT_FOUND" });

        const membership = await getMembershipByUserAndOrg(ctx.user.id, coll.orgId);
        if (!membership) throw new TRPCError({ code: "FORBIDDEN" });

        if (coll.createdByUserId !== ctx.user.id && membership.role !== "owner") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Keine Berechtigung" });
        }

        await deleteCollection(input.id);
        return { success: true };
      }),

    /** Design zu Kollektion hinzufügen */
    addItem: protectedProcedure
      .input(z.object({
        collectionId: z.number(),
        savedDesignId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const coll = await getCollection(input.collectionId);
        if (!coll) throw new TRPCError({ code: "NOT_FOUND" });

        const membership = await getMembershipByUserAndOrg(ctx.user.id, coll.orgId);
        if (!membership) throw new TRPCError({ code: "FORBIDDEN" });

        // Aktuelle Items zählen für sortOrder
        const items = await listCollectionItems(input.collectionId);
        const id = await addCollectionItem({
          collectionId: input.collectionId,
          savedDesignId: input.savedDesignId,
          sortOrder: items.length,
        });
        return { id };
      }),

    /** Design aus Kollektion entfernen */
    removeItem: protectedProcedure
      .input(z.object({ itemId: z.number(), collectionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const coll = await getCollection(input.collectionId);
        if (!coll) throw new TRPCError({ code: "NOT_FOUND" });

        const membership = await getMembershipByUserAndOrg(ctx.user.id, coll.orgId);
        if (!membership) throw new TRPCError({ code: "FORBIDDEN" });

        await removeCollectionItem(input.itemId);
        return { success: true };
      }),

    /** Spartenleiter: Kollektion für Sparte freigeben */
    assign: protectedProcedure
      .input(z.object({
        collectionId: z.number(),
        departmentId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Nur Spartenleiter oder Owner
        const coll = await getCollection(input.collectionId);
        if (!coll) throw new TRPCError({ code: "NOT_FOUND" });

        const membership = await getMembershipByUserAndOrg(ctx.user.id, coll.orgId);
        if (!membership || (membership.role !== "department_lead" && membership.role !== "owner")) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Nur Spartenleiter oder Owner" });
        }

        const id = await assignCollectionToDepartment({
          collectionId: input.collectionId,
          departmentId: input.departmentId,
          assignedByUserId: ctx.user.id,
        });
        return { id };
      }),

    /** Spartenleiter: Freigabe zurücknehmen */
    unassign: protectedProcedure
      .input(z.object({
        collectionId: z.number(),
        departmentId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const coll = await getCollection(input.collectionId);
        if (!coll) throw new TRPCError({ code: "NOT_FOUND" });

        const membership = await getMembershipByUserAndOrg(ctx.user.id, coll.orgId);
        if (!membership || (membership.role !== "department_lead" && membership.role !== "owner")) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        await unassignCollectionFromDepartment(input.collectionId, input.departmentId);
        return { success: true };
      }),

    /** Owner: Verbindlichkeit setzen (optional/mandatory) */
    setEnforcement: protectedProcedure
      .input(z.object({
        id: z.number(),
        enforcement: z.enum(["optional", "mandatory"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const coll = await getCollection(input.id);
        if (!coll) throw new TRPCError({ code: "NOT_FOUND" });

        await requireOrgOwner(ctx.user.id, coll.orgId);
        await updateCollection(input.id, { enforcement: input.enforcement });
        return { success: true };
      }),
  }),

  /** Verbandsvorgaben-Validierung */
  jerseyRules: router({
    /** Regelwerk für eine Sportart/Level laden */
    getRules: publicProcedure
      .input(z.object({
        sportart: z.enum(["fussball", "volleyball", "handball", "basketball"]),
        level: z.enum(["profi", "semi", "amateur"]).default("amateur"),
      }))
      .query(({ input }) => {
        return getJerseyRules(input.sportart as SportartCode, input.level);
      }),

    /** Zonen gegen Verbandsvorgaben validieren */
    validate: publicProcedure
      .input(z.object({
        sportart: z.enum(["fussball", "volleyball", "handball", "basketball"]),
        level: z.enum(["profi", "semi", "amateur"]).default("amateur"),
        zones: z.array(z.object({
          purpose: z.string(),
          widthCm: z.number().optional(),
          heightCm: z.number().optional(),
          part: z.string(),
        })),
      }))
      .query(({ input }) => {
        const rules = getJerseyRules(input.sportart as SportartCode, input.level);
        const warnings = validateZonesAgainstRules(input.zones as ZoneForValidation[], rules);
        return { rules, warnings };
      }),
  }),

  /** Sponsor-Einladungen */
  sponsorInvitation: router({
    /** Einladung erstellen und optional E-Mail senden */
    create: protectedProcedure
      .input(z.object({
        orgId: z.number(),
        sponsorEmail: z.string().email(),
        sponsorName: z.string().optional(),
        sendEmail: z.boolean().default(true),
      }))
      .mutation(async ({ input, ctx }) => {
        const membership = await requireOrgMember(ctx.user.id, input.orgId);
        if (membership.role === "trainer") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Trainer k\u00f6nnen keine Sponsor-Einladungen erstellen" });
        }
        const org = await getOrganizationById(input.orgId);
        const token = nanoid(32);
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 Tage
        const id = await createSponsorInvitation({
          orgId: input.orgId,
          token,
          sponsorEmail: input.sponsorEmail,
          sponsorName: input.sponsorName || null,
          invitedBy: ctx.user.id,
          expiresAt,
        });
        // E-Mail senden via notifyOwner (als Workaround)
        if (input.sendEmail) {
          await notifyOwner({
            title: `Sponsor-Einladung an ${input.sponsorEmail}`,
            content: `Verein: ${org?.name || "Unbekannt"}\nSponsor: ${input.sponsorName || input.sponsorEmail}\nLink: ${process.env.VITE_APP_URL || ""}/sponsor-form/${token}\n\nBitte leiten Sie diesen Link an den Sponsor weiter.`,
          });
        }
        return { id, token, expiresAt };
      }),

    /** Alle Einladungen einer Organisation auflisten */
    list: protectedProcedure
      .input(z.object({ orgId: z.number() }))
      .query(async ({ input, ctx }) => {
        await requireOrgMember(ctx.user.id, input.orgId);
        return listSponsorInvitations(input.orgId);
      }),

    /** Einladung per Token abrufen (öffentlich - für Sponsor-Formular) */
    getByToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const invitation = await getSponsorInvitationByToken(input.token);
        if (!invitation) throw new TRPCError({ code: "NOT_FOUND", message: "Einladung nicht gefunden" });
        if (invitation.status === "expired" || invitation.expiresAt < new Date()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Diese Einladung ist abgelaufen" });
        }
        if (invitation.status === "completed") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Diese Einladung wurde bereits ausgef\u00fcllt" });
        }
        // Org-Daten f\u00fcr Anzeige laden
        const org = await getOrganizationById(invitation.orgId);
        return { ...invitation, orgName: org?.name || "Unbekannt" };
      }),

    /** Sponsor-Formular ausf\u00fcllen (\u00f6ffentlich - Sponsor f\u00fcllt seine Daten aus) */
    complete: publicProcedure
      .input(z.object({
        token: z.string(),
        name: z.string().min(1),
        logoBase64: z.string(),
        mimeType: z.string(),
        contactFirstName: z.string().min(1),
        contactLastName: z.string().min(1),
        contactEmail: z.string().email(),
        contactPhone: z.string().optional(),
        street: z.string().min(1),
        zip: z.string().min(1),
        city: z.string().min(1),
        country: z.string().default("Deutschland"),
        vatId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const invitation = await getSponsorInvitationByToken(input.token);
        if (!invitation) throw new TRPCError({ code: "NOT_FOUND", message: "Einladung nicht gefunden" });
        if (invitation.status !== "pending") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Diese Einladung wurde bereits bearbeitet" });
        }
        if (invitation.expiresAt < new Date()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Diese Einladung ist abgelaufen" });
        }
        // Logo zu S3 hochladen
        const buffer = Buffer.from(input.logoBase64, "base64");
        const ext = input.mimeType.includes("png") ? ".png" : input.mimeType.includes("svg") ? ".svg" : input.mimeType.includes("pdf") ? ".pdf" : ".jpg";
        const key = `org-${invitation.orgId}/sponsor-templates/${Date.now()}-${input.name.replace(/[^a-zA-Z0-9]/g, "_")}`;
        const { key: storageKey, url } = await storagePut(key + ext, buffer, input.mimeType);
        // Sponsor-Template erstellen
        const sponsorId = await createSponsorTemplate({
          orgId: invitation.orgId,
          name: input.name,
          logoUrl: url,
          storageKey,
          logoMimeType: input.mimeType,
          sponsorType: "mannschaftssponsor",
          obligation: "nicht_verpflichtend",
          contactFirstName: input.contactFirstName,
          contactLastName: input.contactLastName,
          contactEmail: input.contactEmail,
          contactPhone: input.contactPhone || null,
          street: input.street,
          zip: input.zip,
          city: input.city,
          country: input.country,
          vatId: input.vatId || null,
          billingDifferent: false,
          createdBy: invitation.invitedBy,
        });
        // Einladung als abgeschlossen markieren
        await completeSponsorInvitation(input.token, sponsorId);
        // Owner benachrichtigen
        await notifyOwner({
          title: "Sponsor hat Daten ausgef\u00fcllt",
          content: `Der Sponsor "${input.name}" hat seine Daten \u00fcber den Einladungslink ausgef\u00fcllt. Die Daten sind jetzt in der Verwaltung sichtbar.`,
        });
        return { success: true };
      }),
  }),

  // ─── Two-Factor Authentication (2FA) ─────────────────────────────────────────────────────────
  twoFactor: router({
    /** Prüfe ob 2FA für den aktuellen Benutzer aktiviert ist */
    status: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUserById(ctx.user.id);
      return {
        enabled: user?.totpEnabled ?? false,
        hasSecret: !!user?.totpSecret,
      };
    }),

    /** Starte 2FA-Setup: Generiere Secret und QR-Code */
    setup: protectedProcedure.mutation(async ({ ctx }) => {
      const user = await getUserById(ctx.user.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Benutzer nicht gefunden" });
      if (user.totpEnabled) throw new TRPCError({ code: "BAD_REQUEST", message: "2FA ist bereits aktiviert" });

      const email = user.email || user.name || `user-${user.id}`;
      const { secret, otpauthUrl } = generateTotpSecret(email);
      const qrCodeDataUrl = await generateQrCodeDataUrl(otpauthUrl);

      // Secret in DB speichern (noch nicht aktiviert)
      await setUserTotpSecret(ctx.user.id, secret);

      return {
        secret,
        qrCodeDataUrl,
        otpauthUrl,
      };
    }),

    /** Bestätige 2FA-Setup mit einem gültigen TOTP-Code */
    confirmSetup: protectedProcedure
      .input(z.object({ token: z.string().length(6) }))
      .mutation(async ({ input, ctx }) => {
        const user = await getUserById(ctx.user.id);
        if (!user) throw new TRPCError({ code: "NOT_FOUND" });
        if (user.totpEnabled) throw new TRPCError({ code: "BAD_REQUEST", message: "2FA ist bereits aktiviert" });
        if (!user.totpSecret) throw new TRPCError({ code: "BAD_REQUEST", message: "Kein 2FA-Setup gestartet" });

        const isValid = verifyTotpToken(input.token, user.totpSecret);
        if (!isValid) throw new TRPCError({ code: "BAD_REQUEST", message: "Ungültiger Code. Bitte versuchen Sie es erneut." });

        // Backup-Codes generieren
        const { plaintext, hashed } = await generateBackupCodes();

        // 2FA aktivieren und Backup-Codes speichern
        await enableUserTotp(ctx.user.id, JSON.stringify(hashed));

        return {
          success: true,
          backupCodes: plaintext,
        };
      }),

    /** 2FA deaktivieren (erfordert gültigen TOTP-Code) */
    disable: protectedProcedure
      .input(z.object({ token: z.string().length(6) }))
      .mutation(async ({ input, ctx }) => {
        const user = await getUserById(ctx.user.id);
        if (!user) throw new TRPCError({ code: "NOT_FOUND" });
        if (!user.totpEnabled) throw new TRPCError({ code: "BAD_REQUEST", message: "2FA ist nicht aktiviert" });
        if (!user.totpSecret) throw new TRPCError({ code: "BAD_REQUEST" });

        const isValid = verifyTotpToken(input.token, user.totpSecret);
        if (!isValid) throw new TRPCError({ code: "BAD_REQUEST", message: "Ungültiger Code" });

        await disableUserTotp(ctx.user.id);
        return { success: true };
      }),

    /** Neue Backup-Codes generieren (erfordert gültigen TOTP-Code) */
    regenerateBackupCodes: protectedProcedure
      .input(z.object({ token: z.string().length(6) }))
      .mutation(async ({ input, ctx }) => {
        const user = await getUserById(ctx.user.id);
        if (!user) throw new TRPCError({ code: "NOT_FOUND" });
        if (!user.totpEnabled || !user.totpSecret) throw new TRPCError({ code: "BAD_REQUEST", message: "2FA ist nicht aktiviert" });

        const isValid = verifyTotpToken(input.token, user.totpSecret);
        if (!isValid) throw new TRPCError({ code: "BAD_REQUEST", message: "Ungültiger Code" });

        const { plaintext, hashed } = await generateBackupCodes();
        await updateUserBackupCodes(ctx.user.id, JSON.stringify(hashed));

        return { backupCodes: plaintext };
      }),
  }),

  // ─── Vereinsmitglieder (orgMembers) ─────────────────────────────────────────
  orgMember: router({
    /** Mitglieder auflisten – rollenbasiert gefiltert */
    list: protectedProcedure
      .input(z.object({
        orgId: z.number(),
        departmentId: z.number().optional(),
        teamId: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        // Prüfe Mitgliedschaft
        const membership = await getMembershipByUserAndOrg(ctx.user.id, input.orgId);
        if (!membership) throw new TRPCError({ code: "FORBIDDEN", message: "Kein Zugriff" });

        // Owner sieht alles
        if (membership.role === "owner") {
          if (input.departmentId) {
            return listOrgMembersByDepartment(input.orgId, input.departmentId);
          }
          if (input.teamId) {
            return listOrgMembersByTeam(input.orgId, input.teamId);
          }
          return listOrgMembers(input.orgId);
        }

        // Spartenleiter sieht nur seine Sparte
        if (membership.role === "department_lead" && membership.departmentId) {
          if (input.teamId) {
            return listOrgMembersByTeam(input.orgId, input.teamId);
          }
          return listOrgMembersByDepartment(input.orgId, membership.departmentId);
        }

        // Trainer sieht nur seine Mannschaften
        if (membership.role === "trainer") {
          const trainerTeams = await listTeamsByTrainerAndOrg(ctx.user.id, input.orgId);
          if (input.teamId) {
            const hasAccess = trainerTeams.some(t => t.id === input.teamId);
            if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Kein Zugriff auf diese Mannschaft" });
            return listOrgMembersByTeam(input.orgId, input.teamId);
          }
          // Alle Mitglieder aus allen Mannschaften des Trainers
          const allMembers = [];
          for (const team of trainerTeams) {
            const members = await listOrgMembersByTeam(input.orgId, team.id);
            allMembers.push(...members);
          }
          // Deduplizieren nach ID
          const seen = new Set<number>();
          return allMembers.filter(m => {
            if (seen.has(m.id)) return false;
            seen.add(m.id);
            return true;
          });
        }

        throw new TRPCError({ code: "FORBIDDEN", message: "Keine Berechtigung" });
      }),

    /** Mitglied erstellen */
    create: protectedProcedure
      .input(z.object({
        orgId: z.number(),
        firstName: z.string().min(1, "Vorname ist erforderlich"),
        lastName: z.string().min(1, "Nachname ist erforderlich"),
        email: z.string().email("Ungültige E-Mail").optional().or(z.literal("")),
        phone: z.string().optional().or(z.literal("")),
        status: z.enum(["aktiv", "passiv"]),
        departmentId: z.number().optional().nullable(),
        teamId: z.number().optional().nullable(),
        memberNumber: z.string().optional().or(z.literal("")),
        birthDate: z.string().optional().or(z.literal("")),
        notes: z.string().optional().or(z.literal("")),
      }))
      .mutation(async ({ ctx, input }) => {
        const membership = await getMembershipByUserAndOrg(ctx.user.id, input.orgId);
        if (!membership) throw new TRPCError({ code: "FORBIDDEN", message: "Kein Zugriff" });
        // Nur Owner und Spartenleiter dürfen Mitglieder erstellen
        if (membership.role === "trainer") {
          // Trainer darf nur in seinen Mannschaften erstellen (wenn Mannschaft angegeben)
          if (input.teamId) {
            const trainerTeams = await listTeamsByTrainerAndOrg(ctx.user.id, input.orgId);
            if (!trainerTeams.some(t => t.id === input.teamId)) {
              throw new TRPCError({ code: "FORBIDDEN", message: "Kein Zugriff auf diese Mannschaft" });
            }
          }
        }
        // Aktive Mitglieder müssen einer Sparte zugeordnet werden
        if (input.status === "aktiv" && !input.departmentId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Aktive Mitglieder müssen einer Sparte zugeordnet werden" });
        }
        const id = await createOrgMember({
          orgId: input.orgId,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email || null,
          phone: input.phone || null,
          status: input.status,
          departmentId: input.departmentId || null,
          teamId: input.teamId || null,
          memberNumber: input.memberNumber || null,
          birthDate: input.birthDate ? new Date(input.birthDate) : null,
          notes: input.notes || null,
          createdBy: ctx.user.id,
        });
        return { id };
      }),

    /** Mitglied aktualisieren */
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        orgId: z.number(),
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional().or(z.literal("")),
        status: z.enum(["aktiv", "passiv"]).optional(),
        departmentId: z.number().optional().nullable(),
        teamId: z.number().optional().nullable(),
        memberNumber: z.string().optional().or(z.literal("")),
        birthDate: z.string().optional().or(z.literal("")),
        notes: z.string().optional().or(z.literal("")),
      }))
      .mutation(async ({ ctx, input }) => {
        const membership = await getMembershipByUserAndOrg(ctx.user.id, input.orgId);
        if (!membership) throw new TRPCError({ code: "FORBIDDEN", message: "Kein Zugriff" });
        const { id, orgId, ...data } = input;
        const updateData: Record<string, any> = {};
        if (data.firstName !== undefined) updateData.firstName = data.firstName;
        if (data.lastName !== undefined) updateData.lastName = data.lastName;
        if (data.email !== undefined) updateData.email = data.email || null;
        if (data.phone !== undefined) updateData.phone = data.phone || null;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.departmentId !== undefined) updateData.departmentId = data.departmentId;
        if (data.teamId !== undefined) updateData.teamId = data.teamId;
        if (data.memberNumber !== undefined) updateData.memberNumber = data.memberNumber || null;
        if (data.birthDate !== undefined) updateData.birthDate = data.birthDate ? new Date(data.birthDate) : null;
        if (data.notes !== undefined) updateData.notes = data.notes || null;
        // Aktive Mitglieder müssen einer Sparte zugeordnet werden
        const effectiveStatus = data.status !== undefined ? data.status : undefined;
        const effectiveDeptId = data.departmentId !== undefined ? data.departmentId : undefined;
        // Wenn Status auf aktiv gesetzt wird und keine Sparte angegeben
        if (effectiveStatus === "aktiv" && effectiveDeptId !== undefined && !effectiveDeptId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Aktive Mitglieder müssen einer Sparte zugeordnet werden" });
        }
        await updateOrgMember(id, updateData);
        return { success: true };
      }),

    /** Mitglied löschen */
    delete: protectedProcedure
      .input(z.object({ id: z.number(), orgId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const membership = await getMembershipByUserAndOrg(ctx.user.id, input.orgId);
        if (!membership) throw new TRPCError({ code: "FORBIDDEN", message: "Kein Zugriff" });
        // Trainer dürfen keine Mitglieder löschen
        if (membership.role === "trainer") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Trainer dürfen keine Mitglieder löschen" });
        }
        await deleteOrgMember(input.id);
        return { success: true };
      }),

    /** Excel/CSV-Import: Mehrere Mitglieder auf einmal erstellen */
    bulkImport: protectedProcedure
      .input(z.object({
        orgId: z.number(),
        members: z.array(z.object({
          firstName: z.string().min(1),
          lastName: z.string().min(1),
          email: z.string().optional().or(z.literal("")),
          phone: z.string().optional().or(z.literal("")),
          status: z.enum(["aktiv", "passiv"]),
          departmentId: z.number().optional().nullable(),
          teamId: z.number().optional().nullable(),
          memberNumber: z.string().optional().or(z.literal("")),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const membership = await getMembershipByUserAndOrg(ctx.user.id, input.orgId);
        if (!membership) throw new TRPCError({ code: "FORBIDDEN", message: "Kein Zugriff" });
        // Nur Owner und Spartenleiter dürfen importieren
        if (membership.role === "trainer") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Trainer dürfen keinen Massenimport durchführen" });
        }
        const membersToInsert = input.members.map(m => ({
          orgId: input.orgId,
          firstName: m.firstName,
          lastName: m.lastName,
          email: m.email || null,
          phone: m.phone || null,
          status: m.status as "aktiv" | "passiv",
          departmentId: m.departmentId || null,
          teamId: m.teamId || null,
          memberNumber: m.memberNumber || null,
          birthDate: null,
          notes: null,
          createdBy: ctx.user.id,
        }));
        const count = await bulkCreateOrgMembers(membersToInsert);
        return { imported: count };
      }),

    /** Anzahl Mitglieder */
    count: protectedProcedure
      .input(z.object({ orgId: z.number() }))
      .query(async ({ ctx, input }) => {
        const membership = await getMembershipByUserAndOrg(ctx.user.id, input.orgId);
        if (!membership) throw new TRPCError({ code: "FORBIDDEN", message: "Kein Zugriff" });
        return countOrgMembers(input.orgId);
      }),
  }),

  // ─── Druckbogen (Print Sheets) ──────────────────────────────────────────
  printSheet: router({
    /** Verfügbare Größen für eine Sportart + Geschlecht */
    availableSizes: protectedProcedure
      .input(z.object({
        sport: z.enum(["fussball", "handball", "volleyball", "basketball"]),
        gender: z.enum(["herren", "damen", "kinder"]).default("herren"),
      }))
      .query(({ input }) => {
        return getAvailableSizes(input.sport as SportCode, input.gender as GenderCode);
      }),

    /** Maße für eine bestimmte Größe */
    sizeDimensions: protectedProcedure
      .input(z.object({
        sport: z.enum(["fussball", "handball", "volleyball", "basketball"]),
        size: z.string(),
        gender: z.enum(["herren", "damen", "kinder"]).default("herren"),
      }))
      .query(({ input }) => {
        return getSizeDimensions(input.sport as SportCode, input.size as SizeCode, input.gender as GenderCode);
      }),

    /** Druckbögen für einen einzelnen Spieler generieren */
    generateForPlayer: protectedProcedure
      .input(z.object({
        designId: z.number(),
        playerId: z.number(),
        orgId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Berechtigungsprüfung
        await requireOrgMember(ctx.user.id, input.orgId);

        // Design laden (enthält zonesConfig = Record<zoneId, ZoneContent>)
        const design = await getSavedDesign(input.designId);
        if (!design) throw new TRPCError({ code: "NOT_FOUND", message: "Design nicht gefunden" });

        // Produkt laden (enthält templateId)
        const product = await getProductById(design.productId);
        if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Produkt nicht gefunden" });

        // Template finden für Sportart
        const tmpl = product.templateId ? TEXTIL_TEMPLATES.find(t => t.id === product.templateId) : null;
        const sport = (tmpl?.sport || "fussball") as SportCode;

        // Spieler laden
        const player = await getPlayerById(input.playerId);
        if (!player) throw new TRPCError({ code: "NOT_FOUND", message: "Spieler nicht gefunden" });

        // Team laden für Kategorie
        const team = await getTeamById(player.teamId);
        if (!team) throw new TRPCError({ code: "NOT_FOUND", message: "Team nicht gefunden" });

        // Organisation laden für Vereinsname
        const org = await getOrganizationById(input.orgId);
        if (!org) throw new TRPCError({ code: "NOT_FOUND", message: "Organisation nicht gefunden" });

        const gender = genderFromTeamCategory(team.kategorie || "herren");
        const playerSize = (player.size || "L") as SizeCode;

        // zonesConfig aus dem Design parsen: Record<zoneId, ZoneContent>
        const zonesConfig: Record<string, any> = typeof design.zonesConfig === "string"
          ? JSON.parse(design.zonesConfig)
          : (design.zonesConfig as Record<string, any>) || {};

        // colorsConfig aus dem Design parsen
        const colorsConfig: any = typeof design.colorsConfig === "string"
          ? JSON.parse(design.colorsConfig as string)
          : design.colorsConfig || {};

        // Produkt-Parts aus der DB laden
        const dbParts = await listPartsByProduct(product.id);
        // Produkt-Zonen aus der DB laden
        const dbZones = await listZonesByProduct(product.id);

        // Template-Parts für realWidthCm/realHeightCm
        const templateParts = tmpl?.parts || [];

        // Parts zusammenbauen
        const parts: PrintSheetConfig[] = [];

        for (const dbPart of dbParts) {
          // Template-Part finden für reale Maße
          const tmplPart = templateParts.find(tp => tp.key === dbPart.key);
          const baseWidthCm = tmplPart?.realWidthCm || 49;
          const baseHeightCm = tmplPart?.realHeightCm || 68;

          // Maße für die Spielergröße berechnen
          const dims = getSizeDimensions(sport, playerSize, gender);
          const isBody = dbPart.key === "vorderteil" || dbPart.key === "rueckteil";
          const isSleeve = dbPart.key.includes("aermel");

          let widthCm = baseWidthCm;
          let heightCm = baseHeightCm;

          if (dims) {
            if (isBody) {
              widthCm = dims.body.widthCm;
              heightCm = dims.body.heightCm;
            } else if (isSleeve && dims.sleeve) {
              widthCm = dims.sleeve.widthCm;
              heightCm = dims.sleeve.heightCm;
            }
          }

          // Zonen für diesen Part filtern
          const partZones = dbZones.filter(z => z.partId === dbPart.id);

          // Zonen zusammenbauen: DB-Zone (Position) + zonesConfig (Inhalt)
          const rawZones: PrintZone[] = partZones.map((dbZone) => {
            const content = zonesConfig[String(dbZone.id)] || {};
            return {
              purpose: dbZone.purpose || "custom",
              content: content.text || "",
              posXPercent: dbZone.posX,
              posYPercent: dbZone.posY,
              widthPercent: dbZone.width,
              heightPercent: dbZone.height,
              textStyle: content.textStyle || "straight",
              arcDegree: content.arcDegree || 0,
              fontColor: content.fontColor || dbZone.fontColor || "#000000",
              outlineColor: content.outlineColor || "none",
              outlineWidth: content.outlineWidth || 0,
              fontStyle: content.fontStyle || "block",
              fontWeight: content.fontWeight || dbZone.fontWeight || "bold",
              fontFamily: content.fontFamily || dbZone.fontFamily || undefined,
              fontSize: content.fontSize || dbZone.fontSize || 80,
              textAlign: (content.textAlign || dbZone.textAlign || "center") as "left" | "center" | "right",
              rotation: dbZone.rotation || 0,
              isImage: content.imageUrl ? true : (dbZone.purpose === "logo" || dbZone.purpose === "clubLogo"),
              imageUrl: content.imageUrl || undefined,
            };
          });

          // Spielerdaten in die Zonen einfüllen
          const playerData: PlayerPrintData = {
            playerId: player.id,
            playerName: player.name,
            playerNumber: player.number || "",
            size: playerSize,
            initials: player.name
              .split(" ")
              .map((n: string) => n.charAt(0).toUpperCase())
              .join(""),
          };

          const filledZones = fillZonesForPlayer(rawZones, playerData, org.name);

          parts.push({
            partKey: dbPart.key,
            partLabel: dbPart.label,
            realWidthCm: widthCm,
            realHeightCm: heightCm,
            zones: filledZones,
          });
        }

        // Druckbögen generieren
        const printConfig: PrintJobConfig = {
          clubName: org.name,
          sport,
          gender,
          player: {
            playerId: player.id,
            playerName: player.name,
            playerNumber: player.number || "",
            size: playerSize,
            initials: player.name
              .split(" ")
              .map((n: string) => n.charAt(0).toUpperCase())
              .join(""),
          },
          parts,
          bleedMm: 3,
          dpi: 300,
        };

        const sheets = await generateAllPrintSheets(printConfig);

        // PDFs in S3 speichern
        const results: { partKey: string; partLabel: string; url: string; key: string }[] = [];
        for (const sheet of sheets) {
          const fileName = `druckboegen/${input.orgId}/${input.designId}/${player.id}_${sheet.partKey}_${playerSize}.pdf`;
          const { key, url } = await storagePut(fileName, sheet.pdf, "application/pdf");
          results.push({
            partKey: sheet.partKey,
            partLabel: sheet.partLabel,
            url,
            key,
          });
        }

        return {
          player: {
            id: player.id,
            name: player.name,
            number: player.number,
            size: playerSize,
          },
          sheets: results,
        };
      }),

    /** Druckbögen für alle Spieler eines Teams generieren */
    generateForTeam: protectedProcedure
      .input(z.object({
        designId: z.number(),
        teamId: z.number(),
        orgId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Berechtigungsprüfung
        await requireOrgMember(ctx.user.id, input.orgId);

        // Alle Spieler des Teams laden
        const teamPlayers = await listPlayersByTeam(input.teamId);
        if (teamPlayers.length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Keine Spieler im Team" });
        }

        // Design laden (enthält zonesConfig = Record<zoneId, ZoneContent>)
        const design = await getSavedDesign(input.designId);
        if (!design) throw new TRPCError({ code: "NOT_FOUND", message: "Design nicht gefunden" });

        // Produkt laden (enthält templateId)
        const product = await getProductById(design.productId);
        if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Produkt nicht gefunden" });

        // Template finden für Sportart
        const tmpl = product.templateId ? TEXTIL_TEMPLATES.find(t => t.id === product.templateId) : null;
        const sport = (tmpl?.sport || "fussball") as SportCode;

        // Team und Organisation laden
        const team = await getTeamById(input.teamId);
        const org = await getOrganizationById(input.orgId);
        if (!team || !org) throw new TRPCError({ code: "NOT_FOUND", message: "Team oder Organisation nicht gefunden" });

        const gender = genderFromTeamCategory(team.kategorie || "herren");

        // zonesConfig aus dem Design parsen: Record<zoneId, ZoneContent>
        const zonesConfig: Record<string, any> = typeof design.zonesConfig === "string"
          ? JSON.parse(design.zonesConfig)
          : (design.zonesConfig as Record<string, any>) || {};

        // Produkt-Parts und -Zonen aus der DB laden (einmalig, nicht pro Spieler)
        const dbParts = await listPartsByProduct(product.id);
        const dbZones = await listZonesByProduct(product.id);
        const templateParts = tmpl?.parts || [];

        const allResults: {
          player: { id: number; name: string; number: string | null; size: string };
          sheets: { partKey: string; partLabel: string; url: string; key: string }[];
        }[] = [];

        // Für jeden Spieler Druckbögen generieren
        for (const player of teamPlayers) {
          try {
            const playerSize = (player.size || "L") as SizeCode;

            // Parts zusammenbauen (gleiche Logik wie generateForPlayer)
            const parts: PrintSheetConfig[] = [];

            for (const dbPart of dbParts) {
              const tmplPart = templateParts.find(tp => tp.key === dbPart.key);
              const baseWidthCm = tmplPart?.realWidthCm || 49;
              const baseHeightCm = tmplPart?.realHeightCm || 68;

              const dims = getSizeDimensions(sport, playerSize, gender);
              const isBody = dbPart.key === "vorderteil" || dbPart.key === "rueckteil";
              const isSleeve = dbPart.key.includes("aermel");

              let widthCm = baseWidthCm;
              let heightCm = baseHeightCm;

              if (dims) {
                if (isBody) {
                  widthCm = dims.body.widthCm;
                  heightCm = dims.body.heightCm;
                } else if (isSleeve && dims.sleeve) {
                  widthCm = dims.sleeve.widthCm;
                  heightCm = dims.sleeve.heightCm;
                }
              }

              // Zonen für diesen Part filtern
              const partZones = dbZones.filter(z => z.partId === dbPart.id);

              // Zonen zusammenbauen: DB-Zone (Position) + zonesConfig (Inhalt)
              const rawZones: PrintZone[] = partZones.map((dbZone) => {
                const content = zonesConfig[String(dbZone.id)] || {};
                return {
                  purpose: dbZone.purpose || "custom",
                  content: content.text || "",
                  posXPercent: dbZone.posX,
                  posYPercent: dbZone.posY,
                  widthPercent: dbZone.width,
                  heightPercent: dbZone.height,
                  textStyle: content.textStyle || "straight",
                  arcDegree: content.arcDegree || 0,
                  fontColor: content.fontColor || dbZone.fontColor || "#000000",
                  outlineColor: content.outlineColor || "none",
                  outlineWidth: content.outlineWidth || 0,
                  fontStyle: content.fontStyle || "block",
                  fontWeight: content.fontWeight || dbZone.fontWeight || "bold",
                  fontFamily: content.fontFamily || dbZone.fontFamily || undefined,
                  fontSize: content.fontSize || dbZone.fontSize || 80,
                  textAlign: (content.textAlign || dbZone.textAlign || "center") as "left" | "center" | "right",
                  rotation: dbZone.rotation || 0,
                  isImage: content.imageUrl ? true : (dbZone.purpose === "logo" || dbZone.purpose === "clubLogo"),
                  imageUrl: content.imageUrl || undefined,
                };
              });

              // Spielerdaten in die Zonen einfüllen
              const playerData: PlayerPrintData = {
                playerId: player.id,
                playerName: player.name,
                playerNumber: player.number || "",
                size: playerSize,
                initials: player.name
                  .split(" ")
                  .map((n: string) => n.charAt(0).toUpperCase())
                  .join(""),
              };

              const filledZones = fillZonesForPlayer(rawZones, playerData, org.name);

              parts.push({
                partKey: dbPart.key,
                partLabel: dbPart.label,
                realWidthCm: widthCm,
                realHeightCm: heightCm,
                zones: filledZones,
              });
            }

            // Druckbögen generieren
            const printConfig: PrintJobConfig = {
              clubName: org.name,
              sport,
              gender,
              player: {
                playerId: player.id,
                playerName: player.name,
                playerNumber: player.number || "",
                size: playerSize,
                initials: player.name
                  .split(" ")
                  .map((n: string) => n.charAt(0).toUpperCase())
                  .join(""),
              },
              parts,
              bleedMm: 3,
              dpi: 300,
            };

            const sheets = await generateAllPrintSheets(printConfig);

            const results: { partKey: string; partLabel: string; url: string; key: string }[] = [];
            for (const sheet of sheets) {
              const fileName = `druckboegen/${input.orgId}/${input.designId}/${player.id}_${sheet.partKey}_${playerSize}.pdf`;
              const { key, url } = await storagePut(fileName, sheet.pdf, "application/pdf");
              results.push({
                partKey: sheet.partKey,
                partLabel: sheet.partLabel,
                url,
                key,
              });
            }

            allResults.push({
              player: {
                id: player.id,
                name: player.name,
                number: player.number,
                size: playerSize,
              },
              sheets: results,
            });
          } catch (err) {
            console.error(`Fehler bei Druckbogen für Spieler ${player.name}:`, err);
            allResults.push({
              player: {
                id: player.id,
                name: player.name,
                number: player.number,
                size: (player.size || "L") as string,
              },
              sheets: [],
            });
          }
        }

        return {
          teamId: input.teamId,
          designId: input.designId,
          totalPlayers: teamPlayers.length,
          successCount: allResults.filter(r => r.sheets.length > 0).length,
          results: allResults,
        };
      }),
  }),

  // ─── Beta-Feedback-System ──────────────────────────────────────────────────────────────────────────────
  betaFeedback: router({
    /** Feedback erstellen (jeder eingeloggte User) */
    create: protectedProcedure
      .input(z.object({
        page: z.string().min(1),
        area: z.string().optional(),
        message: z.string().min(1),
        priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
        currentUrl: z.string().optional(),
        userAgent: z.string().optional(),
        screenshotUrl: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await createBetaFeedback({
          userId: ctx.user.id,
          userName: ctx.user.name || "Unbekannt",
          page: input.page,
          area: input.area || null,
          message: input.message,
          priority: input.priority,
          currentUrl: input.currentUrl || null,
          userAgent: input.userAgent || null,
          screenshotUrl: input.screenshotUrl || null,
        });
        return { id };
      }),

    /** Screenshot hochladen (Base64 -> S3) */
    uploadScreenshot: protectedProcedure
      .input(z.object({
        imageBase64: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const base64Data = input.imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        const key = `beta-feedback/screenshot-${ctx.user.id}-${Date.now()}.png`;
        const { url } = await storagePut(key, buffer, "image/png");
        return { url };
      }),

    /** Alle Feedbacks auflisten (Admin) */
    list: protectedProcedure
      .input(z.object({
        page: z.string().optional(),
        status: z.enum(["open", "resolved", "still_present", "in_progress"]).optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        // Nur Admins sehen alle Feedbacks
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Nur Admins können Feedbacks einsehen" });
        }
        return listBetaFeedback(input || undefined);
      }),

    /** Offene Feedbacks zählen pro Seite (für Badge) */
    countByPage: protectedProcedure
      .input(z.object({ page: z.string() }))
      .query(async ({ input }) => {
        return countBetaFeedbackByPage(input.page);
      }),

    /** Status aktualisieren (Admin) */
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["open", "resolved", "still_present", "in_progress"]),
        adminNote: z.string().optional(),
        verifyUrl: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Nur Admins können Status ändern" });
        }
        await updateBetaFeedbackStatus(input.id, input.status, input.adminNote, input.verifyUrl);
        return { success: true };
      }),

    /** Feedback löschen (Admin) */
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Nur Admins können Feedbacks löschen" });
        }
        await deleteBetaFeedback(input.id);
        return { success: true };
      }),
  }),
});
export type AppRouter = typeof appRouter;
