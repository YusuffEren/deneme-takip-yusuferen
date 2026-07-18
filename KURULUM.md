# Kurulum Rehberi — Deneme Takip

Site şu 3 parçadan oluşuyor (hepsi ücretsiz, kredi kartı gerekmez):

| Parça | Nerede | Neden |
|---|---|---|
| Frontend (site arayüzü) | Render (statik site) | Statik siteler uyumaz, anında açılır |
| Backend (API) | **Vercel** (serverless) | Render'ın ücretsiz servisleri uyur (50 sn açılış); Vercel uyumaz |
| Veritabanı | **Neon** (PostgreSQL) | Render'ın ücretsiz DB'si 30 günde silinir; Neon **asla silmez** |

Bu kurulum bir kere yapılır (~10 dakika), sonra her şey kendiliğinden çalışır.
Kodda `git push` yaptıkça Vercel ve Render otomatik günceller.

---

## Adım 1 — Neon (veritabanı) ⏱ 3 dk

1. [neon.tech](https://neon.tech) → **Sign up** (Google veya GitHub ile giriş)
2. **Create a project** → isim: `deneme-takip` → region fark etmez → Create
3. Dashboard'da **Connect** butonuna tıkla
4. **Connection string**'i kopyala — şuna benzer:
   ```
   postgresql://kullanici:sifre@ep-xxx-pooler.eu-central-1.aws.neon.tech/deneme_takip?sslmode=require
   ```
   (Bu adresi kimseyle paylaşma, şifre içerir.)

## Adım 2 — Vercel (backend) ⏱ 4 dk

1. [vercel.com](https://vercel.com) → **Sign up** → **Continue with GitHub**
2. **Add New... → Project** → `deneme-takip-yusuferen` reposunu bul → **Import**
3. Ayarlar:
   - **Project Name:** `deneme-takip-yusuferen` ⚠️ (bu ismi aynen bırak — frontend bu adrese bağlanacak)
   - **Root Directory:** `backend` (Edit'e tıklayıp seç)
   - Framework Preset: **Other**
4. **Environment Variables** bölümünü aç, şu 2 değişkeni ekle:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | Adım 1'de kopyaladığın Neon adresi |
   | `CORS_ORIGINS` | `https://deneme-takip-yusuferen-1.onrender.com` |

5. **Deploy** → 1-2 dk bekle
6. Test: tarayıcıdan `https://deneme-takip-yusuferen.vercel.app/api/health` aç → `{"status":"ok"}` görmelisin
   (İlk açılışta veritabanı tabloları ve örnek öğrenciler otomatik oluşur.)

## Adım 3 — Siteyi aç ✅

`https://deneme-takip-yusuferen-1.onrender.com` → artık anında açılmalı.

> Adım 2'de proje adını değiştirdiysen site backend'i bulamaz. Çözüm:
> Render Dashboard → `deneme-takip-yusuferen-1` (static site) → **Environment** →
> `VITE_API_URL` = `https://SENIN-VERCEL-ADRESIN.vercel.app/api` ekle → kaydet (yeniden derlenir).

## Adım 4 — Temizlik (opsiyonel)

Eski Render backend'i artık gereksiz (hem takılıyordu hem uyuyor):
Render Dashboard → `deneme-takip-yusuferen` (web service) → **Settings → Delete Service**
Ayrıca varsa eski `deneme-takip-db` veritabanını da silebilirsin.

---

## Sık sorulanlar

**Site yine de açılmazsa?**
1. `https://deneme-takip-yusuferen.vercel.app/api/health` cevap veriyor mu?
2. Vermiyorsa: Vercel → proje → **Deployments → Logs** kısmına bak; genelde `DATABASE_URL` yanlış/eksiktir.
3. Veriyorsa ama site açılmıyorsa: tarayıcıda F12 → Console'a bak; CORS hatası varsa Vercel'deki `CORS_ORIGINS` değerini kontrol et.

**Veriler güvende mi?**
Neon ücretsiz planda verileri silmez, süre sınırı yok. 0.5 GB'a kadar ücretsiz (bu uygulama için fazlasıyla yeter).

**Yerelde geliştirme?**
```bash
# Backend (SQLite kullanır, kurulum gerekmez)
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (başka terminal)
cd frontend
npm install
npm run dev
```
