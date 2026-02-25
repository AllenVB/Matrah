package com.matrah.controller;

import com.matrah.model.User;
import com.matrah.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        String userEmail = (authentication != null && authentication.isAuthenticated()) ? authentication.getName()
                : "user@gmail.com";
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Şifre bilgisinin dönmemesi için Map kullanıyoruz
        return ResponseEntity.ok(java.util.Map.of(
                "email", user.getEmail(),
                "taxId", user.getTaxId(),
                "userType", user.getUserType().name()));
    }
}
