"""
Hybrid OCR: Görüntü kalitesini kontrol eder.
Bulanık veya okunaksız görüntüler Document AI'ya gönderilmeden reddedilir.

Kullanılan yöntem: Laplacian Variance (bulanıklık skoru)
"""

import cv2
import numpy as np
from typing import Tuple


# Kalite eşik değerleri
BLUR_THRESHOLD = 40.0       # Bu değerin altındakiler bulanık sayılır
MIN_BRIGHTNESS = 30         # Çok karanlık görüntüler
MAX_BRIGHTNESS = 220        # Çok aydınlık (overexposed) görüntüler
MIN_SIZE_PIXELS = 200 * 200  # Minimum görüntü boyutu


def check_image_quality(image_bytes: bytes) -> Tuple[bool, str, float]:
    """
    Görüntü kalitesini analiz eder.

    Args:
        image_bytes: Ham görüntü verisi (bytes)

    Returns:
        (is_ok: bool, message: str, blur_score: float)
        - is_ok: True ise Document AI'ya gönder, False ise reddet
        - message: Kullanıcıya gösterilecek açıklama
        - blur_score: Laplacian variance değeri (yüksek = daha net)
    """
    try:
        # Bytes → NumPy array → OpenCV image
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return False, "Geçersiz görüntü formatı. Lütfen JPG veya PNG yükleyin.", 0.0

        h, w = img.shape[:2]

        # Boyut kontrolü
        if h * w < MIN_SIZE_PIXELS:
            return (False,
                    f"Görüntü çok küçük ({w}×{h}px). Minimum 200×200px gereklidir.",
                    0.0)

        # Gri tonlamaya çevir
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Bulanıklık skoru: Laplacian variance
        blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()

        if blur_score < BLUR_THRESHOLD:
            return (False,
                    f"Fotoğraf çok bulanık (skor: {blur_score:.1f}). "
                    "Lütfen daha net bir görüntü çekin veya manuel giriş yapın.",
                    blur_score)

        # Parlaklık kontrolü
        brightness = gray.mean()
        if brightness < MIN_BRIGHTNESS:
            return (False,
                    "Görüntü çok karanlık. Daha iyi aydınlatma ortamında tekrar deneyin.",
                    blur_score)

        if brightness > MAX_BRIGHTNESS:
            return (False,
                    "Görüntü çok aydınlık (fazla parlama). Işığı azaltarak tekrar çekin.",
                    blur_score)

        return True, "Görüntü kalitesi yeterli.", blur_score

    except Exception as e:
        # OpenCV yoksa veya hata olursa kaliteyi geçerli say (fallback)
        print(f"Image quality check failed (non-critical): {e}")
        return True, "Kalite kontrolü atlandı.", 0.0
