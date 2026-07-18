"""
Vercel Serverless giriş noktası
================================
Vercel, /api altındaki .py dosyalarını otomatik olarak serverless
fonksiyona dönüştürür. FastAPI (ASGI) uygulamasını dışa aktarmak yeterli.
Tüm istekler vercel.json'daki rewrite kuralıyla buraya yönlendirilir.
"""
from app.main import app

# Vercel ASGI uygulamasını otomatik algılar; ekstra yapılandırma gerekmez.
