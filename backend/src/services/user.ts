import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

export const getUser = async (stxAddress: string) => {
    const user = await db.select().from(users).where(eq(users.stxAddress, stxAddress)).limit(1);
    return user[0] || null;
};

export const upsertUser = async (stxAddress: string, data: Partial<typeof users.$inferInsert>) => {
    const existing = await getUser(stxAddress);
    if (existing) {
        const [updated] = await db.update(users)
            .set(data)
            .where(eq(users.stxAddress, stxAddress))
            .returning();
        return updated;
    } else {
        const [created] = await db.insert(users)
            .values({ ...data, stxAddress })
            .returning();
        return created;
    }
};
