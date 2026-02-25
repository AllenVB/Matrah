package com.matrah.model;

public enum ExpenseCategory {
    FOOD, // Yemek (%10, 330 TL/gün sınırı - 2026)
    FUEL, // Yakıt (sadece %70 indirilebilir - KDV md.)
    VEHICLE_MAINTENANCE, // Araç bakım/onarım (sadece %70 indirilebilir)
    OFFICE, // Ofis malzemeleri (tamamı indirilebilir)
    IT_SERVICES, // Yazılım/BT hizmetleri (tamamı indirilebilir)
    TRAVEL, // Seyahat (ticari amaçlı - tamamı indirilebilir)
    ENTERTAINMENT, // Temsil / Eğlence (genellikle KKEG)
    HEALTH, // Sağlık (belirli limitler dahilinde)
    EDUCATION, // Eğitim/kurs (tamamı indirilebilir)
    RENT, // Kira gideri (tamamı indirilebilir)
    UTILITY, // Elektrik, su, doğalgaz
    OTHER // Diğer
}
