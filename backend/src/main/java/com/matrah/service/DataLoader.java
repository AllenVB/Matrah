package com.matrah.service;

import com.matrah.model.User;
import com.matrah.model.UserType;
import com.matrah.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataLoader implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataLoader(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        // Eğer veritabanında hiç kullanıcı yoksa, default test kullanıcısını oluştur.
        if (userRepository.count() == 0) {
            User demoUser = new User();
            demoUser.setEmail("user@gmail.com"); // Email formatına uygun demo kullanıcı
            demoUser.setPassword(passwordEncoder.encode("123456"));
            demoUser.setUserType(UserType.FREELANCER);
            userRepository.save(demoUser);
            System.out.println("Demo kullanıcısı başarıyla oluşturuldu: user / 123456");
        }
    }
}
