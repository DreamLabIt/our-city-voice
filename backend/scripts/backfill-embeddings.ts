import { prisma } from "../src/db/prisma.js";
import { upsertPostEmbedding } from "../src/services/ai/embeddings.service.js";

async function main() {
  const posts = await prisma.post.findMany({
    where: { deletedAt: null },
    select: { id: true },
    orderBy: { id: "asc" },
  });

  console.log(`Found ${posts.length} posts to embed`);

  for (let i = 0; i < posts.length; i += 1) {
    const post = posts[i];
    try {
      await upsertPostEmbedding(post.id);
      console.log(`[${i + 1}/${posts.length}] Embedded post ${post.id}`);
    } catch (error) {
      console.error(`[${i + 1}/${posts.length}] Failed to embed post ${post.id}`, error);
    }
    // Small delay to avoid hitting rate limits
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.log("Done");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
