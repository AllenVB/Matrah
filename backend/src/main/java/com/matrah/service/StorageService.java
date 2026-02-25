package com.matrah.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

/**
 * Geçici StorageService: GCS kimlik bilgileri hazır olana kadar
 * dosyaları Docker volume içine kaydeder ve sunucudan erişilebilir URL döner.
 * GCS entegrasyonu hazır olduğunda bu sınıf GCS versiyonuyla değiştirilecektir.
 */
@Service
public class StorageService {

    // Docker container içindeki kayıt klasörü (/tmp/uploads)
    private static final String UPLOAD_DIR = "/tmp/uploads/";
    // Frontend'den erişilebilir URL prefix (backend üzerinden servis edilecek)
    private static final String BASE_URL = "/api/uploads/";

    public String uploadFile(MultipartFile file) throws IOException {
        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        String uniqueFileName = UUID.randomUUID().toString() + extension;
        Path destinationPath = uploadPath.resolve(uniqueFileName);
        Files.write(destinationPath, file.getBytes());

        // Backend API üzerinden erişilebilir URL döndür
        return BASE_URL + uniqueFileName;
    }
}
