import { db } from '../db';
import { messages, conversations, participants, users } from '../db/schema';
import { eq, asc, desc, and, ne, like, or, inArray, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export const saveMessage = async (data: { conversationId: string, senderAddress: string, content: string, isEncrypted: boolean }) => {
    // Check if conversation exists and is active? optional.
    const [saved] = await db.insert(messages).values({
        conversationId: data.conversationId,
        senderAddress: data.senderAddress,
        content: data.content,
        isEncrypted: data.isEncrypted || false
    }).returning();

    // Update conversation updatedAt
    await db.update(conversations)
        .set({ updatedAt: new Date() })
        .where(eq(conversations.id, data.conversationId));

    return saved;
};

export const getMessages = async (conversationId: string) => {
    return await db.select().from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(asc(messages.createdAt));
};

export const createConversation = async (initiatorAddress: string, recipientAddress: string) => {
    // Check if conversation already exists
    // convoluted query because we need to find a convo where both are participants and type is DIRECT

    const usersConversations = await db.select({
        conversationId: participants.conversationId
    })
        .from(participants)
        .where(eq(participants.userAddress, initiatorAddress));

    const convIds = usersConversations.map(c => c.conversationId);

    if (convIds.length > 0) {
        const existing = await db.select({
            conversationId: participants.conversationId
        })
            .from(participants)
            .leftJoin(conversations, eq(conversations.id, participants.conversationId))
            .where(and(
                eq(participants.userAddress, recipientAddress),
                inArray(participants.conversationId, convIds),
                eq(conversations.type, 'DIRECT')
            ));

        if (existing.length > 0) {
            return { id: existing[0].conversationId, isNew: false };
        }
    }

    // Create new
    const conversationId = randomUUID();

    await db.transaction(async (tx) => {
        await tx.insert(conversations).values({
            id: conversationId,
            type: 'DIRECT',
            status: 'REQUESTED'
        });

        await tx.insert(participants).values([
            { conversationId, userAddress: initiatorAddress },
            { conversationId, userAddress: recipientAddress }
        ]);
    });

    return { id: conversationId, isNew: true };
};

export const getConversations = async (userAddress: string) => {
    // Get all conversations for user
    const myConvos = await db.select({
        conversationId: participants.conversationId,
        status: conversations.status,
        updatedAt: conversations.updatedAt,
    })
        .from(participants)
        .innerJoin(conversations, eq(conversations.id, participants.conversationId))
        .where(eq(participants.userAddress, userAddress))
        .orderBy(desc(conversations.updatedAt));

    // For each convo, get the other participant and last message
    const results = await Promise.all(myConvos.map(async (convo) => {
        const otherParticipant = await db.select({
            address: participants.userAddress,
            name: users.btcName,
            avatarUrl: users.avatarUrl
        })
            .from(participants)
            .leftJoin(users, eq(users.stxAddress, participants.userAddress))
            .where(and(
                eq(participants.conversationId, convo.conversationId),
                ne(participants.userAddress, userAddress)
            ))
            .limit(1);

        const lastMessage = await db.select()
            .from(messages)
            .where(eq(messages.conversationId, convo.conversationId))
            .orderBy(desc(messages.createdAt))
            .limit(1);

        const other = otherParticipant[0] || { address: 'Unknown', name: null, avatarUrl: null };

        return {
            id: convo.conversationId,
            status: convo.status,
            updatedAt: convo.updatedAt,
            otherUser: {
                address: other.address,
                name: other.name,
                avatarUrl: other.avatarUrl
            },
            lastMessage: lastMessage[0] || null
        };
    }));

    return results;
};

export const searchUsers = async (query: string) => {
    return await db.select()
        .from(users)
        .where(or(
            like(users.stxAddress, `%${query}%`),
            like(users.btcName, `%${query}%`)
        ))
        .limit(10);
};

export const updateConversationStatus = async (conversationId: string, status: string) => {
    await db.update(conversations)
        .set({ status })
        .where(eq(conversations.id, conversationId));
};

export const getConversationById = async (conversationId: string) => {
    const convo = await db.select()
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .limit(1);

    if (convo.length === 0) return null;

    const parts = await db.select({
        address: participants.userAddress,
        name: users.btcName
    })
        .from(participants)
        .leftJoin(users, eq(users.stxAddress, participants.userAddress))
        .where(eq(participants.conversationId, conversationId));

    return {
        ...convo[0],
        participants: parts.map(p => ({
            address: p.address,
            name: p.name
        }))
    };
};
