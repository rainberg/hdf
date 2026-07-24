import { describe, it, expect } from "vitest";
import {
  cn,
  slugify,
  formatRating,
  relativeTime,
  formatEuro,
  formatRMB,
  safeParseJson,
  creditLevel,
} from "@/lib/utils";

describe("cn", () => {
  it("合并多个类名", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("过滤假值", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });

  it("tailwind-merge 解决冲突", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });
});

describe("slugify", () => {
  it("英文转小写并以连字符分隔", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("保留中文字符", () => {
    expect(slugify("向东物流 GoEast")).toBe("向东物流-goeast");
  });

  it("去除首尾连字符", () => {
    expect(slugify("---abc---")).toBe("abc");
  });

  it("多个空格压缩为单个连字符", () => {
    expect(slugify("a    b")).toBe("a-b");
  });

  it("去除标点符号", () => {
    expect(slugify("a, b! c?")).toBe("a-b-c");
  });

  it("空字符串", () => {
    expect(slugify("")).toBe("");
  });
});

describe("formatRating", () => {
  it("保留 1 位小数", () => {
    expect(formatRating(4.567)).toBe("4.6");
  });

  it("整数补零", () => {
    expect(formatRating(5)).toBe("5.0");
  });

  it("0 分", () => {
    expect(formatRating(0)).toBe("0.0");
  });
});

describe("relativeTime", () => {
  it("刚刚", () => {
    expect(relativeTime(new Date())).toBe("刚刚");
  });

  it("分钟前", () => {
    const d = new Date(Date.now() - 5 * 60 * 1000);
    expect(relativeTime(d)).toBe("5 分钟前");
  });

  it("小时前", () => {
    const d = new Date(Date.now() - 3 * 60 * 60 * 1000);
    expect(relativeTime(d)).toBe("3 小时前");
  });

  it("天前", () => {
    const d = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    expect(relativeTime(d)).toBe("10 天前");
  });

  it("接受字符串", () => {
    const d = new Date(Date.now() - 2 * 60 * 1000);
    expect(relativeTime(d.toISOString())).toBe("2 分钟前");
  });
});

describe("formatEuro", () => {
  it("格式化为欧元", () => {
    const result = formatEuro(19.95);
    // de-DE locale：19,95 €
    expect(result).toMatch(/19,95/);
    expect(result).toMatch(/€/);
  });

  it("0 元", () => {
    expect(formatEuro(0)).toMatch(/0,00/);
  });
});

describe("formatRMB", () => {
  it("格式化为人民币", () => {
    const result = formatRMB(99);
    expect(result).toMatch(/¥/);
    expect(result).toMatch(/99/);
  });
});

describe("safeParseJson", () => {
  it("合法 JSON", () => {
    expect(safeParseJson('[1,2,3]', [])).toEqual([1, 2, 3]);
  });

  it("非法 JSON 返回默认值", () => {
    expect(safeParseJson("not-json", "fallback")).toBe("fallback");
  });

  it("null 返回默认值", () => {
    expect(safeParseJson(null, [])).toEqual([]);
  });

  it("undefined 返回默认值", () => {
    expect(safeParseJson(undefined, {})).toEqual({});
  });

  it("空字符串返回默认值", () => {
    expect(safeParseJson("", 0)).toBe(0);
  });
});

describe("creditLevel", () => {
  it("资深 (≥81)", () => {
    const lvl = creditLevel(85);
    expect(lvl.label).toBe("资深");
    expect(lvl.weight).toBe(2.0);
  });

  it("活跃 (51-80)", () => {
    const lvl = creditLevel(60);
    expect(lvl.label).toBe("活跃");
    expect(lvl.weight).toBe(1.5);
  });

  it("普通 (21-50)", () => {
    const lvl = creditLevel(30);
    expect(lvl.label).toBe("普通");
    expect(lvl.weight).toBe(1.0);
  });

  it("新人 (<21)", () => {
    const lvl = creditLevel(10);
    expect(lvl.label).toBe("新人");
    expect(lvl.weight).toBe(0.5);
  });

  it("边界值 81", () => {
    expect(creditLevel(81).label).toBe("资深");
  });

  it("边界值 80", () => {
    expect(creditLevel(80).label).toBe("活跃");
  });

  it("边界值 0", () => {
    expect(creditLevel(0).label).toBe("新人");
  });
});
