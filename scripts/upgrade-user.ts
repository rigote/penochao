
import { db } from "../src/db";
import { users } from "../src/db/schema/auth";
import { eq } from "drizzle-orm";

const TARGET_EMAIL = "matheus.rigote@gmail.com";

async function upgrade() {
  console.log(`Upgrading user ${TARGET_EMAIL} to PRO...`);

  const [updatedUser] = await db
    .update(users)
    .set({ plan: "pro" })
    .where(eq(users.email, TARGET_EMAIL))
    .returning();

  if (updatedUser) {
    console.log("✅ Success! User is now PRO.");
    console.log(updatedUser);
  } else {
    console.log("❌ User not found.");
  }
  process.exit(0);
}

upgrade().catch(console.error);
