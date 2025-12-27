import { pgTable, serial, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    stxAddress: text('stx_address').notNull().unique(),
    btcName: text('btc_name'),
    reputationScore: integer('reputation_score').default(0),
    avatarUrl: text('avatar_url'),
    displayName: text('display_name'),
    bio: text('bio'),
    createdAt: timestamp('created_at').defaultNow(),
});

export const messages = pgTable('messages', {
    id: serial('id').primaryKey(),
    conversationId: text('conversation_id').notNull(),
    senderAddress: text('sender_address').notNull(),
    content: text('content').notNull(), // Encrypted blob reference or text
    isEncrypted: boolean('is_encrypted').default(true),
    createdAt: timestamp('created_at').defaultNow(),
});

export const conversations = pgTable('conversations', {
    id: text('id').primaryKey(), // UUID
    type: text('type').default('DIRECT'), // DIRECT, GROUP
    status: text('status').default('REQUESTED'), // REQUESTED, ACTIVE, ARCHIVED
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const participants = pgTable('participants', {
    id: serial('id').primaryKey(),
    conversationId: text('conversation_id').references(() => conversations.id).notNull(),
    userAddress: text('user_address').notNull(),
    joinedAt: timestamp('joined_at').defaultNow(),
    lastReadAt: timestamp('last_read_at'),
});
