# Triển khai LA Group lên VPS Tino — runbook

> ⚠️ **File này viết cho phương án cũ (cutover trên `lahr.vn` đang có website chạy) — nay đã đổi.**
> Domain demo là `rg-nqhuy.io.vn` và tên miền khách hàng (mua ở tino.vn, chưa dùng), **cả hai đều trống**, nên **GĐ E và F (hạ TTL, pre-issue cert DNS-01, test `curl --resolve`, cutover canh giờ) KHÔNG áp dụng** — chỉ cần trỏ A record rồi xin cert HTTP-01 webroot bình thường.
> **Quy trình đang dùng: [`../VPS.md`](../VPS.md)**. File này giữ lại vì §Phần 1 (đánh giá tài nguyên VPS) và §Phần 2 (danh sách 22 vấn đề kèm bằng chứng) vẫn còn giá trị tham chiếu; GĐ A và B đã thực thi xong.
>
> **Trạng thái**: GĐ A + B ✅ xong. GĐ 0/C/D/G → đã gộp vào `VPS.md`. GĐ E/F → bỏ.
> Đây là phần triển khai thật của P9 — mã nguồn đã xong, artifact đã dựng, còn lại là thao tác trên VPS/DNS thật.
> Roadmap tổng thể ở [PLAN.md](PLAN.md); trạng thái + bẫy đã gặp ở [CLAUDE.md](../CLAUDE.md).
>
> **Cách dùng**: mỗi phiên nhận **một giai đoạn** (GĐ 0 → G) trong bảng ở Phần 3, làm trọn vẹn, chạy phần Verify của giai đoạn đó rồi commit.
> **Chỉ GĐ F chạm tới người dùng thật của website cũ** — mọi giai đoạn trước đều an toàn và có điểm rollback.
> GĐ 0, C, D, E, F, G cần **quyền SSH vào VPS và quyền sửa DNS** — Claude không có, phải do người dùng thực hiện hoặc cung cấp truy cập.

## Context

Mã nguồn P0–P9 đã xong; artifact deploy (`docker-compose.prod.yml`, `nginx/lahr.conf`, 2 Dockerfile, `scripts/{backup,restore}.sh`, `.env.prod.example`) đã dựng ở P9 nhưng **chưa từng chạy trên hạ tầng thật** — môi trường phát triển không có VPS/domain/SSH. Giờ đã có VPS, cần đưa site lên production.

**Ràng buộc quyết định plan này:**
- `lahr.vn` **đang có website cũ chạy thật** → không được đổi thẳng A record rồi mới test. Bắt buộc cutover qua staging + pre-issue cert.
- Gói VPS là **"N8N Basic" tự động cài n8n** → gần như chắc chắn đã có tiến trình chiếm 80/443, đụng với nginx của dự án. Đã chốt: gỡ hẳn stack n8n của Tino.
- Máy dev chỉ ~4GB RAM (`CLAUDE.md` đã ghi bẫy Turbopack crash vì hết RAM) → build image qua CI, không build cục bộ, và tuyệt đối không build trên VPS.

**Kết quả mong muốn**: `https://lahr.vn` chạy trên VPS với SSL hợp lệ, backup nightly mã hoá offsite, và người dùng site cũ không nhìn thấy một giây downtime hay lỗi cert nào.

---

## Phần 1 — Cấu hình VPS có đủ không?

**Đủ, còn thoải mái 12–24 tháng.** Ràng buộc thật không phải RAM mà là **disk do CV ứng viên tăng đều**.

### RAM 4GB — dùng ~1.5GB, dư ~2.5GB

| Thành phần | Tải thực tế | `mem_limit` đề xuất |
|---|---|---|
| Ubuntu + dockerd | ~650 MB | — |
| `postgres` | 250–350 MB | 768m |
| `backend` (uvicorn **1 worker**) | 300–400 MB | 768m |
| `frontend` (Next standalone) | 250–400 MB | 768m |
| `nginx` + `certbot` | ~45 MB | 128m + 128m |
| **Tổng (không n8n)** | **~1.45 GB** | Σ 2.56 GB |
| n8n nếu bật | +350–450 MB | 512m |

Tổng `mem_limit` cố ý đặt dưới 4GB: OOM killer sẽ giết đúng container vượt hạn mức thay vì chọn ngẫu nhiên và giết Postgres giữa lúc ghi.

**Giữ đúng 1 uvicorn worker** — rate limit `slowapi` và trần token chatbot đều là biến in-memory; 2 worker = 2 bộ đếm độc lập = giới hạn thành gấp đôi.

### CPU 4 vCPU — thừa
Nghẽn duy nhất là 1 worker Python. Với lưu lượng job board cấp tỉnh (<5 req/s đỉnh) là dư. Xem lại khi p95 `/api/jobs` > 500ms hoặc backend CPU > 150% kéo dài.

### Disk 30GB — ràng buộc thật

| Hạng mục | Ban đầu | Sau 12 tháng | Sau 24 tháng |
|---|---|---|---|
| OS + Docker + image | 6.7 GB | 8 GB | 9 GB |
| `db_data` | 60 MB | 250 MB | 450 MB |
| **`uploads` (CV)** | 0 | **2.4 GB** | **4.8 GB** |
| Backup local 14 ngày + log (đã giới hạn) | — | 0.55 GB | 0.65 GB |
| **Tổng** | ~7 GB | **~11 GB (37%)** | **~15 GB (50%)** |

Giả định ~100 hồ sơ/tháng × ~2MB. **Không giới hạn log Docker (json-file mặc định vô hạn) là nguyên nhân số 1 giết VPS nhỏ** — nginx + uvicorn access log ~50MB/ngày ≈ 18GB/năm, một mình đủ lấp đĩa.

### Nâng lên "N8N Pro" (6GB/60GB, 379k) khi bất kỳ điều nào xảy ra
`df -h /` > 75% · `uploads` > 8GB · `free -m` available < 500MB liên tục 24h · `dmesg | grep -i 'killed process'` có kết quả

### Những thứ trong gói KHÔNG dùng được
- **Tên miền miễn phí** — thường là `.site/.online/.xyz`, không thay được `lahr.vn`.
- **Backup hàng tuần của Tino** — mất tối đa 7 ngày dữ liệu, lại cùng nhà cung cấp nên không phải offsite thật. Không thay thế được cron nightly.
- **n8n tự động cài** — chính là thứ phải gỡ.

---

## Phần 2 — 22 vấn đề phải xử lý trước khi lên

### 🔴 Blocker (7) — không sửa thì stack không lên, hoặc lên nhưng vô dụng

| # | Vấn đề | Bằng chứng |
|---|---|---|
| 1 | **`backend/Dockerfile` không COPY `scripts/`** → không có `create_user.py` trong image = **không tạo được admin đầu tiên = không đăng nhập được Dashboard** | Dockerfile chỉ `COPY app`, `alembic`, `alembic.ini` |
| 2 | **nginx ↔ certbot deadlock**: block `:443` trỏ cert chưa tồn tại → nginx crash-loop → không phục vụ được `/.well-known/` → certbot không xin được cert | `nginx/lahr.conf` |
| 3 | **`backup.sh` chết dưới cron**: `set -u` bật nhưng `${POSTGRES_USER}`/`${POSTGRES_DB}` không guard và script không source `.env.prod` | `scripts/backup.sh` |
| 4 | **Tino auto-cài n8n chiếm 80/443** → `docker compose up` lỗi "address already in use" | gói "N8N Basic" |
| 15 | **`frontend` thiếu `INTERNAL_API_URL`** → `client.ts:1` rơi về `http://localhost:8000`, trong container frontend đó là chính nó. **Mọi Server Component fetch fail: trang chủ rỗng, `/viec-lam` rỗng, `(internal)/layout.tsx` gọi `/api/auth/me` fail → không vào được Dashboard** | `docker-compose.prod.yml` frontend chỉ có `NODE_ENV`; `frontend/lib/api/client.ts:1` |
| 16 | **`NEXT_PUBLIC_SITE_URL` đóng băng lúc build** (Next inline biến `NEXT_PUBLIC_*` vào bundle). Dockerfile không truyền → image hardcode `http://localhost:3000` vào `sitemap.xml`, `robots.txt`, `metadataBase`, JSON-LD. **Toàn bộ SEO của P4 vô hiệu** | `layout.tsx:4`, `robots.ts:3`, `sitemap.ts:8`, `OrganizationJsonLd.tsx:1` |
| 17 | **`docker compose` không đọc `.env.prod` cho `${...}`**. `env_file:` chỉ nạp biến vào container, không dùng cho substitution. Lệnh trong `commands.md:38` thiếu `--env-file .env.prod` → `${BACKEND_IMAGE}` rỗng (compose lỗi ngay), `${POSTGRES_USER}` rỗng mà `environment:` lại **đè lên** `env_file:` → Postgres init sai user | `commands.md:38` vs `docker-compose.prod.yml:16-18,24,30,48` |

### 🟠 Nghiêm trọng (7)

| # | Vấn đề |
|---|---|
| 5 | **`backup.sh` chỉ dump Postgres, không backup volume `uploads`** — toàn bộ CV ứng viên (PII) không có bản sao nào. Mất volume = DB còn record trỏ tới file không tồn tại |
| 6 | Không có `mem_limit` ở service nào trên máy 4GB |
| 7 | Không giới hạn log Docker → đầy đĩa |
| 18 | **nginx không reload sau certbot renew** (entrypoint thiếu `--deploy-hook`) → sau ~60–90 ngày site phục vụ cert hết hạn. Lỗi câm |
| 19 | **nginx cache IP upstream** (`proxy_pass http://backend:8000` hằng số) → resolve DNS 1 lần lúc load config. Mỗi lần `docker compose up -d` tạo lại container, IP đổi → **502 vĩnh viễn cho tới khi reload**. Nghĩa là mọi lần deploy đều sập site |
| 21 | **DB prod trống**: `alembic upgrade head` chỉ tạo schema. Không có `provinces`/`industrial_parks`/`job_categories`/`address_mappings` → admin không đăng tin được (form cần chọn KCN/ngành), `SearchBar` rỗng, `applications.province_code` FK sẽ vỡ |
| 22 | **AAAA của site cũ**: nếu chỉ đổi A record, client IPv6 (rất phổ biến trên mạng di động VN) vẫn vào site cũ → nửa người dùng thấy site cũ. Certbot HTTP-01 cũng ưu tiên IPv6 → validate nhầm server cũ |

### 🟡 Cần xử lý (8)
8 (backup Tino không thay được cron) · 9 (CI chưa có job build/push) · 10 (nginx thiếu gzip + cache header → Lighthouse 49/85) · 11 (thiếu HSTS/ssl tuning → khó đạt SSL Labs A) · 12 (nginx chỉ `listen` IPv4) · 13 (`certbot/certbot` + `n8nio/n8n` không pin tag) · 14 (Postgres default `effective_cache_size=4GB` giả định sở hữu cả máy) · 20 (`sitemap.xml` rỗng ngay sau deploy vì prerender lúc build không có backend — tự lành sau 1h nhờ `revalidate: 3600`, verify lại sau)

---

## Phần 3 — Runbook

`(A)` sửa repo · `(B)` thao tác VPS · `(D)` thao tác DNS

| GĐ | Tên | Loại | Ảnh hưởng site cũ | Thời lượng |
|---|---|---|---|---|
| 0 | Khảo sát & chốt thông tin | B + D(đọc) | Không | 1h |
| A | Sửa 22 vấn đề trong repo | A | Không | 3–5h |
| B | CI build & push GHCR | A | Không | 1h |
| C | Dọn stack n8n của Tino | B | Không | 1h |
| D | Deploy + test `staging.lahr.vn` | B + D(thêm record mới) | Không | 3–4h |
| E | Chuẩn bị cutover | D + B | Không | ~1 ngày chờ |
| **F** | **Cutover DNS** | D | **CÓ** | 30ph + theo dõi 24h |
| G | Vận hành & dọn dẹp | B | Không | 2h + 7 ngày quan sát |

### GĐ 0 — Khảo sát (chỉ đọc, không sửa gì)

**0.1 (D) Chụp toàn bộ DNS zone — đây chính là rollback plan.**
```bash
for t in A AAAA MX TXT; do echo "== $t"; dig +short $t lahr.vn @8.8.8.8; done
dig +short A lahr.vn @8.8.8.8; dig +short AAAA www.lahr.vn @8.8.8.8
dig lahr.vn SOA +noall +answer     # xem TTL hiện tại
```
Lưu ảnh chụp bảng DNS ở trang quản trị vào file. Ghi lại: IP A/AAAA cũ, TTL, nhà cung cấp DNS, có MX/TXT không (**email công ty — tuyệt đối không đụng**).

⚠️ Nếu DNS đang ở Cloudflare có proxy (đám mây cam) thì cutover khác hẳn — chỉ cần đổi IP origin, cert do Cloudflare cấp. Phải xác định điều này trước.

**0.2 (B) Khảo sát VPS** — ai đang giữ 80/443:
```bash
ss -tlnp | grep -E ':80\s|:443\s'
docker ps -a && docker compose ls
systemctl list-units --type=service --state=running | grep -iE 'caddy|traefik|nginx|n8n'
find / -maxdepth 4 -name 'docker-compose*.y*ml' 2>/dev/null
free -m; nproc; df -h; swapon --show; ufw status verbose
```
**Verify**: có kết luận rõ "tiến trình X giữ port 80, thuộc unit/compose Y ở đường dẫn Z".

### GĐ A — Sửa repo (máy dev)

**A0. Commit working tree hiện tại trước.** Đang có nhiều file dirty (migration `6875eab5dcc5`, `leads.py`, `antispam.py`, `ChatQuiz.tsx`…) mà CI chưa từng chạy qua. Chạy đủ `ruff`/`alembic check`/`pytest` + `lint`/`typecheck`/`test`/`build` rồi commit, đợi CI xanh.

| Sửa | File | Nội dung |
|---|---|---|
| #1 | `backend/Dockerfile` | thêm `COPY scripts ./scripts` |
| #16 | `frontend/Dockerfile` | thêm `ARG NEXT_PUBLIC_SITE_URL` + `ENV` **trước** `RUN npm run build` |
| #15,17 | `docker-compose.prod.yml` | frontend thêm `env_file: .env.prod` + `INTERNAL_API_URL: http://backend:8000`; frontend thêm healthcheck; `depends_on` dùng `condition: service_healthy` |
| #6 | `docker-compose.prod.yml` | `mem_limit` theo bảng RAM ở Phần 1 |
| #7 | `docker-compose.prod.yml` | mỗi service: `logging: driver: json-file, options: {max-size: 10m, max-file: "3"}` |
| #13 | `docker-compose.prod.yml` | pin `certbot/certbot:v5.1.0`, `n8nio/n8n:1.<x>` |
| #14 | `docker-compose.prod.yml` | postgres `command:` đặt `shared_buffers=256MB`, `effective_cache_size=1GB`, `max_connections=50` |
| #18 | `docker-compose.prod.yml` | certbot entrypoint thêm `--deploy-hook "..."` reload nginx |
| #19 | `nginx/lahr.conf` | dùng biến + `resolver 127.0.0.11 valid=10s;` để nginx re-resolve DNS Docker |
| #2 | `nginx/` | tách `bootstrap.conf` (chỉ `:80`, dùng lần đầu) và `lahr.conf`; chọn qua biến `NGINX_CONF` trong `.env.prod` |
| #10,11,12 | `nginx/lahr.conf` | `gzip`; `Cache-Control immutable` cho `/_next/static/`; HSTS + `ssl_ciphers` + `ssl_session_cache`; `listen [::]:80/443`; `default_server` + `ssl_reject_handshake` |
| #3,5 | `scripts/backup.sh` | guard `:?` cho mọi biến + `set -a; . .env.prod; set +a`; **thêm `docker run --rm -v lahr_uploads:/data ... tar` để backup volume `uploads`** |
| #17 | `.claude/rules/commands.md` | mọi lệnh compose phải có `--env-file .env.prod`; gọn nhất là thêm `scripts/dc.sh` wrapper |

**Verify GĐ A**: `docker build` cả 2 image thành công; `docker compose --env-file .env.prod -f docker-compose.prod.yml config` in ra đúng giá trị đã thay thế, không còn chuỗi rỗng.

### GĐ B — CI build & push GHCR
Thêm job vào `.github/workflows/ci.yml`: `docker/login-action` (GITHUB_TOKEN) + `docker/build-push-action`, chỉ chạy trên `main` sau khi 2 job test xanh, truyền `NEXT_PUBLIC_SITE_URL=https://lahr.vn` làm build-arg. Đặt package **public** để miễn phí (image không chứa secret — `.dockerignore` đã loại `.env`).
**Verify**: `docker pull ghcr.io/<org>/backend:<sha>` từ VPS thành công.

### GĐ C — Dọn n8n Tino
Backup dữ liệu n8n trước (`docker run --rm -v <n8n_vol>:/data ... tar czf`), rồi `docker compose down` stack cũ / `systemctl disable --now` unit chiếm cổng.
**Verify**: `ss -tlnp | grep -E ':80|:443'` **không ra gì**.
**Rollback**: `docker compose up -d` lại stack cũ từ đường dẫn đã ghi ở GĐ 0.

### GĐ D — Deploy + test trên `staging.lahr.vn`
1. `(D)` Thêm A/AAAA record `staging.lahr.vn` → IP VPS (record mới, **không đụng `@`/`www`**)
2. `(B)` `git clone` → `cp .env.prod.example .env.prod` điền secret thật (`JWT_SECRET_KEY` random, `POSTGRES_PASSWORD`, `OPENAI_API_KEY`, `PUBLIC_SITE_URL=https://staging.lahr.vn`)
3. Bootstrap SSL: `NGINX_CONF=bootstrap.conf` → `up -d nginx` → certbot webroot xin cert cho staging → đổi `NGINX_CONF=lahr.conf` → recreate
4. **#21 Nạp taxonomy**: `docker compose exec backend python -m scripts.seed_dev` (hoặc chỉ phần taxonomy nếu không muốn job/post mẫu)
5. **#1 Tạo admin**: `docker compose exec backend python -m scripts.create_user --email ... --role admin`
6. `ufw` chỉ 80/443 + SSH port mới; `fail2ban`; đổi port SSH
7. Cấu hình `rclone` + cron nightly `0 2 * * *`, **chạy thử `env -i ./scripts/backup.sh`** (bắt lỗi #3), rồi **restore thật vào DB trống**

**Verify GĐ D**: đăng nhập Dashboard được · đăng 1 tin thật · nộp 1 hồ sơ thật + tải CV về · chatbot trả lời đúng tin trong DB · `curl -sS https://staging.lahr.vn/sitemap.xml | grep staging` ra kết quả (verify #16) · `docker compose up -d --force-recreate backend` rồi curl ngay → **không 502** (verify #19) · SSL Labs ≥ A · `nmap` từ ngoài chỉ thấy 80/443/SSH mới

### GĐ E — Chuẩn bị cutover (chưa ảnh hưởng ai)

**E1 (D)** Hạ TTL của `@` và `www` (A + AAAA) xuống **300s**, **không đổi IP**. Chờ ≥ TTL cũ (nếu cũ là 86400 thì chờ 24h). Bỏ bước này thì rollback ở GĐ F sẽ mất 24h thay vì 5 phút.

**E2 (B+D) Pre-issue cert cho `lahr.vn` + `www` bằng DNS-01** — bước then chốt. Không dùng HTTP-01 được vì `lahr.vn` vẫn trỏ server cũ, challenge sẽ đến server cũ. Nếu đợi đổi DNS xong mới xin cert thì có cửa sổ vài phút mọi người dùng thấy "kết nối không riêng tư".
```bash
docker compose ... run --rm --entrypoint certbot certbot certonly \
  --manual --preferred-challenges dns --agree-tos -m admin@lahr.vn \
  -d lahr.vn -d www.lahr.vn
```
Thêm 2 bản ghi TXT `_acme-challenge` / `_acme-challenge.www`, **`dig +short TXT` xác nhận thấy giá trị rồi mới Enter** (Enter sớm = fail + tốn 1 lượt rate limit; Let's Encrypt cho 5 cert trùng tên/tuần).
*Dự phòng nếu registrar không cho thêm TXT*: cấu hình server cũ proxy `/.well-known/acme-challenge/` về IP VPS rồi dùng HTTP-01.

**E3 (B)** Đổi `NGINX_CONF=lahr.conf` phục vụ cả 3 hostname; đổi `CORS_ORIGINS=["https://lahr.vn"]` + `PUBLIC_SITE_URL=https://lahr.vn`; recreate nginx + backend.

**E4 (B) Bài test quyết định — phục vụ `lahr.vn` từ VPS TRƯỚC khi đổi DNS**, dùng `--resolve` để ép curl đi tới IP VPS trong khi cả thế giới vẫn vào server cũ:
```bash
VPS=<VPS_IPv4>
curl -sS  --resolve lahr.vn:443:$VPS     https://lahr.vn/api/health     # {"status":"ok"}
curl -sSI --resolve www.lahr.vn:443:$VPS https://www.lahr.vn/ | head -5 # 200
echo | openssl s_client -connect $VPS:443 -servername lahr.vn 2>/dev/null \
  | openssl x509 -noout -subject -dates -ext subjectAltName
curl -sS --resolve lahr.vn:443:[<VPS_IPv6>] https://lahr.vn/api/health   # nếu sẽ đặt AAAA
```
**Tất cả phải xanh, tuyệt đối không dùng `-k`.** Bất kỳ dòng nào fail → DỪNG, không đổi DNS.

**E5 Go/No-Go**: E4 xanh 100% kể cả IPv6 · TTL đã 300 và đã trôi qua ≥ TTL cũ · nội dung thật đã nhập · admin đăng nhập được · backup chạy + restore đã verify · **đã purge hồ sơ/lead test khỏi DB prod** (PII giả) · đã lưu IP + DNS cũ ra file · server cũ vẫn chạy và giữ ≥7 ngày · đã chốt có cần redirect URL cũ đã được Google index không · chọn khung 22:00–06:00

### GĐ F — CUTOVER 🔴 ảnh hưởng người dùng thật

**F1 (D)** Đổi **A và AAAA cùng lúc** cho `@` và `www` (hoặc **xoá AAAA** nếu không dùng IPv6). **Không đụng MX, TXT/SPF/DKIM.**
Để nguyên AAAA trỏ server cũ = client IPv6 vào site cũ, client IPv4 vào site mới → hai nhóm người dùng thấy hai website khác nhau, kiểu lỗi mất cả ngày mới truy ra.

**F2 (D)** Theo dõi lan truyền qua nhiều resolver (`8.8.8.8`, `1.1.1.1`, resolver VN) — kỳ vọng ≤5–15 phút với TTL 300.

**F3** Verify từ ngoài, không `--resolve` nữa: `/api/health`, `301` từ http, `sitemap.xml` chứa `https://lahr.vn/viec-lam/`, `robots.txt` trỏ đúng sitemap.

**Rollback**: đổi A/AAAA về IP cũ đã lưu ở GĐ 0. Với TTL 300 thì phục hồi trong ~5 phút. Đây chính là lý do E1 bắt buộc.

### GĐ G — Vận hành
Google Search Console + Rich Results Test thật · Facebook Sharing Debugger · Lighthouse mobile qua domain thật (đo lại #10, mục tiêu Performance ≥85) · xác nhận cron backup chạy đêm đầu tiên · `docker image prune -af` định kỳ · giữ server cũ ≥7 ngày trước khi tắt.

---

## Verification tổng thể

Đúng 7 hạng mục DoD P9 chưa verify được trước đây, giờ chạy thật:

- [ ] `https://lahr.vn` chạy, **SSL Labs ≥ A**, http → https
- [ ] `docker stats` tổng < 2GB; `df -h /` < 40%
- [ ] `nmap` từ máy ngoài chỉ thấy 80/443/SSH-port-mới
- [ ] Cron backup chạy thật, file mã hoá đã lên remote, **restore thử thành công vào DB trống**, và **backup có cả volume `uploads`**
- [ ] `curl https://lahr.vn/docs` → 404
- [ ] Lighthouse mobile: Performance ≥85, SEO ≥95
- [ ] Google Rich Results Test `JobPosting` pass + Facebook Sharing Debugger hiện đúng OG

Thêm 3 hạng mục sinh ra từ các bug phát hiện trong plan này:
- [ ] `docker compose up -d --force-recreate backend` xong, curl ngay **không 502** (#19)
- [ ] `sitemap.xml` sau 1h chứa URL job thật với domain `https://lahr.vn` (#16, #20)
- [ ] Sau khi certbot renew (test bằng `certbot renew --dry-run` + kiểm deploy-hook), nginx thực sự reload (#18)

## Cập nhật tài liệu

Theo quy ước bắt buộc ở `CLAUDE.md`: tích DoD P9 trong `docs/PLAN.md`, xoá mục "Verify hạ tầng thật" khỏi §Việc còn nợ, cập nhật bảng Trạng thái trong `CLAUDE.md`, thêm các bẫy mới gặp (mỗi mục 1 dòng), và sửa `.claude/rules/commands.md` cho đúng lệnh thật (`--env-file`, `dc.sh`).
