import { prisma } from "../../db/prisma.js";
import { embedText } from "../../lib/gemini/client.js";

function buildEmbeddingText(post: {
  title: string;
  description: string;
  category?: { name: string } | null;
  ward?: { name: string } | null;
}): string {
  const parts = [
    `Title: ${post.title}`,
    `Description: ${post.description}`,
  ];

  if (post.category?.name) {
    parts.push(`Category: ${post.category.name}`);
  }

  if (post.ward?.name) {
    parts.push(`Ward: ${post.ward.name}`);
  }

  return parts.join("\n");
}

export async function upsertPostEmbedding(postId: bigint): Promise<void> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      title: true,
      description: true,
      category: { select: { name: true } },
      ward: { select: { name: true } },
    },
  });

  if (!post) {
    return;
  }

  const text = buildEmbeddingText(post);
  const values = await embedText(text);

  await prisma.$executeRaw`
    INSERT INTO post_embeddings (post_id, embedding, model, dimensions, updated_at)
    VALUES (${postId}, ${JSON.stringify(values)}::vector, 'gemini-embedding-001', ${values.length}, NOW())
    ON CONFLICT (post_id)
    DO UPDATE SET
      embedding = EXCLUDED.embedding,
      model = EXCLUDED.model,
      dimensions = EXCLUDED.dimensions,
      updated_at = NOW()
  `;
}

export function upsertPostEmbeddingAsync(postId: bigint): void {
  void upsertPostEmbedding(postId).catch((error) => {
    // Intentionally swallow errors so embedding failures do not block post creation
    console.error("Failed to upsert post embedding", { postId: postId.toString(), error });
  });
}
