package com.archive.auth.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must be at most 100 characters")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Must be a valid email address")
    @Size(max = 150)
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 72, message = "Password must be 8–72 characters")
    private String password;

    @Size(max = 150)
    private String college;

    @Size(max = 100)
    private String degree;

    @Size(max = 100)
    private String department;

    @Min(value = 1, message = "Year must be between 1 and 6")
    @Max(value = 6, message = "Year must be between 1 and 6")
    private Byte year;
}
