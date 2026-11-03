import { prisma } from "../../db/prisma.js";
import { embedText } from "../../lib/gemini/client.js";
import { AppError } from "../../lib/errors.js";

type DuplicateMatch = {
  postId: string;
  trackingCode: string;
  title: string;
  similarity: number;
  wardName: string | null;
  categoryName: string | null;
  status: string;
};

export async function findDuplicates(input: {
  title: string;
  description: string;
  excludePostId?: bigint;
  limit?: number;
}): Promise<DuplicateMatch[]> {
  if (!input.title.trim() || !input.description.trim()) {
    throw AppError.badRequest("Title and description are required");
  }

  const text = `Title: ${input.title}\nDescription: ${input.description}`;
  const values = await embedText(text);

  const limit = Math.min(Math.max(input.limit ?? 5, 1), 10);

  const rows = await prisma.$queryRaw<
    Array<{
      post_id: bigint;
      tracking_code: string;
      title: string;
      similarity: number;
      ward_name: string | null;
      category_name: string | null;
      status: string;
    }>
  >`
    SELECT 
      p.id as post_id,
      p.tracking_code,
      p.title,
      1 - (pe.embedding <-> ${JSON.stringify(values)}::vector) as similarity,
      w.name as ward_name,
      c.name as category_name,
      p.status::text as status
    FROM post_embeddings pe
    JOIN posts p ON p.id = pe.post_id
    LEFT JOIN wards w ON w.id = p.ward_id
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.deleted_at IS NULL
    ${input.excludePostId ? prisma.$queryRaw`AND p.id != ${input.excludePostId}` : prisma.$queryRaw``}
    ORDER BY pe.embedding <-> ${JSON.stringify(values)}::vector
    LIMIT ${limit}
  `;

  return rows.map((row) => ({
    postId: row.post_id.toString(),
    trackingCode: row.tracking_code,
    title: row.title,
    similarity: Number(row.similarity),
    wardName: row.ward_name,
    categoryName: row.category_name,
    status: row.status,
  }));
}
