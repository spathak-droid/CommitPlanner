package com.weeklycommit.controller;

import com.weeklycommit.TestcontainersConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfig.class)
@ActiveProfiles("test")
class AuthorizationTest {

    @Autowired private MockMvc mockMvc;
    private String icToken;
    private String managerToken;

    @BeforeEach
    void setUp() throws Exception {
        icToken = getToken("user-1", "password123");
        managerToken = getToken("manager-1", "password123");
    }

    private String getToken(String userId, String password) throws Exception {
        var result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(String.format("{\"userId\": \"%s\", \"password\": \"%s\"}", userId, password)))
                .andReturn();
        var body = result.getResponse().getContentAsString();
        return body.split("\"token\":\"")[1].split("\"")[0];
    }

    @Test
    void icCanAccessWeeklyPlans() throws Exception {
        mockMvc.perform(get("/api/weekly-plans")
                .header("Authorization", "Bearer " + icToken))
                .andExpect(status().isOk());
    }

    @Test
    void icCannotAccessManagerEndpoints() throws Exception {
        // requireManager() throws IllegalArgumentException → GlobalExceptionHandler returns 400
        mockMvc.perform(get("/api/manager/team-plans")
                .param("weekStart", "2026-06-08")
                .header("Authorization", "Bearer " + icToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    void managerCanAccessTeamPlans() throws Exception {
        mockMvc.perform(get("/api/manager/team-plans")
                .param("weekStart", "2026-06-08")
                .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk());
    }

    @Test
    void unauthenticatedCannotAccessProtectedEndpoints() throws Exception {
        mockMvc.perform(get("/api/weekly-plans"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/rcdo/tree"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void icCanAccessRcdoTree() throws Exception {
        mockMvc.perform(get("/api/rcdo/tree")
                .header("Authorization", "Bearer " + icToken))
                .andExpect(status().isOk());
    }
}
