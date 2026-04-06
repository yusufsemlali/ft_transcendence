FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY shared/contracts ./shared/contracts
COPY chat/ .

RUN printf 'packages:\n  - .\n  - shared/contracts\n' > pnpm-workspace.yaml
RUN pnpm install --no-frozen-lockfile

EXPOSE 4000

CMD ["pnpm", "run", "start"]
