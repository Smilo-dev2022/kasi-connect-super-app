# UX Spec: Groups

## Purpose
Enable residents to discover, join, and participate in local interest or functional groups (e.g., Clean-up Crew, Neighborhood Watch, School Parents).

## Core User Stories
- As a resident, I can browse recommended groups for my ward.
- As a resident, I can request to join a private group and be approved by a moderator.
- As a moderator, I can review join requests and remove members who violate rules.
- As a user, I can post text, images, video, and documents to a group.

## IA and Navigation
- Discovery entry points: Dashboard CTA, Groups tab, search.
- Group detail: cover image, description, rules, member count, join/leave.
- Tabs: Posts | About | Members | Media

## Roles & Permissions
- Member: create posts, react, report content.
- Moderator: approve requests, delete posts, mute/ban members.
- Owner: assign moderators, set group rules, visibility (public/closed).

## Privacy & Safety
- Default visibility: group metadata public; content only visible to members.
- Clear rule display before join; must accept rules to proceed.
- Report content flow routes to moderators first.

## Notifications
- Batched digests by default; per-group granular settings (All, Mentions, None).

## Edge Cases
- Full group: show waitlist if capacity set.
- Spam prevention: new members rate-limited for first 24h.
- Inactive groups: suggest merge with similar groups (admin tool).

## Acceptance Criteria
- Join/leave completes in ≤ 2 taps; rule acceptance recorded.
- Mods can approve/deny with one swipe; actions are auditable.

