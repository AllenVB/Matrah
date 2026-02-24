# Sadece Serve (Nginx ile Sunma) - Lokal build'i kullan
FROM nginx:alpine
# Özel Nginx yapılandırmasını kopyala
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Build edilmiş lokal 'dist' klasörünü Nginx web root'una aktar
COPY dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
