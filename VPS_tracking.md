# VPS_tracking.md — Tiến độ triển khai thật trên VPS

> File theo dõi tiến độ deploy trên **VPS thật** (khác `VPS.md` là hướng dẫn quy trình chung). Cập nhật file này mỗi khi có phiên làm việc mới trên VPS. Không lặp lại nội dung đã có ở `CLAUDE.md`/`VPS.md` — chỉ ghi trạng thái hiện tại + việc còn nợ.

**Cập nhật lần cuối**: 2026-08-09 — Phase 1 (chạy trên `rg-nqhuy.io.vn`) **hoàn thành** + đã vá 3 lỗi UX mobile báo qua test thật trên điện thoại + 1 bug hạ tầng (`frontend` healthcheck).

### Đợt sửa lỗi mobile UX (cùng ngày, sau khi Phase 1 lên)

Người dùng báo qua điện thoại thật: (1) thanh tìm kiếm sticky che hết nội dung, (2) bấm icon chatbot không phản hồi, (3) muốn chatbot chủ động chào. Tái hiện + verify bằng Puppeteer thật (viewport 375/390/1280px) vì máy này không có Chrome/Playwright sẵn — đã cài `libnspr4`/`libnss3`/... + `npm install puppeteer` để chạy được.

- **Root cause 1**: `SiteHeader.tsx` gộp `TopBar+MainNav+SearchBar` vào một `<header className="sticky">` → cao **461px trên iPhone (55% của viewport 844px)**. Fix: tách `SearchBar` ra khỏi khối sticky, thu 5 ô lọc sau nút "Bộ lọc" trên mobile (ẩn bằng `display:none`, không unmount). Còn **64px (8%)**.
- **Root cause 2**: nút chat thực ra vẫn nhận click đúng (verify bằng `page.tap()` + `elementFromPoint`) — vấn đề thật là `bottom-4` thuần bị **thanh công cụ trình duyệt di động** (Chrome/Safari iOS — log nginx cho thấy `CriOS`) vẽ đè lên, người dùng bấm trúng thanh công cụ. Fix: cộng `env(safe-area-inset-bottom)`, panel đổi `vh`→`dvh`.
- **Yêu cầu 3**: thêm bóng chào tự động sau 2.5s, tự thu sau 8s, `sessionStorage` chỉ 1 lần/phiên. **Thử phương án mở hẳn panel trước, bị bác** vì panel chiếm 78% màn hình và overlay của nó nuốt mất cú chạm đầu tiên của người dùng (verify bằng `elementFromPoint` tại tâm nút "Tìm việc làm" — bị overlay chặn) — đổi sang bóng chữ nhỏ theo yêu cầu người dùng.
- **Bug phụ phát hiện khi kiểm tra lại**: `docker inspect` cho thấy container `frontend` đã `unhealthy` với `FailingStreak≈389` **từ lúc deploy Phase 1** (không phải do đợt sửa này) — Next.js standalone `server.js` bind theo `process.env.HOSTNAME`, Docker tự set biến này = container ID, `/etc/hosts` map ID đó về IP bridge (không phải `127.0.0.1`) → healthcheck `fetch('http://localhost:3000/')` luôn refused dù site vẫn chạy bình thường qua nginx. Fix: ép `HOSTNAME: "0.0.0.0"` trong `docker-compose.prod.yml`. Chi tiết đầy đủ + bài học ở `docs/PITFALLS.md`.

**Quy trình deploy gặp trở ngại**: VPS này **không có git credential** để push (`git push` báo lỗi "could not read Username"), dù đã `git clone` được (chỉ cần quyền đọc). Giải: người dùng dùng panel **Source Control của VS Code** (đã đăng nhập GitHub sẵn trong IDE, đang Remote-SSH vào đúng VPS này) để push — Bash tool/terminal của agent không tự có credential đó dù cùng máy. Nếu VPS cần push code lần sau, lặp lại cách này hoặc cấu hình PAT/SSH deploy key tường minh.

Cả 3 fix + bug healthcheck đã **verify sống trên production** bằng Puppeteer thật nhắm thẳng `https://rg-nqhuy.io.vn` sau khi CI build xong + `docker compose up -d --force-recreate frontend`.

---

## 1. Thông tin VPS

| Mục | Giá trị |
|---|---|
| Nhà cung cấp | Tino, gói "N8N Basic" (4GB RAM / 30GB NVMe) |
| Hostname | `rg-nqhuy` |
| IP public | `103.142.26.63` |
| Domain hiện tại (khách hàng, chính thức) | `vieclam-lagroup.vn` — DNS A record đã trỏ đúng VPS, DNSSEC bật (DNSKEY + RRSIG xác nhận qua `dig`) |
| Domain demo cũ | `rg-nqhuy.io.vn` — **đã ngưng phục vụ** (không còn trong `server_name` của nginx, gọi HTTPS vào domain này sẽ lỗi TLS handshake "unrecognized name" — đây là hành vi đúng, không phải lỗi) |
| Đường dẫn repo trên VPS | `/root/LA_Group` (⚠️ khác `/opt/lahr` mà `VPS.md` giả định — không sao vì `scripts/dc.sh` dùng path tương đối, nhưng nhớ điều này nếu viết script/cron mới) |
| SSH | Port `22` (fallback) **và** `2222` (mới) đều đang mở |
| OS | Ubuntu, kernel `6.8.0-137-generic` |

---

## 2. Đã hoàn thành (Phase 1)

- [x] **§0 điều kiện tiên quyết**: repo qua GĐ A đủ 10/10 mục, image `lahr-backend`/`lahr-frontend:latest` đã pull được từ GHCR (public).
- [x] **§1 hệ điều hành**: swap 2GB đã có sẵn, timezone `Asia/Ho_Chi_Minh` đã đúng, Docker 29.7.2 đã cài sẵn.
- [x] **§2 gỡ stack n8n Tino**: backup 4 volume (`n8n_n8n_data`, `n8n_nocodb_data`, `n8n_postgres_data`, `n8n_redis_data`) + thư mục config `/opt/n8n` + `/opt/n8n-agent` ra `/root/backups-n8n-tino/*.tar.gz` (chưa đẩy offsite — chỉ nằm trên VPS). `docker compose down` ở `/opt/n8n`, tắt `n8n-agent.service` và `nginx.service` (hệ thống, không phải Docker) để nhường cổng 80/443.
- [x] **§3 bảo mật cơ bản (làm khác VPS.md một chút — xem §3 bên dưới)**: `ufw` + `fail2ban` đã cài & bật. SSH nghe cả `22` và `2222` (dùng `systemd` socket-activation drop-in, xem §4 Ghi chú kỹ thuật). **CHƯA đóng port 22 / CHƯA tắt `PasswordAuthentication`** — xem lý do ở §3 Việc còn nợ.
- [x] **§4 `.env.prod`**: đã tạo với `POSTGRES_PASSWORD`/`JWT_SECRET_KEY`/`BACKUP_ENCRYPTION_KEY` random (`openssl rand`), `OPENAI_API_KEY` dùng lại key dev có sẵn (theo lựa chọn của người dùng). `RCLONE_REMOTE` còn để placeholder `b2:lahr-backups` (chưa cấu hình thật — xem §8 Việc còn nợ).
- [x] **§5 DNS**: người dùng tự trỏ A record `@`/`www` → `103.142.26.63`, đã verify bằng `dig @8.8.8.8`.
- [x] **§6 SSL**: cert Let's Encrypt cấp thành công cho `rg-nqhuy.io.vn` + `www.rg-nqhuy.io.vn`, hết hạn **2026-11-07**. `certbot renew --dry-run` pass. Đã sửa **2 bug thật** trong `docker-compose.prod.yml` phát hiện qua deploy thật (xem §4 Ghi chú kỹ thuật) — đã áp dụng trên VPS, đã ghi vào `CLAUDE.md` §Bẫy đã gặp, `VPS.md` §6 đã cập nhật cờ `--entrypoint certbot`.
- [x] **§7 seed + admin**: `seed_dev` chạy xong (danh mục/KCN/tin mẫu). Tài khoản admin đầu tiên: `admin@lahr.vn` (mật khẩu đã gửi riêng cho người dùng qua chat — **đổi ngay sau lần đăng nhập đầu**, không lưu trong file này).
- [x] **§9 nghiệm thu — phần đã verify được**:
  - Trang chủ + `/viec-lam` hiện dữ liệu thật (0 chỗ nào còn "Đang cập nhật...").
  - Đăng nhập Dashboard qua API (`/api/auth/login` → cookie → `/api/auth/me`) OK.
  - `GET /api/jobs?province=30` lọc đúng.
  - `curl https://rg-nqhuy.io.vn/api/docs` → 404 (đúng, tự tắt ở `ENVIRONMENT=prod`).
  - HTTPS 200, HTTP→HTTPS 301, HSTS header có, gzip có.
  - `docker stats --no-stream`: tổng ~260MB (xa dưới mục tiêu <2GB).
  - `df -h /`: 28% (đã `docker image prune -af` + `docker builder prune -af`, giảm từ 42%).
  - Resiliency: `up -d --force-recreate backend` → 502 thoáng qua ~10s (backend đang chạy `alembic upgrade head` trước `uvicorn`, **không phải** bug resolver/cache-IP) → tự phục hồi, không cần đụng tay vào nginx. Xác nhận nginx `resolver 127.0.0.11` + biến `$upstream_be` hoạt động đúng như thiết kế.
  - `certbot renew --dry-run` → "Congratulations, all simulated renewals succeeded".

---

## 2b. Đã hoàn thành (Phase 2 — chuyển sang domain khách hàng, 2026-08-16)

Theo đúng quy trình `VPS.md` §10 (không cần cutover phức tạp vì domain khách hàng chưa từng có site cũ):

- [x] Verify DNS A record (`@`/`www`) đã trỏ `vieclam-lagroup.vn` → `103.142.26.63`, **DNSSEC bật** (xác nhận qua `dig DNSKEY`/`+dnssec` thấy RRSIG hợp lệ).
- [x] Quay `NGINX_CONF` về `bootstrap.conf.template` tạm thời → xin cert Let's Encrypt mới cho `vieclam-lagroup.vn` + `www` (hết hạn **2026-11-14**) → đổi `DOMAIN`/`NGINX_CONF`/`CORS_ORIGINS`/`PUBLIC_SITE_URL`/`SITE_URL` trong `.env.prod` → `up -d --force-recreate nginx backend frontend`.
- [x] Verify: HTTPS 200 + HSTS, HTTP→HTTPS 301, `/api/health` OK, JSON-LD `Organization` đã tự đọc đúng domain mới (không cần sửa code — đọc `SITE_URL` runtime).
- [x] **Domain demo `rg-nqhuy.io.vn` cố ý KHÔNG giữ song song** (khác gợi ý ở `VPS.md` §10) — `server_name` trong `lahr.conf.template` chỉ có 1 `${DOMAIN}`, giờ trỏ domain mới; gọi HTTPS vào domain cũ sẽ lỗi TLS "unrecognized name" (đúng thiết kế, không phải bug).
- [x] **Phát hiện + fix 1 bug thật khi chuyển domain**: `app/robots.ts` cache vĩnh viễn, không tự cập nhật `Sitemap: ...` sang domain mới như `sitemap.ts` vẫn làm được — xem chi tiết ở `docs/PITFALLS.md` (mục cuối). Đã thêm `export const revalidate = 3600;`, verify bằng `tsc --noEmit`, commit + đợi CI build lại + redeploy frontend.

---

## 3. Việc còn nợ (chưa làm / chưa verify được)

### Bảo mật SSH — ưu tiên cao, cần người dùng
- **Chưa có SSH public key nào trong `/root/.ssh/authorized_keys`** (rỗng) → hiện tại root chỉ đăng nhập được bằng **mật khẩu**. `VPS.md` §3 giả định đã có key sẵn để tắt `PasswordAuthentication`; môi trường thật KHÔNG có, nên đã cố ý **giữ nguyên** `PasswordAuthentication yes` + port 22 vẫn mở song song với 2222 để tránh khoá luôn quyền truy cập VPS.
- **Việc tiếp theo**: người dùng thêm SSH public key vào `/root/.ssh/authorized_keys`, sau đó mới:
  1. Set `PasswordAuthentication no` trong `/etc/ssh/sshd_config.d/60-cloudimg-settings.conf` (đang là `yes`).
  2. Gỡ `ListenStream=0.0.0.0:22` + `ListenStream=[::]:22` khỏi `/etc/systemd/system/ssh.socket.d/override.conf`, chỉ giữ `2222`.
  3. `ufw delete allow 22/tcp` (cả v4 lẫn v6).
  4. Test đăng nhập qua port 2222 bằng key **trước khi** đóng hẳn — không tự làm bước này nếu không có key trong tay.
- fail2ban đang chặn theo log sshd (không phụ thuộc port) — không cần đổi khi đóng port 22.

### Backup offsite (§8 VPS.md) — người dùng chọn bỏ qua ở Phase 1
- `RCLONE_REMOTE`/`BACKUP_ENCRYPTION_KEY` đã có trong `.env.prod` nhưng **chưa chạy `rclone config`** (cần tài khoản Backblaze B2 hoặc Google Drive — người dùng chưa có).
- **Chưa cài cron backup nightly.** Dữ liệu hiện chỉ nằm trên volume Docker local (`la_group_db_data`, `la_group_uploads`) — mất VPS là mất hết.
- Việc tiếp theo: khi người dùng có tài khoản lưu trữ ngoài, chạy `rclone config` → `env -i PATH=$PATH ./scripts/backup.sh` để test → cài cron theo `VPS.md` §8.

### Nghiệm thu chưa verify được (§9 VPS.md)
- [ ] SSL Labs (`ssllabs.com/ssltest`) ≥ A cho `vieclam-lagroup.vn` — cần chạy từ máy ngoài.
- [ ] `nmap -Pn 103.142.26.63` từ máy ngoài chỉ thấy đúng 80/443/2222 (**hiện tại còn thêm port 22** vì lý do ở trên — kỳ vọng sẽ còn 4 port cho tới khi đóng 22).
- [ ] `robots.txt`/`sitemap.xml` đã có fix `revalidate` (§2b) nhưng **cache cũ trên domain mới cần ≤1h để tự làm mới lần đầu** — kiểm lại sau: `curl -sS https://vieclam-lagroup.vn/robots.txt` phải thấy `Sitemap: https://vieclam-lagroup.vn/sitemap.xml` (không phải `rg-nqhuy.io.vn`).
- [ ] Nộp thử 1 hồ sơ ứng tuyển thật kèm CV qua UI → tải CV về từ Dashboard → purge hồ sơ test (chưa làm, nên làm trước khi coi hạ tầng là "xong hẳn" để chắc luồng upload thật hoạt động sau proxy Nginx thật, không chỉ qua `next dev`).
- [ ] Test nộp hồ sơ + chatbot **qua trình duyệt thật** (mới verify qua `curl`/API, chưa test UI thật trên domain HTTPS thật).

### SEO — giờ đã sang domain khách hàng chính thức, có thể bắt đầu (theo `seo.md`)
- [ ] Đợi `robots.txt`/`sitemap.xml` tự làm mới xong (mục trên) rồi mới submit — nộp domain với sitemap còn trỏ nhầm domain cũ sẽ gây nhầm lẫn cho Google.
- [ ] Google Search Console: thêm property `vieclam-lagroup.vn`, submit sitemap.
- [ ] Google Rich Results Test cho `JobPosting` trên 1 tin thật.
- [ ] Facebook Sharing Debugger cho trang chủ + 1 tin tuyển dụng.
- [ ] Lighthouse mobile: Performance ≥85, SEO ≥95.

---

## 4. Ghi chú kỹ thuật quan trọng

### Bug thật phát hiện khi deploy (đã fix, đã commit vào `docker-compose.prod.yml` — xem `CLAUDE.md` §Bẫy đã gặp để biết chi tiết đầy đủ)

1. **`nginx` service — `command:` override làm mất bước envsubst-templates của entrypoint gốc**. Symptom: `/healthz` → 404, `conf.d/default.conf` vẫn là trang "Welcome to nginx" mặc định dù đã mount đúng template. Fix: gọi tường minh `/docker-entrypoint.d/20-envsubst-on-templates.sh` trong `command:`.
2. **Race condition `&& ... &`**: `A && B & C` là `(A && B) &` chạy NỀN song song với `C` — nên bản fix đầu tiên của bug #1 vẫn lỗi (`exec nginx` chạy trước khi envsubst ghi xong file). Fix: bọc vòng lặp reload trong `(...)&` riêng, để bước envsubst đứng một mình trước `&&`.
3. **`docker compose run certbot certonly ...` bị nuốt mất `certonly`** vì service `certbot` có `entrypoint:` riêng (vòng lặp renew) không forward `"$@"`. Container "chạy xong" nhưng không cấp cert, không tự thoát (`--rm` vô nghĩa vì không exit). Fix: luôn thêm `--entrypoint certbot` khi chạy tay (`./scripts/dc.sh run --rm --entrypoint certbot certbot certonly ...`). Đã cập nhật `VPS.md` §6 và §10.

### Rò rỉ secret phát hiện & đã xử lý (KHÔNG phải do phiên deploy này gây ra)
- `backend/.env.example` (file mẫu, dự kiến commit git) có lúc chứa `OPENAI_API_KEY` thật ở dạng plaintext trong working tree (chưa commit). Đã `git checkout -- backend/.env.example` để revert trước khi làm bất cứ thao tác git nào khác. **Chưa rõ nguồn gốc rò rỉ** — nếu thấy lặp lại, kiểm lại quy trình nào đang ghi đè file `.env.example` (không nên có script nào làm việc đó).

### SSH port — cách đã làm (Ubuntu dùng socket activation, khác hướng dẫn gốc của `VPS.md`)
- `VPS.md` §3 giả định sửa `Port` trong `/etc/ssh/sshd_config` là đủ — **KHÔNG đúng trên VPS này**. Ubuntu (phiên bản mới) chạy `sshd` qua `ssh.socket` (systemd socket activation), tự bind cổng theo `ssh.socket`'s `ListenStream`, bỏ qua `Port` trong `sshd_config`. Phải tạo drop-in `/etc/systemd/system/ssh.socket.d/override.conf` với `ListenStream=` (dòng rỗng để xoá default) + liệt kê tường minh từng địa chỉ:port (`0.0.0.0:22`, `0.0.0.0:2222`, `[::]:22`, `[::]:2222`) — chỉ định `[::]:2222` không kèm IPv4 explicit sẽ KHÔNG nhận kết nối IPv4 dù lý thuyết dual-stack.

### File `.env.prod` — các giá trị đã sinh ngẫu nhiên
`POSTGRES_PASSWORD`, `JWT_SECRET_KEY`, `BACKUP_ENCRYPTION_KEY` đều sinh bằng `openssl rand`, lưu trong `/root/LA_Group/.env.prod` (chmod 600, không commit git — đã có trong `.gitignore` gốc). **Không có bản sao lưu nào của các giá trị này ngoài chính file trên VPS** — nếu cần backup DB thật (§8), bắt buộc phải backup luôn `BACKUP_ENCRYPTION_KEY` ra ngoài VPS trước, nếu không mất VPS = mất luôn khả năng giải mã backup.

---

## 5. Kế hoạch tiếp theo (theo thứ tự ưu tiên)

1. **Người dùng thêm SSH public key** → đóng port 22 + tắt password auth (§3 ở trên).
2. Test luồng ứng tuyển thật qua trình duyệt (nộp CV, tải về từ Dashboard, purge) trên domain HTTPS thật — chưa test qua UI, chỉ mới test qua API.
3. Kiểm lại `robots.txt`/`sitemap.xml` sau ≤1h rồi mới submit Google Search Console / Rich Results Test / Facebook Debugger (§3 SEO ở trên).
4. Khi người dùng có tài khoản Backblaze B2/Google Drive: cấu hình `rclone`, test `backup.sh` + `restore.sh` vào DB trống, cài cron nightly (§8 VPS.md).
5. Chạy `nmap` từ máy ngoài + SSL Labs test để hoàn tất §9 VPS.md.
