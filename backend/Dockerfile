# Build stage - Use Maven image with Java 21 support
FROM maven:3.9.6-eclipse-temurin-21-alpine as builder
WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests

# Runtime stage - Use JRE 21
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
