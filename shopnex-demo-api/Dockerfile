FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app

# Create a non-privileged application user
RUN addgroup -S shopnex && adduser -S shopnex -G shopnex
USER shopnex:shopnex

# Copy packaged fat jar
COPY --chown=shopnex:shopnex target/*.jar app.jar

# Configuration defaults
ENV SERVER_PORT=8081 \
    JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

EXPOSE 8081

HEALTHCHECK --interval=15s --timeout=5s --retries=5 --start-period=20s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${SERVER_PORT}/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
