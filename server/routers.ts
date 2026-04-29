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
} from "./db";
import { storagePut } from "./storage";
import { createLocalUser, generatePassword } from "./localUserHelpers";
import bcrypt from "bcryptjs";

// Shared zone schema for reuse
const zonePurpose = z.enum(["logo", "playerName", "playerNumber", "clubName", "custom"]);
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

// Org-member guard: checks that user is a member of the given org
async function requireOrgMember(userId: number, orgId: number) {
  const membership = await getMembershipByUserAndOrg(userId, orgId);
  if (!membership) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Sie sind kein Mitglied dieser Organisation" });
  }
  return membership;
}

// Department-lead guard: checks that user is lead of the given department
async function requireDepartmentLead(userId: number, orgId: number, departmentId: number) {
  const membership = await getMembershipByUserAndOrg(userId, orgId);
  if (!membership) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Sie sind kein Mitglied dieser Organisation" });
  }
  if (membership.role === "owner") return membership; // Owner can do everything
  if (membership.role === "department_lead" && membership.departmentId === departmentId) return membership;
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
      }))
      .mutation(async ({ input, ctx }) => {
        const orgId = await createOrganization({
          name: input.name,
          type: input.type,
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
        const membership = await getMembershipByUserAndOrg(ctx.user.id, input.id);
        return { ...org, userRole: membership?.role };
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
          // User existiert bereits - prüfe ob schon Mitglied
          const existing = await getMembershipByUserAndOrg(user.id, input.orgId);
          if (existing) {
            throw new TRPCError({ code: "CONFLICT", message: "Benutzer ist bereits Mitglied dieser Organisation" });
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
          const existing = await getMembershipByUserAndOrg(user.id, input.orgId);
          if (existing) {
            throw new TRPCError({ code: "CONFLICT", message: "Benutzer ist bereits Mitglied dieser Organisation" });
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

    /** Logo hochladen (nur Owner) */
    upload: protectedProcedure
      .input(z.object({
        orgId: z.number(),
        name: z.string().min(1),
        imageBase64: z.string(),
        mimeType: z.string().default("image/png"),
        isDefault: z.boolean().default(false),
      }))
      .mutation(async ({ input, ctx }) => {
        await requireOrgOwner(ctx.user.id, input.orgId);
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

    /** Logo aktualisieren (nur Owner) */
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        orgId: z.number(),
        name: z.string().min(1).optional(),
        isDefault: z.boolean().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await requireOrgOwner(ctx.user.id, input.orgId);
        const { id, orgId, ...data } = input;
        if (data.isDefault) {
          await setDefaultOrgLogo(orgId, id);
        } else {
          await updateOrgLogo(id, data);
        }
        return { success: true };
      }),

    /** Logo l\u00f6schen (nur Owner) */
    delete: protectedProcedure
      .input(z.object({ id: z.number(), orgId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await requireOrgOwner(ctx.user.id, input.orgId);
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

  // ─── Admin User Management ───────────────────────────────────────────────────
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
});

export type AppRouter = typeof appRouter;
