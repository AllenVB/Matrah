package com.matrah.dto.auth;

import com.matrah.model.UserType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "Email can not be empty")
    @Email(message = "Please provide a valid email format")
    private String email;

    @NotBlank(message = "Password can not be empty")
    private String password;

    private String taxId;

    @NotNull(message = "User type is required: FREELANCER or ACCOUNTANT")
    private UserType userType;
}
