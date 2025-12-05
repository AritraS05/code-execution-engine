FROM node:20-slim
WORKDIR /app
COPY . /app
RUN apt-get update && apt-get install -y coreutils timeout || true && rm -rf /var/lib/apt/lists/* || true
RUN chmod +x /app/run.sh
CMD ["bash", "run.sh", "input.txt", "user_out.txt"]
