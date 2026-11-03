import { prisma } from "../../db/prisma.js";
import { classifyTriage } from "../../lib/gemini/client.js";
import { AppError } from "../../lib/errors.js";

export async function triageIssue(input: {
  title: string;
  description: string;
}): Promise<{
  categorySlug: string | null;
  categoryName: string | null;
  wardCode: string | null;
  wardName: string | null;
  priority: "low" | "medium" | "high" | "critical";
  reason: string | null;
}> {
  if (!input.title.trim() || !input.description.trim()) {
    throw AppError.badRequest("Title and description are required");
  }

  const [categories, wards] = await Promise.all([
    prisma.category.findMany({
      select: { slug: true, name: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.ward.findMany({
      select: { code: true, name: true },
      orderBy: { code: "asc" },
    }),
  ]);

  const result = await classifyTriage({
    title: input.title,
    description: input.description,
    categories,
    wards,
  });

  let categoryName: string | null = null;
  if (result.categorySlug) {
    const category = categories.find((c) => c.slug === result.categorySlug);
    categoryName = category?.name ?? null;
  }

  let wardName: string | null = null;
  if (result.wardCode) {
    const ward = wards.find((w) => w.code === result.wardCode);
    wardName = ward?.name ?? null;
  }

  return {
    categorySlug: result.categorySlug,
    categoryName,
    wardCode: result.wardCode,
    wardName,
    priority: result.priority,
    reason: result.reason,
  };
}
