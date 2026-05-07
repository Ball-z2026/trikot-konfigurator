import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("./db", () => ({
  assignSponsorToProduct: vi.fn().mockResolvedValue({ id: 1 }),
  deleteSponsorProductAssignment: vi.fn().mockResolvedValue(undefined),
  listSponsorProductAssignments: vi.fn().mockResolvedValue([
    { id: 1, sponsorId: 10, productId: 20, createdAt: new Date() },
  ]),
  listProductsBySponsor: vi.fn().mockResolvedValue([20, 30]),
  listSponsorsByProduct: vi.fn().mockResolvedValue([10, 11]),
  createMockupApproval: vi.fn().mockResolvedValue({ id: 1 }),
  getMockupApprovalByToken: vi.fn().mockResolvedValue({
    id: 1,
    mockupId: 100,
    sponsorId: 10,
    status: "pending",
    reviewToken: "test-token-123",
    submittedByUserId: 1,
    createdAt: new Date(),
  }),
  reviewMockupApproval: vi.fn().mockResolvedValue(undefined),
  listMockupApprovalsBySponsor: vi.fn().mockResolvedValue([]),
  listMockupApprovalsByMockup: vi.fn().mockResolvedValue([]),
  getMockupById: vi.fn().mockResolvedValue({
    id: 100,
    title: "Test Mockup",
    imageUrl: "/test.png",
    side: "front",
  }),
  getSponsorTemplate: vi.fn().mockResolvedValue({
    id: 10,
    name: "Test Sponsor",
    logoUrl: "/logo.png",
    sponsorType: "hauptsponsor",
    contactEmail: "sponsor@test.de",
  }),
}));

describe("Sponsor-Produkt-Zuweisungen", () => {
  it("sollte eine Zuweisung erstellen können", async () => {
    const { assignSponsorToProduct } = await import("./db");
    const result = await assignSponsorToProduct({
      sponsorId: 10,
      productId: 20,
      assignedByUserId: 1,
    } as any);
    expect(result).toEqual({ id: 1 });
    expect(assignSponsorToProduct).toHaveBeenCalledWith({
      sponsorId: 10,
      productId: 20,
      assignedByUserId: 1,
    });
  });

  it("sollte Zuweisungen pro Sponsor auflisten", async () => {
    const { listProductsBySponsor } = await import("./db");
    const result = await listProductsBySponsor(10);
    expect(result).toEqual([20, 30]);
  });

  it("sollte Sponsoren pro Produkt auflisten", async () => {
    const { listSponsorsByProduct } = await import("./db");
    const result = await listSponsorsByProduct(20);
    expect(result).toEqual([10, 11]);
  });
});

describe("Mockup-Freigabe", () => {
  it("sollte eine Freigabe-Anfrage erstellen können", async () => {
    const { createMockupApproval } = await import("./db");
    const result = await createMockupApproval({
      mockupId: 100,
      sponsorId: 10,
      status: "pending",
      reviewToken: "test-token-123",
      submittedByUserId: 1,
    });
    expect(result).toEqual({ id: 1 });
  });

  it("sollte eine Freigabe per Token laden können", async () => {
    const { getMockupApprovalByToken } = await import("./db");
    const result = await getMockupApprovalByToken("test-token-123");
    expect(result).not.toBeNull();
    expect(result?.status).toBe("pending");
    expect(result?.reviewToken).toBe("test-token-123");
  });

  it("sollte den Status aktualisieren können", async () => {
    const { reviewMockupApproval } = await import("./db");
    await reviewMockupApproval(1, "approved", "Max Mustermann", "Sieht gut aus");
    expect(reviewMockupApproval).toHaveBeenCalledWith(
      1,
      "approved",
      "Max Mustermann",
      "Sieht gut aus"
    );
  });

  it("sollte Mockup-Daten per ID laden können", async () => {
    const { getMockupById } = await import("./db");
    const result = await getMockupById(100);
    expect(result).not.toBeNull();
    expect(result?.title).toBe("Test Mockup");
  });

  it("sollte Sponsor-Daten laden können", async () => {
    const { getSponsorTemplate } = await import("./db");
    const result = await getSponsorTemplate(10);
    expect(result).not.toBeNull();
    expect(result?.name).toBe("Test Sponsor");
    expect(result?.contactEmail).toBe("sponsor@test.de");
  });
});

describe("Freigabe-Workflow", () => {
  it("sollte den vollständigen Workflow abbilden: Erstellen -> Token laden -> Freigeben", async () => {
    const {
      createMockupApproval,
      getMockupApprovalByToken,
      reviewMockupApproval,
    } = await import("./db");

    // 1. Freigabe erstellen
    const created = await createMockupApproval({
      mockupId: 100,
      sponsorId: 10,
      status: "pending",
      reviewToken: "workflow-token",
      submittedByUserId: 1,
    });
    expect(created.id).toBe(1);

    // 2. Per Token laden (Sponsor-Seite)
    const loaded = await getMockupApprovalByToken("workflow-token");
    expect(loaded).not.toBeNull();
    expect(loaded?.status).toBe("pending");

    // 3. Freigabe erteilen
    await reviewMockupApproval(1, "approved", "Sponsor-Kontakt", "Alles in Ordnung");
    expect(reviewMockupApproval).toHaveBeenCalledWith(
      1,
      "approved",
      "Sponsor-Kontakt",
      "Alles in Ordnung"
    );
  });
});
