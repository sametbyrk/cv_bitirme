FROM node:20-alpine

WORKDIR /app

# OpenSSL ve sistem bağımlılıkları (Prisma için zorunludur)
RUN apk add --no-cache openssl libc6-compat

# Paket tanımlarını ve Prisma şemasını kopyala
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Bağımlılıkları yükle ve Linux uyumlu Prisma client'ı oluştur
RUN npm install
RUN npx prisma generate

# Kaynak kodları kopyala
COPY . .

# Next.js portu
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "run", "dev"]
