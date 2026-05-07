import { describe, it, expect, vi } from "vitest";
import { getStandardPlacement } from "./logoCompositing";

describe("logoCompositing", () => {
  describe("getStandardPlacement", () => {
    it("returns correct placement for clubCrest on front", () => {
      const placement = getStandardPlacement("clubCrest", "front");
      expect(placement.xPercent).toBe(28);
      expect(placement.yPercent).toBe(18);
      expect(placement.widthPercent).toBe(10);
      expect(placement.heightPercent).toBe(10);
    });

    it("returns correct placement for mainSponsor on front", () => {
      const placement = getStandardPlacement("mainSponsor", "front");
      expect(placement.xPercent).toBe(30);
      expect(placement.yPercent).toBe(35);
      expect(placement.widthPercent).toBe(25);
      expect(placement.heightPercent).toBe(12);
    });

    it("returns correct placement for secondarySponsor", () => {
      const placement = getStandardPlacement("secondarySponsor", "front");
      expect(placement.xPercent).toBe(32);
      expect(placement.yPercent).toBe(15);
      expect(placement.widthPercent).toBe(20);
      expect(placement.heightPercent).toBe(8);
    });

    it("returns correct placement for manufacturer", () => {
      const placement = getStandardPlacement("manufacturer", "front");
      expect(placement.xPercent).toBe(55);
      expect(placement.yPercent).toBe(18);
      expect(placement.widthPercent).toBe(6);
      expect(placement.heightPercent).toBe(6);
    });
  });
});
