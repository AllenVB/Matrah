"""
Türk Vergi Mevzuatı'na göre fiş kalemlerini otomatik KDV oranına (%1, %10, %20)
sınıflandıran modül.

Kaynaklar:
  - KDV Kanunu Genel Uygulama Tebliği
  - (I) Sayılı Liste: %1 oranı
  - (II) Sayılı Liste: %10 oranı
  - Genel oran: %20
"""

from typing import Tuple

# ─────────────────────────────────────────────
# %1 KDV — Temel Gıda ve Tarım Ürünleri
# ─────────────────────────────────────────────
RATE_1_KEYWORDS = [
    # Ekmek ve tahıl
    "ekmek", "francala", "pide", "lavaş", "yufka", "simit",
    "un", "irmik", "buğday", "arpa", "mısır", "pirinç",
    # Bakliyat / kuru gıda
    "mercimek", "nohut", "fasulye", "bakla", "bezelye",
    "bulgur", "irmik",
    # Taze sebze / meyve (işlenmemiş)
    "patates", "soğan", "domates", "salatalık", "biber", "patlıcan",
    "lahana", "ıspanak", "marul", "havuç", "kabak",
    "elma", "armut", "portakal", "mandalina", "limon",
    "muz", "üzüm", "kiraz", "çilek",
    # Tarım / zirai
    "tohum", "gübre", "tarım ilacı", "zirai",
    # İçme suyu (şebeke faturası veya damacana)
    "içme suyu", "damacana",
    # Gazete / dergi (KDV Kanunu)
    "gazete", "dergi", "magazin",
]

# ─────────────────────────────────────────────
# %10 KDV — İndirimli Oran
# ─────────────────────────────────────────────
RATE_10_KEYWORDS = [
    # Tekstil / giyim / ayakkabı
    "gömlek", "pantolon", "elbise", "ceket", "mont", "palto",
    "kazak", "tişört", "sweatshirt", "jean", "kot",
    "ayakkabı", "çizme", "bot", "sandalet", "terlik", "sneaker",
    "tekstil", "kumaş", "bezi", "çorap", "iç çamaşırı",
    "giysi", "giyim", "kıyafet",
    # Sağlık
    "ilaç", "eczane", "hap", "tablet", "şurup", "merhem",
    "bandaj", "tıbbi", "medikal", "maske", "vitamin",
    "doktor", "hastane", "klinik", "sağlık hizmet",
    # Eğitim
    "kitap", "okul", "üniversite", "kurs", "eğitim",
    "dershane", "etüt", "anaokul", "kreş",
    # Konaklama / turizm
    "otel", "motel", "hostel", "pansiyon", "konaklama",
    "turizm",
    # Kültür / sanat
    "sinema", "tiyatro", "konser", "müze", "sergi",
    "bilet",
    # Gıda (işlenmiş)
    "et", "tavuk", "balık", "sucuk", "salam", "sosis",
    "süt", "yoğurt", "peynir", "tereyağı", "yumurta",
    "meyve suyu", "hazır gıda", "konserve",
    "çay", "kahve",
    # Tarım ekipmanı (küçük)
    "traktör parça", "sulama",
]

# ─────────────────────────────────────────────
# %20 KDV — Standart Oran
# (Bu listeleri eşleşmeyenler de varsayılan olarak %20 alır)
# ─────────────────────────────────────────────
RATE_20_KEYWORDS = [
    # Elektronik
    "laptop", "bilgisayar", "tablet", "telefon", "akıllı telefon",
    "mouse", "klavye", "monitör", "ekran", "yazıcı", "printer",
    "kulaklık", "hoparlör", "kamera", "fotoğraf makinesi",
    "televizyon", "tv", "klima", "çamaşır makinesi",
    "bulaşık makinesi", "buzdolabı", "fırın", "mikrodalga",
    "beyaz eşya", "elektronik",
    # Mobilya / dekorasyon
    "masa", "sandalye", "koltuk", "yatak", "dolap",
    "mobilya", "raf", "gardırop", "kanepe",
    # Araç
    "binek araç", "otomobil", "araba",
    # Yakıt / akaryakıt
    "benzin", "mazot", "dizel", "lpg", "akaryakıt", "motorin",
    # Hizmet (danışmanlık, yazılım, vb.)
    "danışmanlık", "consultancy", "yazılım", "software",
    "lisans", "abonelik", "hizmet", "servis", "bakım",
    "temizlik", "nakliye", "kargo",
    # Kırtasiye / ofis
    "kalem", "defter", "kağıt", "kartuş", "toner",
    "dosya", "zarfı", "fotokopi",
    # İnşaat / yapı
    "çimento", "tuğla", "demir", "boya", "boya malzeme",
    # Sigara / tütün
    "sigara", "tütün", "puro",
    # Alkol
    "alkol", "bira", "şarap", "viski", "rakı", "içki",
]

# Vergiden hiç düşülemeyen kalemler (KDV Kanunu Md.30)
NON_DEDUCTIBLE_KEYWORDS = [
    "alkol", "bira", "şarap", "viski", "rakı", "içki",
    "sigara", "tütün", "puro",
    "binek araç",  # kısıtlı (ticari ispatlanamıyorsa)
    "yemek", "restoran", "lokal", "kafe", "hamburger", "pizza"
]


def classify_item(item_name: str) -> Tuple[int, str, bool]:
    """
    Kalem adını alır ve (kdv_oranı, açıklama, kdv_indirilebilir_mi) döner.

    Returns:
        (tax_rate: int, label: str, is_deductible: bool)
    """
    name_lower = item_name.lower().strip()

    # Vergiden düşülemez mi?
    is_deductible = not any(kw in name_lower for kw in NON_DEDUCTIBLE_KEYWORDS)

    # %1 kontrolü (öncelikli kontrol — temel gıda)
    for kw in RATE_1_KEYWORDS:
        if kw in name_lower:
            return 1, "Temel Gıda / Tarım — %1 KDV", is_deductible

    # %10 kontrolü
    for kw in RATE_10_KEYWORDS:
        if kw in name_lower:
            return 10, "İndirimli Oran — %10 KDV", is_deductible

    # %20 anahtar kelime eşleşmesi
    for kw in RATE_20_KEYWORDS:
        if kw in name_lower:
            reason = "Standart Oran — %20 KDV"
            if not is_deductible:
                reason += " (KDV İndirilemez — Md.30)"
            return 20, reason, is_deductible

    # Varsayılan: %20 Standart
    return 20, "Standart Oran — %20 KDV", is_deductible


def classify_items(items: list[str]) -> list[dict]:
    """
    Kalem listesini toplu olarak sınıflandırır.

    Args:
        items: Fiş üzerindeki kalem adları listesi

    Returns:
        Her kalem için {"name", "tax_rate", "label", "is_deductible"} listesi
    """
    results = []
    for item in items:
        rate, label, deductible = classify_item(item)
        results.append({
            "name": item,
            "tax_rate": rate,
            "label": label,
            "is_deductible": deductible
        })
    return results


def compute_invoice_summary(classified_items: list[dict],
                             total_amount: float) -> dict:
    """
    Sınıflandırılmış kalemlerden fatura özeti hesaplar.
    Her KDV dilimi için ayrı ayrı tutar hesaplanır.
    """
    summary = {
        "rate_1": {"base": 0.0, "vat": 0.0},
        "rate_10": {"base": 0.0, "vat": 0.0},
        "rate_20": {"base": 0.0, "vat": 0.0},
        "total_deductible_vat": 0.0,
        "total_non_deductible_vat": 0.0,
        "dominant_rate": 20,    # Faturanın baskın KDV oranı
    }

    # Kalem sayısına göre oransal dağılım hesapla
    rate_counts = {1: 0, 10: 0, 20: 0}
    deductible_count = 0

    for item in classified_items:
        rate_counts[item["tax_rate"]] = rate_counts.get(item["tax_rate"], 0) + 1
        if item["is_deductible"]:
            deductible_count += 1

    total_items = len(classified_items) if classified_items else 1

    # Her grup için tahminî tutar dağılımı (kalem sayısı orantılı)
    for rate in [1, 10, 20]:
        count = rate_counts.get(rate, 0)
        if count > 0:
            portion = total_amount * (count / total_items)
            base = portion / (1 + rate / 100)
            vat = portion - base
            key = f"rate_{rate}"
            summary[key]["base"] = round(base, 2)
            summary[key]["vat"] = round(vat, 2)

            if all(
                classified_items[i]["is_deductible"]
                for i in range(total_items)
                if classified_items[i]["tax_rate"] == rate
            ):
                summary["total_deductible_vat"] += round(vat, 2)
            else:
                summary["total_non_deductible_vat"] += round(vat, 2)

    # Baskın oran
    dominant = max(rate_counts, key=lambda r: rate_counts[r])
    summary["dominant_rate"] = dominant
    summary["total_deductible_vat"] = round(summary["total_deductible_vat"], 2)
    summary["total_non_deductible_vat"] = round(summary["total_non_deductible_vat"], 2)

    return summary
