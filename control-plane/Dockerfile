FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY target/*.jar app.jar
ENV CONTROL_PLANE_PORT=8082
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]
