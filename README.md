# 📐 Website "Hành Trình Toán Học" (Math Journey)

Hệ thống quản lý học tập & luyện tập toán tiểu học tương tác kết hợp AI dành riêng cho **Giáo viên** và **Học sinh tiểu học**.

- **Website Vercel Production**: [https://hanhtrinhtoanhoccuaem.vercel.app/](https://hanhtrinhtoanhoccuaem.vercel.app/)
- **Repository GitHub**: [https://github.com/ngocngan091002-ux/hanhtrinhtoanhoc](https://github.com/ngocngan091002-ux/hanhtrinhtoanhoc)

---

## 🚀 Công Nghệ Sử Dụng

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend & Database**: Supabase PostgreSQL + Row Level Security (RLS).
- **Authentication**: Supabase Auth (Google OAuth không dùng mật khẩu).
- **Storage**: Supabase Storage Bucket `learning-materials`.
- **AI Integration**: Google Gemini AI (Gemini 2.5 Flash) gợi ý bài tập, hỗ trợ chấm bài, phân tích học sinh yếu và Trợ lý AI Gia sư cho học sinh.
- **Deployment**: Vercel.

---

## 📌 Hướng Dẫn Thiết Lập Supabase

### Step 1: Chạy File SQL `supabase/schema.sql`
1. Vào Supabase Dashboard dự án của bạn -> chọn tab **SQL Editor**.
2. Mở file `supabase/schema.sql` trong dự án này, copy toàn bộ nội dung SQL paste vào SQL Editor.
3. Bấm **RUN** để khởi tạo tự động toàn bộ Tables, Enums, Triggers, RLS Policies, Views (`class_leaderboard`) và Storage Bucket.

### Step 2: Cấu Hình Đăng Nhập Google Auth
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/), tạo Credentials **OAuth 2.0 Client ID** (Web Application).
2. Thêm Authorized redirect URI từ Supabase Auth (`https://<your-project-ref>.supabase.co/auth/v1/callback`).
3. Vào Supabase Dashboard -> **Authentication** -> **Providers** -> Bật **Google** và nhập `Client ID` & `Client Secret`.

### Step 3: Tạo File `.env`
Tạo file `.env` ở thư mục gốc dự án dựa trên mẫu `.env.example`:
```env
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_GEMINI_API_KEY=your-gemini-api-key
```

---

## 💻 Hướng Dẫn Chạy Cục Bộ (Local Development)

```bash
# 1. Cài đặt các thư viện
npm install

# 2. Bật server phát triển
npm run dev

# 3. Mở trình duyệt tại http://localhost:3000
```

---

## 🌐 Hướng Dẫn Deploy Lên Vercel

1. Đưa mã nguồn dự án lên repository GitHub của bạn.
2. Đăng nhập vào [Vercel](https://vercel.com/) -> Bấm **Add New** -> **Project** -> Chọn repository vừa push.
3. Trong mục **Environment Variables** trên Vercel, thêm 3 biến:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GEMINI_API_KEY`
4. Bấm **Deploy**. Vercel sẽ tự động build và cấp tên miền công khai.
