# Build stage - Use smaller base image
FROM maven:3.9.6-eclipse-temurin-17-alpine as builder
WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests

# Runtime stage - Use even smaller JRE image
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
