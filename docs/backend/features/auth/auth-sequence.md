# Auth sequence diagrams

How chat sign-in works, step by step. The rules and payloads are in [los-chat-handoff.md](los-chat-handoff.md); this page only shows the order of calls.

Lifetimes: staff access token **15 min**, customer access token **1 h**, refresh token **24 h from sign-in** (refreshing never extends it).

## 1. Staff sign-in (los_web → chat_web)

```mermaid
sequenceDiagram
    autonumber
    participant LW as los_web (parent page)
    participant CW as chat_web (iframe)
    participant LB as los_backend
    participant CB as chat_backend
    participant DB as Postgres

    CW->>LW: postMessage { type: CHAT_READY }
    LW->>LB: POST /api/v1/admin/chat/handoff-token<br/>Bearer: los_web's LOS token
    LB-->>LW: handoff token (RS256, aud=chat, tokenType=chat-handoff, 2 min)
    LW->>CW: postMessage { type: CHAT_AUTH_HANDOFF, token }
    CW->>CB: POST /agent/api/v1/auth/session { handoffToken }
    CB->>CB: Verify with LOS JWKS (iss, aud, type=staff, tokenType)
    CB->>DB: Look up role by name (unknown → 401)
    CB->>DB: Upsert chat_users (los_user_id, type=STAFF)
    CB->>DB: Delete user's expired refresh tokens
    CB->>DB: Insert refresh_tokens (new family_id, SHA-256 hash, expires_at = now + 24 h)
    CB-->>CW: 201 { accessToken (HS256, aud=chat-staff, 15 min), refreshToken, refreshExpiresAt, user }
    Note over CW: Tokens kept in memory only
```

## 2. Customer sign-in (Flutter)

```mermaid
sequenceDiagram
    autonumber
    participant App as Flutter app
    participant LB as los_backend
    participant CB as chat_backend
    participant DB as Postgres

    Note over App: Already signed in to LOS
    opt LOS access token expired
        App->>LB: Refresh LOS token
        LB-->>App: new LOS access token
    end
    App->>CB: POST /customer/api/v1/auth/session { losToken }
    CB->>CB: Verify with LOS JWKS (aud=luyleun, type=customer, tokenType=access)
    CB->>DB: Upsert chat_users (los_user_id, type=CUSTOMER, CUSTOMER role)
    CB->>DB: Delete user's expired refresh tokens
    CB->>DB: Insert refresh_tokens (new family_id, expires_at = now + 24 h)
    CB-->>App: 201 { accessToken (aud=chat-customer, 1 h), refreshToken, refreshExpiresAt, user }
```

## 3. Using the session (REST and Socket.io)

```mermaid
sequenceDiagram
    autonumber
    participant C as Client (chat_web / Flutter)
    participant CB as chat_backend

    C->>CB: GET /agent|customer/api/v1/... <br/>Authorization: Bearer accessToken
    CB->>CB: Verify HS256 signature, expiry, audience matches route prefix
    CB-->>C: 200 data (or 401 if missing / expired / wrong audience)

    C->>CB: Socket.io connect { auth: { token: accessToken } }
    CB->>CB: Same check in handshake middleware
    CB-->>C: connected (or connect_error)
```

## 4. Refresh (rotation and reuse detection)

```mermaid
sequenceDiagram
    autonumber
    participant C as Client
    participant CB as chat_backend
    participant DB as Postgres

    Note over C: Access token about to expire, or a call returned 401
    C->>CB: POST /…/auth/refresh { refreshToken: R1 }
    CB->>DB: Find refresh_tokens by SHA-256(R1)

    alt Not found, expired, or other audience
        CB-->>C: 401 → sign in again (section 1 or 2)
    else Already revoked (R1 was used before)
        CB->>DB: Revoke the whole family
        Note over CB: Logged as possible token theft
        CB-->>C: 401 → sign in again
    else Valid
        CB->>DB: BEGIN
        CB->>DB: UPDATE R1 SET revoked_at, replaced_by_id = R2<br/>WHERE revoked_at IS NULL
        alt 0 rows (a parallel refresh won the race)
            CB->>DB: COMMIT (nothing written), then revoke the whole family
            CB-->>C: 401 → sign in again
        else 1 row
            CB->>DB: INSERT R2 (same family_id, same expires_at)
            CB->>DB: COMMIT
            CB-->>C: 200 { new accessToken, refreshToken: R2, refreshExpiresAt }
            Note over C: Replace R1 with R2. R1 never works again.
        end
    end
```

## 5. Logout

```mermaid
sequenceDiagram
    autonumber
    participant LW as los_web
    participant C as chat_web / Flutter
    participant CB as chat_backend
    participant DB as Postgres

    opt Staff only
        LW->>C: postMessage { type: CHAT_LOGOUT }
    end
    C->>CB: POST /…/auth/logout { refreshToken }
    CB->>DB: Revoke every token in that family
    CB-->>C: 200 { data: null } (also for an unknown token)
    C->>C: Clear tokens, disconnect socket
```

## 6. Staff session lost (reload or 24 h limit)

```mermaid
sequenceDiagram
    autonumber
    participant LW as los_web
    participant CW as chat_web
    participant CB as chat_backend

    CW->>CB: POST /agent/api/v1/auth/refresh
    CB-->>CW: 401
    CW->>LW: postMessage { type: CHAT_TOKEN_EXPIRING }
    Note over LW,CB: los_web repeats section 1 from step 2
```
