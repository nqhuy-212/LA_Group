# VPS.md — Triển khai LA Group lên VPS Ubuntu

> **File này dành cho một phiên Claude chạy TRỰC TIẾP TRÊN VPS** (qua Remote SSH của IDE), không có ngữ cảnh gì từ các phiên trước. Đọc từ trên xuống, làm tuần tự.
>
> - Domain giai đoạn demo: **`rg-nqhuy.io.vn`** (chưa từng có website → không có rủi ro cutover)
> - Chuyển sang tên miền khách hàng: xem **§10**, làm sau khi demo xong
> - Bối cảnh đầy đủ + lý do từng quyết định: [`docs/DEPLOY.md`](docs/DEPLOY.md) · Roadmap: [`docs/PLAN.md`](docs/PLAN.md) · Trạng thái + bẫy: [`CLAUDE.md`](CLAUDE.md)
> - **Giao tiếp bằng Tiếng Việt** (quy ước dự án)

---

## 0. Điều kiện tiên quyết — kiểm TRƯỚC khi làm bất cứ gì

Dừng lại và báo người dùng nếu bất kỳ mục nào chưa đạt:

```bash
cd /opt/lahr   # hoặc thư mục vừa clone

# a) Repo đã qua "GĐ A" chưa? Thiếu bất kỳ dòng nào → KHÔNG deploy được.
grep -q "COPY scripts"      backend/Dockerfile          && echo "OK #1  scripts trong image"   || echo "THIẾU #1"
grep -q "INTERNAL_API_URL"  docker-compose.prod.yml     && echo "OK #15 INTERNAL_API_URL"      || echo "THIẾU #15"
grep -q "ARG SITE_URL"      frontend/Dockerfile         && echo "OK #16 SITE_URL build-arg"    || echo "THIẾU #16"
test -x scripts/dc.sh                                   && echo "OK #17 dc.sh wrapper"         || echo "THIẾU #17"
test -f nginx/bootstrap.conf.template                   && echo "OK #2  bootstrap template"    || echo "THIẾU #2"
grep -q "\.env.prod" scripts/backup.sh                  && echo "OK #3  backup nạp env"        || echo "THIẾU #3"
grep -q "uploads"    scripts/backup.sh                  && echo "OK #5  backup có uploads"     || echo "THIẾU #5"
grep -q "mem_limit"  docker-compose.prod.yml            && echo "OK #6  mem_limit"             || echo "THIẾU #6"
grep -q "max-size"   docker-compose.prod.yml            && echo "OK #7  log rotation"          || echo "THIẾU #7"
grep -q "resolver"   nginx/lahr.conf.template           && echo "OK #19 resolver (chống 502)"  || echo "THIẾU #19"

# b) Image đã có trên GHCR chưa? (job `images` chạy sau mỗi lần push lên main)
docker manifest inspect ghcr.io/nqhuy-212/lahr-backend:latest  >/dev/null 2>&1 && echo "OK image BE" || echo "THIẾU image BE"
docker manifest inspect ghcr.io/nqhuy-212/lahr-frontend:latest >/dev/null 2>&1 && echo "OK image FE" || echo "THIẾU image FE"
```

> Nếu `docker manifest inspect` báo `denied` → package GHCR đang ở chế độ private. Vào GitHub → Packages → chọn package → Package settings → Change visibility → **Public**. Image không chứa secret (`.dockerignore` đã loại `.env`), và để public thì khỏi tốn quota 500MB của repo private.

**Cần có sẵn trong tay**: IP VPS · quyền sửa DNS của `rg-nqhuy.io.vn` · `OPENAI_API_KEY` · thông tin remote lưu trữ backup (Backblaze B2 / Google Drive) · email để đăng ký Let's Encrypt.

---

## 1. Chuẩn bị hệ điều hành

```bash
apt update && apt upgrade -y
apt install -y ca-certificates curl git ufw fail2ban rclone

timedatectl set-timezone Asia/Ho_Chi_Minh   # log/cron khớp giờ VN, backup 02:00 là 02:00 VN

# Swap 2GB — lưới an toàn cho RAM 4GB, KHÔNG phải chỗ chạy thường xuyên
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
sysctl -w vm.swappiness=10 && echo 'vm.swappiness=10' >> /etc/sysctl.d/99-swap.conf
```

Docker (nếu VPS chưa có — gói Tino thường đã cài sẵn, kiểm bằng `docker --version`):
```bash
curl -fsSL https://get.docker.com | sh
```

**Verify**: `free -m` thấy Swap 2048 · `docker compose version` ra v2.x · `timedatectl` thấy `+07`

---

## 2. Gỡ stack n8n có sẵn của Tino

Gói "N8N Basic" tự cài n8n kèm một reverse proxy **đang giữ cổng 80/443** — đụng trực tiếp với nginx của dự án.

```bash
# Xác định ai đang giữ cổng
ss -tlnp | grep -E ':80\s|:443\s'
docker ps -a
systemctl list-units --type=service --state=running | grep -iE 'caddy|traefik|nginx|apache|n8n'
find / -maxdepth 4 -name 'docker-compose*.y*ml' 2>/dev/null

# Backup dữ liệu n8n trước khi gỡ (đề phòng khách hàng cần lại)
docker volume ls | grep -i n8n
docker run --rm -v <TÊN_VOLUME_N8N>:/data -v /root:/backup alpine \
  tar czf /backup/n8n-backup-$(date +%F).tar.gz -C /data .

# Gỡ: dừng compose cũ ở đường dẫn vừa tìm được, hoặc disable systemd unit
cd <ĐƯỜNG_DẪN_COMPOSE_CŨ> && docker compose down
# hoặc: systemctl disable --now <tên-unit>
```

**Verify**: `ss -tlnp | grep -E ':80\s|:443\s'` **không ra dòng nào**.
**Rollback**: `docker compose up -d` lại ở đường dẫn cũ.

> Dự án vẫn dùng được n8n về sau — đã có sẵn trong `docker-compose.prod.yml` dưới `profiles: ["automation"]`, bật bằng `--profile automation`. Mặc định tắt để tiết kiệm ~400MB RAM.

---

## 3. Bảo mật cơ bản

```bash
# Đổi port SSH (ví dụ 2222) — sửa /etc/ssh/sshd_config:
#   Port 2222
#   PermitRootLogin prohibit-password
#   PasswordAuthentication no        ← chỉ bật sau khi đã cài SSH key!
systemctl restart ssh

ufw default deny incoming && ufw default allow outgoing
ufw allow 2222/tcp && ufw allow 80/tcp && ufw allow 443/tcp
ufw enable

systemctl enable --now fail2ban
```

> ⚠️ **Mở port SSH mới và test đăng nhập được TRƯỚC khi tắt port 22.** Giữ phiên SSH hiện tại mở trong lúc test bằng phiên thứ hai — sai một bước là mất quyền truy cập VPS.

**Verify**: từ máy khác `nmap -Pn <IP>` chỉ thấy 80/443/2222.

---

## 4. Lấy mã nguồn & cấu hình

```bash
mkdir -p /opt && cd /opt
git clone https://github.com/nqhuy-212/LA_Group.git lahr
cd /opt/lahr
cp .env.prod.example .env.prod
chmod 600 .env.prod
```

Sửa `.env.prod` — các giá trị **bắt buộc đổi**:

| Biến | Giá trị cho demo |
|---|---|
| `DOMAIN` | `rg-nqhuy.io.vn` |
| `NGINX_CONF` | `bootstrap.conf.template` ← để nguyên, §6 sẽ đổi |
| `BACKEND_IMAGE` | `ghcr.io/nqhuy-212/lahr-backend:latest` |
| `FRONTEND_IMAGE` | `ghcr.io/nqhuy-212/lahr-frontend:latest` |
| `POSTGRES_PASSWORD` | `openssl rand -base64 24` |
| `DATABASE_URL` | **phải chứa đúng password vừa sinh** ← footgun số 1 |
| `JWT_SECRET_KEY` | `openssl rand -hex 32` |
| `ENVIRONMENT` | `prod` |
| `CORS_ORIGINS` | `["https://rg-nqhuy.io.vn"]` |
| `PUBLIC_SITE_URL` (backend) và `SITE_URL` (frontend) | `https://rg-nqhuy.io.vn` |
| `OPENAI_API_KEY` | key thật |
| `BACKUP_ENCRYPTION_KEY` | `openssl rand -base64 32` — **lưu ra ngoài VPS, mất key = mất toàn bộ backup** |
| `RCLONE_REMOTE` | `b2:lahr-backups` (hoặc remote đã cấu hình ở §8) |

**Verify**: `./scripts/dc.sh config` in ra cấu hình đầy đủ, **không còn chuỗi rỗng** ở `image:` hay `POSTGRES_USER`.

> ⚠️ **Luôn dùng `./scripts/dc.sh`, không gọi `docker compose` trần.** Wrapper này tự kèm `--env-file .env.prod`. Thiếu cờ đó thì mọi `${...}` rỗng: compose chỉ đọc `.env` mặc định cho phép thay thế biến, còn `env_file:` chỉ nạp biến *vào trong* container. Hậu quả: `${BACKEND_IMAGE}` rỗng (compose lỗi ngay) và `${POSTGRES_USER}` rỗng ở khối `environment:` **đè lên** giá trị đúng → Postgres init sai user.

---

## 5. Trỏ DNS

Tại trang quản trị `rg-nqhuy.io.vn`:

| Type | Name | Value | TTL |
|---|---|---|---|
| A | `@` | `<IPv4 VPS>` | 300 |
| A | `www` | `<IPv4 VPS>` | 300 |

Bỏ qua AAAA cho đơn giản (nếu thêm thì nginx phải có `listen [::]:443`).

**Verify**: `dig +short A rg-nqhuy.io.vn @8.8.8.8` trả đúng IP VPS. **Chờ tới khi đúng rồi mới sang §6** — certbot cần domain resolve được.

---

## 6. Khởi động + xin chứng chỉ SSL

Nginx có 2 file cấu hình vì lần đầu chưa có cert: block `:443` trỏ tới file cert chưa tồn tại sẽ làm nginx crash-loop, mà certbot lại cần nginx phục vụ `/.well-known/`.

```bash
cd /opt/lahr
./scripts/dc.sh pull

# Bước 1: nginx chỉ nghe :80 (bootstrap — đã là mặc định trong .env.prod.example)
grep '^NGINX_CONF=' .env.prod                      # phải là bootstrap.conf.template
./scripts/dc.sh up -d
curl -sS http://rg-nqhuy.io.vn/healthz             # "bootstrap ok" — nếu timeout là DNS/firewall chưa thông

# Bước 2: xin cert
./scripts/dc.sh run --rm certbot certonly --webroot -w /var/www/certbot \
  --agree-tos --no-eff-email -m <email-cua-ban> \
  -d rg-nqhuy.io.vn -d www.rg-nqhuy.io.vn

# Bước 3: bật cấu hình đầy đủ có SSL
sed -i 's|^NGINX_CONF=.*|NGINX_CONF=lahr.conf.template|' .env.prod
./scripts/dc.sh up -d --force-recreate nginx
./scripts/dc.sh exec nginx nginx -t

# Verify template render đúng: ${DOMAIN} đã thay, biến của nginx còn nguyên
./scripts/dc.sh exec nginx grep -E 'server_name|\$host' /etc/nginx/conf.d/default.conf
```

**Verify**: `curl -sSI https://rg-nqhuy.io.vn/` trả 200 · `curl -sSI http://rg-nqhuy.io.vn/` trả 301 · `curl -sS https://rg-nqhuy.io.vn/api/health` trả `{"status":"ok"}` — **không dùng `-k`**.

> Let's Encrypt giới hạn 5 cert trùng tên/tuần. Nếu đang thử nghiệm nhiều lần, thêm `--dry-run` trước.

---

## 7. Nạp dữ liệu nền + tạo tài khoản admin

`alembic upgrade head` (tự chạy khi backend start) **chỉ tạo schema, không có dữ liệu**. Thiếu bước này thì admin không đăng tin được (form cần chọn KCN/ngành nghề) và `SearchBar` rỗng.

```bash
# Danh mục nền: tỉnh, KCN, ngành nghề, address_mappings (+ dữ liệu mẫu). Idempotent.
./scripts/dc.sh exec backend python -m scripts.seed_dev

# Tài khoản admin đầu tiên — KHÔNG có endpoint đăng ký public.
# Cần -it để prompt nhập mật khẩu ẩn hiện ra được.
./scripts/dc.sh exec -it backend python -m scripts.create_user --email admin@lahr.vn --role admin
```

**Verify**: đăng nhập `https://rg-nqhuy.io.vn/dang-nhap` vào được Dashboard · form đăng tin có đủ dropdown KCN/ngành nghề.

> Nếu không muốn job/post mẫu xuất hiện trên site demo: seed xong rồi vào Dashboard đổi trạng thái chúng sang `draft`, hoặc xoá.

---

## 8. Backup nightly

Backup hàng tuần của Tino **không thay thế được** bước này: mất tối đa 7 ngày dữ liệu và nằm cùng nhà cung cấp nên không phải offsite thật.

```bash
rclone config                      # tạo remote, ví dụ tên "b2", bucket lahr-backups
rclone lsd b2:                     # verify kết nối

cd /opt/lahr
env -i PATH=$PATH ./scripts/backup.sh     # chạy với môi trường rỗng — mô phỏng đúng cron
```

Nếu chạy được, cài cron:
```bash
crontab -e
# 0 2 * * * cd /opt/lahr && ./scripts/backup.sh >> /var/log/lahr-backup.log 2>&1
```

**Verify bắt buộc — backup chưa restore được là backup không tồn tại:**
```bash
rclone ls b2:lahr-backups                                    # thấy file .enc
./scripts/restore.sh /root/backups/<file>.sql.gz.enc         # vào DB trống, đối chiếu số dòng
```

Backup phải gồm **cả volume `uploads`** (file CV ứng viên là PII, DB chỉ lưu đường dẫn). Kiểm bằng `grep uploads scripts/backup.sh`.

---

## 9. Nghiệm thu

Chức năng:
- [ ] Trang chủ hiện **dữ liệu thật** (không phải "Đang cập nhật...") — nếu rỗng, xem §Sự cố → `INTERNAL_API_URL`
- [ ] `/viec-lam` lọc được; `/viec-lam/<slug>` hiện đủ nội dung
- [ ] Đăng nhập Dashboard → đăng 1 tin thật → tin lên trang chủ
- [ ] Nộp 1 hồ sơ thật kèm CV → tải CV về được từ Dashboard → **purge hồ sơ test sau khi xong** (PII giả trong DB prod)
- [ ] Chatbot trả lời đúng tin có trong DB, không bịa

Hạ tầng:
- [ ] SSL Labs (`ssllabs.com/ssltest`) ≥ **A**
- [ ] `curl https://rg-nqhuy.io.vn/docs` → **404** (tự tắt ở `ENVIRONMENT=prod`)
- [ ] `nmap -Pn <IP>` từ máy ngoài chỉ thấy 80/443/2222
- [ ] `docker stats --no-stream` tổng **< 2GB**; `df -h /` **< 40%**
- [ ] `./scripts/dc.sh up -d --force-recreate backend` xong, `curl` ngay → **không 502** (nginx phải re-resolve DNS)
- [ ] Sau ~1h: `curl -sS https://rg-nqhuy.io.vn/sitemap.xml | grep rg-nqhuy` ra kết quả (sitemap prerender lúc build không có backend nên ban đầu rỗng, tự lành nhờ `revalidate: 3600`)
- [ ] `./scripts/dc.sh run --rm certbot renew --dry-run` thành công (nginx tự reload mỗi 6h nên cert mới sẽ được nạp)
- [ ] `curl -sSI https://rg-nqhuy.io.vn/ | grep -i strict-transport` có HSTS; `curl -sH 'Accept-Encoding: gzip' -I https://rg-nqhuy.io.vn/ | grep -i content-encoding` có gzip

SEO (chỉ chạy khi đã sang domain khách hàng chính thức — đừng submit domain demo cho Google):
- [ ] Google Rich Results Test cho `JobPosting`
- [ ] Facebook Sharing Debugger
- [ ] Lighthouse mobile: Performance ≥85, SEO ≥95

---

## 10. Chuyển sang tên miền khách hàng (sau demo)

Khách đã mua tên miền ở tino.vn nhưng chưa dùng → **không có website cũ nên không cần cutover phức tạp**.

```bash
cd /opt/lahr

# 1. Trỏ A record của domain khách → IP VPS, TTL 300. Chờ dig xác nhận:
#    dig +short A <domain-khach> @8.8.8.8

# 2. Xin cert cho domain mới. Tạm quay về bootstrap để chắc chắn ACME đi lọt,
#    vì cấu hình đầy đủ chỉ khai báo server_name của domain CŨ.
sed -i 's|^NGINX_CONF=.*|NGINX_CONF=bootstrap.conf.template|' .env.prod
./scripts/dc.sh up -d --force-recreate nginx
./scripts/dc.sh run --rm certbot certonly --webroot -w /var/www/certbot \
  --agree-tos --no-eff-email -m <email> -d <domain-khach> -d www.<domain-khach>

# 3. Đổi toàn bộ cấu hình sang domain mới
sed -i 's|^DOMAIN=.*|DOMAIN=<domain-khach>|'                          .env.prod
sed -i 's|^NGINX_CONF=.*|NGINX_CONF=lahr.conf.template|'              .env.prod
sed -i 's|^CORS_ORIGINS=.*|CORS_ORIGINS=["https://<domain-khach>"]|'  .env.prod
sed -i 's|^PUBLIC_SITE_URL=.*|PUBLIC_SITE_URL=https://<domain-khach>|' .env.prod
sed -i 's|^SITE_URL=.*|SITE_URL=https://<domain-khach>|'              .env.prod

# 4. Khởi động lại — KHÔNG cần rebuild image, SITE_URL là biến runtime
./scripts/dc.sh up -d --force-recreate nginx backend frontend
```

**Verify**: `https://<domain-khach>/api/health` OK · `robots.txt` chứa domain mới ngay · `sitemap.xml` và thẻ OG chứa domain mới **sau ≤1h** (xem lưu ý dưới) · JSON-LD `Organization` dùng domain mới.

> ⚠️ **Có độ trễ ISR**: HTML của các trang được prerender lúc build (mang domain cũ trong thẻ OG) vẫn được phục vụ cho tới lần revalidate đầu tiên — ≤5 phút với trang thường (`revalidate: 300`), ≤1h với `sitemap.xml` (`revalidate: 3600`). Muốn thấy ngay thì `./scripts/dc.sh restart frontend` rồi request từng trang một lần để kích hoạt revalidate. Đây là đánh đổi có chủ đích: rẻ hơn nhiều so với phải build + push lại image mỗi lần đổi domain.

Sau khi domain mới ổn định mới submit Google Search Console + chạy Rich Results Test / Facebook Debugger. Giữ `rg-nqhuy.io.vn` trong `server_name` thêm ít lâu để đối chiếu (cấu hình hiện tại chỉ khai báo 1 `${DOMAIN}` — nếu muốn phục vụ song song thì thêm thủ công vào `nginx/lahr.conf.template`), rồi gỡ hẳn.

---

## Sự cố thường gặp

| Triệu chứng | Nguyên nhân | Xử lý |
|---|---|---|
| `docker compose` báo image rỗng / Postgres sai user | Gọi `docker compose` trần, quên `--env-file .env.prod` | Luôn dùng `./scripts/dc.sh` |
| Site lên nhưng **mọi section "Đang cập nhật..."**, không đăng nhập được | `frontend` thiếu `INTERNAL_API_URL=http://backend:8000` | `./scripts/dc.sh config \| grep INTERNAL_API_URL` |
| Backend restart liên tục | `DATABASE_URL` không khớp `POSTGRES_PASSWORD`; hoặc `JWT_SECRET_KEY` còn giá trị mặc định (validator chặn boot ở prod) | `./scripts/dc.sh logs backend` |
| Nginx crash-loop lúc đầu | Cert chưa tồn tại | `NGINX_CONF=bootstrap.conf.template` (§6) |
| Nginx báo lỗi cú pháp lạ, `$host` thành rỗng | envsubst nuốt biến của nginx | Kiểm `NGINX_ENVSUBST_FILTER: "^DOMAIN$$"` còn trong compose (hai dấu `$` là cố ý — compose escape) |
| **502 sau mỗi lần deploy** | Nginx cache IP upstream | Template phải có `resolver 127.0.0.11` + `set $upstream_*`; tạm thời `./scripts/dc.sh restart nginx` |
| `sitemap.xml` chỉ có 4 route tĩnh | Prerender lúc build không có backend | Bình thường, tự lành sau 1h |
| Certbot fail "challenge did not pass" | DNS chưa lan truyền hoặc port 80 bị chặn | `dig +short A <domain>`, `ufw status` |
| `backup.sh` báo "unbound variable" | Không nạp được `.env.prod` | Chạy từ đúng thư mục repo; kiểm `grep 'env.prod' scripts/backup.sh` |
| Đĩa đầy dần | Log Docker không giới hạn | Kiểm `logging` trong compose; `docker image prune -af` |
| RAM cạn / container bị kill | Lỡ build image trên VPS | **Không bao giờ build trên VPS** — `npm run build` ăn 2–3GB, chắc chắn OOM. Dùng image từ GHCR |

**Lệnh chẩn đoán nhanh**:
```bash
cd /opt/lahr
./scripts/dc.sh ps
./scripts/dc.sh logs --tail=50 backend
./scripts/dc.sh logs --tail=50 nginx
docker stats --no-stream; free -m; df -h /
dmesg -T | grep -i 'killed process'      # kiểm OOM
```
