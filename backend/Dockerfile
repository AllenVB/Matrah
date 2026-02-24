# Maven kullanarak temiz bir ortamda build işlemi
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder
WORKDIR /app
# Pom dosyasını kopyalayıp dependency'leri cache'liyoruz
COPY pom.xml .
RUN mvn dependency:go-offline

# Kaynak kodlarını kopyalayıp build alıyoruz
COPY src ./src
RUN mvn clean package -DskipTests

# Hafif JRE ortamında çalıştırıyoruz
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/backend-0.0.1-SNAPSHOT.jar app.jar

# Google Application Credentials vb. dışarıdan çevresel değişkenle içeriye verilir
ENV DB_HOST=postgres
ENV DB_PORT=5432
ENV DB_NAME=matrah
ENV DB_USER=postgres
ENV DB_PASSWORD=postgres
ENV AI_SERVICE_URL=http://ai-service:8000/analyze

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
