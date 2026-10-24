package com.platform.gateway.handler;

import java.net.ConnectException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.TimeoutException;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.web.reactive.error.ErrorWebExceptionHandler;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
@Order(-2)
public class GatewayErrorHandler implements ErrorWebExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GatewayErrorHandler.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public Mono<Void> handle(ServerWebExchange exchange, Throwable ex) {
        ServerHttpResponse response = exchange.getResponse();

        if (response.isCommitted()) {
            return Mono.error(ex);
        }

        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        HttpStatus status;
        String errorCode;
        String message;

        if (isConnectionFailure(ex)) {
            status = HttpStatus.SERVICE_UNAVAILABLE;
            errorCode = "DOWNSTREAM_SERVICE_UNAVAILABLE";
            message = "The downstream protected service is temporarily unavailable or unreachable.";
            log.warn("[GATEWAY_ERROR] Downstream connection failure for path '{}': {}",
                exchange.getRequest().getURI().getPath(), ex.getMessage());
        } else if (isTimeoutFailure(ex)) {
            status = HttpStatus.GATEWAY_TIMEOUT;
            errorCode = "GATEWAY_TIMEOUT";
            message = "The downstream protected service timed out.";
            log.warn("[GATEWAY_ERROR] Downstream timeout for path '{}': {}",
                exchange.getRequest().getURI().getPath(), ex.getMessage());
        } else if (ex instanceof ResponseStatusException rse) {
            status = HttpStatus.valueOf(rse.getStatusCode().value());
            errorCode = "GATEWAY_REQUEST_ERROR";
            message = rse.getReason() != null ? rse.getReason() : "Gateway processing error.";
        } else {
            status = HttpStatus.BAD_GATEWAY;
            errorCode = "BAD_GATEWAY";
            message = "An error occurred while proxying request to upstream service.";
            log.error("[GATEWAY_ERROR] Unexpected gateway routing error for path '{}'",
                exchange.getRequest().getURI().getPath(), ex);
        }

        response.setStatusCode(status);

        Map<String, Object> errorAttributes = Map.of(
            "error", errorCode,
            "message", message,
            "path", exchange.getRequest().getURI().getPath(),
            "timestamp", Instant.now().toString()
        );

        byte[] bytes;
        try {
            bytes = objectMapper.writeValueAsBytes(errorAttributes);
        } catch (JsonProcessingException e) {
            bytes = ("{\"error\":\"" + errorCode + "\",\"message\":\"" + message + "\"}").getBytes(StandardCharsets.UTF_8);
        }

        DataBuffer buffer = response.bufferFactory().wrap(bytes);
        return response.writeWith(Mono.just(buffer));
    }

    private boolean isConnectionFailure(Throwable ex) {
        Throwable current = ex;
        while (current != null) {
            if (current instanceof ConnectException
                || current.getClass().getName().contains("AnnotatedConnectException")
                || (current.getMessage() != null && current.getMessage().toLowerCase().contains("connection refused"))) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }

    private boolean isTimeoutFailure(Throwable ex) {
        Throwable current = ex;
        while (current != null) {
            if (current instanceof TimeoutException
                || current.getClass().getName().contains("ReadTimeoutException")
                || (current.getMessage() != null && current.getMessage().toLowerCase().contains("timeout"))) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }
}
