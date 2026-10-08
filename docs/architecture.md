# System Architecture

## 1. System Requirements

### Functional Requirements
* Users can sign up, authenticate, and manage profile settings.
* Users can create, read, update, list, and soft-delete text notes with title and body.
* Users can attach tags to notes and filter notes by tag.
* Users can search notes by title keywords in real time.

### Non-Functional Requirements
* **High Availability**: 99.95% uptime SLA (< 4.38 hours downtime per year).
* **Low Latency**: $p_{95}$ read latency under 100ms; $p_{95}$ write latency under 200ms.
* **Scalability**: Support 1 million registered users with seamless horizontal scaling.
* **Security**: Data encrypted at rest (AES-256) and in transit (TLS 1.3) with JWT authentication.

---

## 2. Load and Capacity Estimations (1 Million Users)

### Baseline Assumptions
* Total registered users: $1,000,000$
* Daily Active Users (DAU): $20\% \times 1,000,000 = 200,000\text{ active users/day}$
* Average user activity per day: Reads $10\text{ times/day}$, Writes $2\text{ times/day}$
* Total seconds per day: $86,400\text{ seconds}$

### Read Operations per Second (RPS)
$$\text{Total Daily Reads} = 200,000 \times 10 = 2,000,000\text{ reads/day}$$
$$\text{Average Read RPS} = \frac{2,000,000}{86,400} \approx 23.15\text{ RPS}$$
$$\text{Peak Read RPS (3x Average multiplier)} = 23.15 \times 3 \approx 70\text{ RPS}$$

### Write Operations per Second (WPS)
$$\text{Total Daily Writes} = 200,000 \times 2 = 400,000\text{ writes/day}$$
$$\text{Average Write WPS} = \frac{400,000}{86,400} \approx 4.63\text{ WPS}$$
$$\text{Peak Write WPS (3x Average multiplier)} = 4.63 \times 3 \approx 14\text{ WPS}$$

### Storage Calculations per Year
* Average note size: Title (100 bytes) + Body (1 KB) + Metadata (100 bytes) $\approx 1.2\text{ KB/note}$
* Writes per year(assuming all writes represent new note creation): $400,000\text{ notes/day} \times 365\text{ days} = 146,000,000\text{ notes/year}$
* Raw data volume/year: $146,000,000 \times 1.2\text{ KB} \approx 175.2\text{ GB/year}$
* Accounting for indexes, metadata, and database overhead ($1.5\times$ factor):
$$\text{Total Storage Requirement} \approx 262.8\text{ GB/year}$$

---

## 3. Architecture Diagram

```text
                                +-------------------+
                                |    Client Layer   |
                                | (Browser / App)   |
                                +---------+---------+
                                          |
                                          v
                                +-------------------+
                                |    DNS (Route53)  |
                                +---------+---------+
                                          |
                                          v
                                +-------------------+
                                |   CDN (CloudFront)|  <-- Serves static frontend assets (HTML/CSS/JS)
                                +---------+---------+
                                          | API Requests
                                          v
                                +-------------------+
                                |   Load Balancer   |  <-- AWS ALB (SSL Termination)
                                |     (AWS ALB)   |
                                +----+---------+----+
                                     |         |
                     +---------------+         +---------------+
                     v                                         v
          +--------------------+                    +--------------------+
          |    App Server 1    |                    |    App Server 2    | (Horizontal Auto-scaling Node.js)
          +---+----------+-----+                    +---+----------+-----+
              |          |                              |          |
              |          +-----------------+  +---------+          |
              v                            v  v                    v
      +---------------+             +---------------+      +---------------+
      | Redis Cache   |             |               |      | PostgreSQL    |
      | (Notes/Sess)  |             |  SQS Queue    |      | Primary (Wr)  |
      +---------------+             +-------+-------+      +-------+-------+
                                            |                      |
                                            v                      v Replication
                                    +---------------+      +---------------+
                                    | Async Worker  |      | PostgreSQL    |
                                    | (Indexing/Email)     | Read Replica  |
                                    +---------------+      +---------------+
```
## Components

Client: Interacts with the platform via responsive web and mobile UIs.

DNS (Amazon Route 53): Resolves user domain requests to optimal CDN edge locations with low-latency routing.

CDN (CloudFront): Caches static frontend assets globally to minimize static load times and reduce backend traffic.

Load Balancer (AWS ALB): Distributes incoming HTTPS API traffic across application instances and handles SSL termination.

App Servers (Stateless Node.js Cluster): Processes REST API calls, executes business logic, enforces authentication, and queries datastores.

Cache (Redis Cluster): Redis is used to reduce cache-hit latency, with a target of sub-5ms application-level response time under normal conditions

Primary Database (PostgreSQL Master): Handles all transactional read-write operations while enforcing relational integrity constraints.

Read Replica (PostgreSQL Read Replica): Offloads read queries from the primary database to keep read latency low under heavy traffic.

Message Queue (AWS SQS): Decouples time-consuming background jobs (e.g. search indexing, audit logging) from synchronous HTTP request paths.

Worker Process: Consumes and processes asynchronous tasks from the message queue in the background.

## Step-by-step Request Flow

### Request Flow: GET /notes

1. Client issues HTTP GET /api/v1/notes with Bearer token.

2. Load Balancer verifies TLS certificate and forwards request to an available App Server.

3. App Server validates JWT token; checks Redis Cache for key user:{id}:notes.

4. Cache Hit: If data exists in Redis, returns cached JSON array to Client immediately ($<5\text{ms}$).

5. Cache Miss: On cache miss, App Server queries PostgreSQL Read Replica using index idx_notes_user_id_created_at.

6. App Server populates Redis Cache with retrieved notes (TTL set to 300s) and returns JSON response with HTTP 200 OK.

### Request Flow: POST /notes

1. Client submits POST /api/v1/notes containing JSON payload { "title": "...", "body": "..." }.

2. Load Balancer routes request to an App Server.

3. App Server validates payload rules (required title $\le 100$ characters).

4. App Server writes new record into PostgreSQL Primary Database.

5. App Server invalidates or updates Redis Cache key user:{id}:notes to ensure consistency.

6. App Server enqueues a background job into Message Queue for full-text search indexing.App Server responds to client with HTTP 201 Created and new note object.

7. Worker Process asynchronously consumes the queued message and updates search indexes.

## Trade-offs

(i)  Invalidating Redis cache and reading from Read Replicas introduces a slight replication lag ($\sim 10-50\text{ms}$) where reads right after a write might be briefly stale. This trade-off is acceptable to preserve high database read throughput.

(ii) Enqueuing indexing jobs to message queues increases system component count, but prevents slow external operations from blocking HTTP request threads.

## How to avoid single point of failure

Application Layer: Deploy app servers across multiple AWS Availability Zones (AZs) behind an Auto Scaling Group.

Database High Availability: Deploy a managed Redis service such as ElastiCache with appropriate replication/failover

Caching & Queue Resiliency: Deploy ElastiCache for Redis with replication and automatic failover across AZs.