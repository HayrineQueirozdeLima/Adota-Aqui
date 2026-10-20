# Etapa 1: compila o projeto e gera o .jar
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q dependency:go-offline
COPY src ./src
RUN mvn -q -DskipTests package

# Etapa 2: só roda o .jar, numa imagem bem menor
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
# O plano gratuito do Render tem 512 MB, então a JVM fica limitada a 75% disso
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-XX:+UseSerialGC", "-jar", "app.jar"]