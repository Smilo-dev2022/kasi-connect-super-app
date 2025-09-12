# Wireframe: Ward Dashboard

Goal: Quick access to local updates, safety rooms, issues, and groups. Emphasize CPF visibility.

## Top Bar

```
┌ Ward 68, Johannesburg ┐  [Bell] [Avatar]
```

- Tap ward name to switch wards (if member of multiple)

## Header Modules (Cards)

```
[ Alerts (Safety) ]  [ Service Status ]
[ CPF Rooms ]        [ Report Issue ]
```

- Alerts: red if active alert from CPF/safety rooms
- Service Status: water/power/waste quick indicators

## Feed

```
┌─ Update from Ward Office (Pinned)
│  Load-shedding update Stage 2 today 16:00-20:00
├─ CPF Safety Room: Suspicious activity near Main & 7th
├─ Group Post: Clean-up Saturday 9am, Park entrance
└─ ...
```

- Filter chips: All | Official | CPF | My Groups
- Media inline: images, short video thumbnails

## Quick Actions

```
[ + Post ]  [ Report Issue ]  [ Join Group ]
```

## Bottom Nav

```
[ Dashboard ] [ Chats ] [ Report ] [ Groups ] [ Settings ]
```

---

## Edge Cases
- New user with no groups: show onboarding CTA to join top local groups
- Active alert: persistent banner with link to CPF safety room
- Offline: cached last feed; mark items as stale; queue posts

## Acceptance Criteria
- Key actions reachable within two taps from landing
- CPF alerts visually distinct and accessible
- Performance: feed loads first contentful in ≤ 1.5s on 3G

