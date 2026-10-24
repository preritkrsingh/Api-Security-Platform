package com.platform.controlplane.dto;

import java.time.Instant;
import com.platform.controlplane.model.ConnectivityStatus;

public record ConnectivityTestResult(
    String apiId,
    ConnectivityStatus connectivityStatus,
    long latencyMs,
    Instant checkedAt,
    String message
) {}
