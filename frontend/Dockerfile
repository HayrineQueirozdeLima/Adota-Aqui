# Imagem do front pro docker compose (docker-compose.yml, na raiz).
# No ar, quem builda o front é o Netlify (netlify.toml): este arquivo é só pra rodar tudo na máquina com um comando

# Etapa 1: gera o site pronto (a pasta dist)
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --no-audit --no-fund
COPY . .
# Endereço da API. O Vite grava ele dentro do build, por isso entra aqui e não quando o container sobe
ARG VITE_API_URL=http://localhost:8080
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Etapa 2: só serve os arquivos prontos, com o nginx, numa imagem bem menor
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
