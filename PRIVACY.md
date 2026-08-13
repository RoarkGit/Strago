# Privacy Policy

_Last updated: 2026-08-13_

This Privacy Policy explains what data Strago (the "Bot") collects, why, and how it's handled. Strago is operated by Liam Galt for the Blue Academy Discord server and any other servers it's installed in.

## Data We Collect

Depending on which features are used, Strago may collect and store:

- **Discord user ID**, associated with your FFXIV character registration (`/register`), fill notification preferences (`/fill`), and moderation timeout counts.
- **FFXIV character information** (character name and Lodestone ID) that you provide via `/register`, used to look up public achievement data for role granting.
- **Archived message content and attachments**: when a moderator runs `/shortcuts set` on a specific message, that message's text and any attached files are stored for later retrieval via lookup commands.

Strago also temporarily caches recent message content in memory (via Discord's own client library) so that if a message is deleted, its content can be logged to a staff-only moderation channel. This cache is not written to our database, it lives only in the bot process's memory.

We do not collect or store presence data, DMs, or a general history of your messages.

## How We Use This Data

Collected data is used solely to operate the Bot's features: role management, moderation actions (kicks, bans, timeouts), fill notifications, and the shortcut/FAQ lookup system. We do not sell this data, share it with third parties, or use message content to train machine learning or AI models.

## Where Data Is Stored

Data is stored in a MongoDB database on infrastructure we operate directly, with full-disk encryption (LUKS) at rest. Data is retained indefinitely until deleted, we do not currently apply automatic expiration.

## Your Rights

You can request deletion of your data (character registration, fill preferences, timeout record, or archived shortcut content) at any time by contacting the Bot maintainer on Discord: **liam_galt**.

## Changes to This Policy

We may update this policy as the Bot's features change. Material changes will be reflected in the "Last updated" date above.

## Contact

Questions about this policy can be directed to **liam_galt** on Discord, or via the [Blue Academy Discord server](https://discord.gg/blueacademy).
