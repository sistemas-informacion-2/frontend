# syntax=docker/dockerfile:1

##
# Etapa base.
##
FROM node:24-alpine AS base
WORKDIR /app

##
# Etapa deps: instala dependencias con cache por lockfile.
##
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

##
# Etapa dev: servidor de Vite en modo desarrollo.
# Lee frontend/.env y frontend/.env.development.
# --host expone el servidor fuera del contenedor; sin eso solo escucha
# en localhost y el puerto publicado queda muerto.
##
FROM base AS dev
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

##
# Etapa build: genera los estaticos en dist/.
# Vite lee frontend/.env y frontend/.env.production y los incrusta AQUI,
# en tiempo de compilacion. Cambiarlos obliga a reconstruir la imagen:
# no basta con reiniciar el contenedor.
##
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Railway (y cualquier build de Docker) no inyecta sus Variables solas: hay
# que declararlas como ARG para que build-arg las reciba, y como ENV para que
# el proceso de "npm run build" (Vite) las vea en su entorno.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
# API key del probador con IA (Decart). Queda visible en el bundle, como en la app movil.
ARG VITE_DECART_API_KEY
ENV VITE_DECART_API_KEY=$VITE_DECART_API_KEY
RUN npm run build

##
# Etapa runner: nginx sirviendo los estaticos.
##
FROM nginx:alpine AS runner
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
