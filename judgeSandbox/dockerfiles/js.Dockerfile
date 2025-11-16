FROM node:20-alpine
WORKDIR /app
COPY . .
CMD ["bash", "run.sh", "input.txt", "output.txt"]
