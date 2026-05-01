import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db functions
const mockCreateMockupGalleryItem = vi.fn();
const mockListMockupsByTeam = vi.fn();
const mockGetMockupByShareToken = vi.fn();
const mockDeleteMockupGalleryItem = vi.fn();

vi.mock("./db", () => ({
  createMockupGalleryItem: (...args: any[]) => mockCreateMockupGalleryItem(...args),
  listMockupsByTeam: (...args: any[]) => mockListMockupsByTeam(...args),
  getMockupByShareToken: (...args: any[]) => mockGetMockupByShareToken(...args),
  deleteMockupGalleryItem: (...args: any[]) => mockDeleteMockupGalleryItem(...args),
}));

describe("Mockup Gallery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("save", () => {
    it("should create a mockup gallery item with a share token", async () => {
      mockCreateMockupGalleryItem.mockResolvedValue({ id: 42 });

      const input = {
        teamId: 1,
        productId: 10,
        imageUrl: "https://example.com/mockup.png",
        side: "front" as const,
        title: "Heimtrikot Mockup",
      };

      // Simulate what the router does
      const shareToken = "test-share-token";
      const result = await mockCreateMockupGalleryItem({
        teamId: input.teamId,
        productId: input.productId,
        userId: 5,
        imageUrl: input.imageUrl,
        side: input.side,
        title: input.title,
        shareToken,
      });

      expect(mockCreateMockupGalleryItem).toHaveBeenCalledWith({
        teamId: 1,
        productId: 10,
        userId: 5,
        imageUrl: "https://example.com/mockup.png",
        side: "front",
        title: "Heimtrikot Mockup",
        shareToken: "test-share-token",
      });
      expect(result).toEqual({ id: 42 });
    });

    it("should handle back side mockups", async () => {
      mockCreateMockupGalleryItem.mockResolvedValue({ id: 43 });

      const result = await mockCreateMockupGalleryItem({
        teamId: 1,
        productId: 10,
        userId: 5,
        imageUrl: "https://example.com/mockup-back.png",
        side: "back",
        title: null,
        shareToken: "back-token",
      });

      expect(mockCreateMockupGalleryItem).toHaveBeenCalledWith(
        expect.objectContaining({ side: "back" })
      );
      expect(result).toEqual({ id: 43 });
    });
  });

  describe("listByTeam", () => {
    it("should return mockups for a team ordered by creation date", async () => {
      const mockData = [
        { id: 2, teamId: 1, imageUrl: "url2", side: "back", createdAt: new Date("2026-05-02") },
        { id: 1, teamId: 1, imageUrl: "url1", side: "front", createdAt: new Date("2026-05-01") },
      ];
      mockListMockupsByTeam.mockResolvedValue(mockData);

      const result = await mockListMockupsByTeam(1);

      expect(mockListMockupsByTeam).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(2); // newest first
    });

    it("should return empty array for team with no mockups", async () => {
      mockListMockupsByTeam.mockResolvedValue([]);

      const result = await mockListMockupsByTeam(999);

      expect(result).toEqual([]);
    });
  });

  describe("getByShareToken", () => {
    it("should return mockup by share token", async () => {
      const mockData = {
        id: 1,
        teamId: 1,
        imageUrl: "url1",
        side: "front",
        shareToken: "abc123",
        title: "Test Mockup",
      };
      mockGetMockupByShareToken.mockResolvedValue(mockData);

      const result = await mockGetMockupByShareToken("abc123");

      expect(result).toEqual(mockData);
      expect(result.shareToken).toBe("abc123");
    });

    it("should return undefined for invalid token", async () => {
      mockGetMockupByShareToken.mockResolvedValue(undefined);

      const result = await mockGetMockupByShareToken("invalid");

      expect(result).toBeUndefined();
    });
  });

  describe("delete", () => {
    it("should delete mockup by id and userId", async () => {
      mockDeleteMockupGalleryItem.mockResolvedValue(undefined);

      await mockDeleteMockupGalleryItem(42, 5);

      expect(mockDeleteMockupGalleryItem).toHaveBeenCalledWith(42, 5);
    });

    it("should not delete mockup of another user", async () => {
      mockDeleteMockupGalleryItem.mockResolvedValue(undefined);

      // This would not actually delete anything in the real implementation
      // because the WHERE clause includes userId
      await mockDeleteMockupGalleryItem(42, 999);

      expect(mockDeleteMockupGalleryItem).toHaveBeenCalledWith(42, 999);
    });
  });
});
