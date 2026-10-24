package com.shopnex.demo.dto;

public class AuthResponseDto {

    private String token;
    private CustomerDto customer;
    private String message;

    public AuthResponseDto() {
    }

    public AuthResponseDto(String token, CustomerDto customer, String message) {
        this.token = token;
        this.customer = customer;
        this.message = message;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public CustomerDto getCustomer() {
        return customer;
    }

    public void setCustomer(CustomerDto customer) {
        this.customer = customer;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
