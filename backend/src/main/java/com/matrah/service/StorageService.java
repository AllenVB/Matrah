package com.matrah.service;

import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
public class StorageService {

    @Value("${gcp.storage.bucket-name:matrah-invoices-bucket}")
    private String bucketName;

    private final Storage storage;

    public StorageService() {
        // gcp-starter-storage automatically configures credentials if environment variables are set.
        // For local development, ensure GOOGLE_APPLICATION_CREDENTIALS is set.
        this.storage = StorageOptions.getDefaultInstance().getService();
    }

    public String uploadFile(MultipartFile file) throws IOException {
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        
        String uniqueFileName = UUID.randomUUID().toString() + extension;
        BlobId blobId = BlobId.of(bucketName, uniqueFileName);
        BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                .setContentType(file.getContentType())
                .build();

        storage.create(blobInfo, file.getBytes());

        // Assuming public access is configured, or use Signed URLs for private buckets.
        // Format: https://storage.googleapis.com/{bucketName}/{fileName}
        return String.format("https://storage.googleapis.com/%s/%s", bucketName, uniqueFileName);
    }
}
